import { Injectable, UnauthorizedException, BadRequestException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../../common/mail/mail.service";
import { parseUserAgent } from "../../common/utils/user-agent.util";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  VerifyTwoFactorInput,
} from "@zerox/shared";
import { User, UserDevice } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) {
      throw new BadRequestException("Email already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Generate validation email token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    const user = await this.usersService.create({
      email: input.email,
      passwordHash,
      isEmailVerified: false,
      emailVerificationToken,
    });

    // Send verification email asynchronously
    this.mailService.sendVerificationEmail(user.email, emailVerificationToken).catch((err) => {
      this.logger.error(`Failed to send signup verification email to ${user.email}`, err);
    });

    return {
      message: "Registration successful. Please check your email to verify your account.",
      userId: user.id,
    };
  }

  async login(input: LoginInput, ipAddress: string, userAgent: string) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Check if account is locked
    if (user.accountStatus === "LOCKED" && user.lockUntil) {
      const now = new Date();
      if (now < user.lockUntil) {
        const remainingMinutes = Math.ceil((user.lockUntil.getTime() - now.getTime()) / 60000);
        throw new UnauthorizedException(`Account is locked. Please try again in ${remainingMinutes} minutes.`);
      } else {
        // Unlock account
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            accountStatus: "ACTIVE",
            loginAttempts: 0,
            lockUntil: null,
          },
        });
      }
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      // Increment login attempts
      const updatedAttempts = user.loginAttempts + 1;
      const isLocking = updatedAttempts >= 5;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: updatedAttempts,
          accountStatus: isLocking ? "LOCKED" : user.accountStatus,
          lockUntil: isLocking ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      // Log failed login event
      await this.logSessionEvent(user.id, null, ipAddress, userAgent, false, "Invalid password");

      if (isLocking) {
        throw new UnauthorizedException("Account locked due to 5 failed attempts. Try again in 15 minutes.");
      }
      throw new UnauthorizedException(`Invalid email or password. Attempt ${updatedAttempts} of 5.`);
    }

    // Reset login attempts on successful credentials check
    if (user.loginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockUntil: null,
        },
      });
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // Issue a temporary 2FA token
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, is2faPending: true },
        { expiresIn: "5m" }
      );

      return {
        isTwoFactorRequired: true,
        tempToken,
        message: "Two-factor authentication code required.",
      };
    }

    // Standard session issuance
    return this.issueSession(user, ipAddress, userAgent);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired verification link");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    return { message: "Email address verified successfully. You can now log in." };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Security best practice: don't reveal user existence
      return { message: "Password reset link will be sent if the email is registered." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    // Store reset token (can be stored in a temp column, or we can recycle emailVerificationToken)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: resetToken }, // Reuse token field for reset link
    });

    this.mailService.sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      this.logger.error(`Failed to send password reset link to ${user.email}`, err);
    });

    return { message: "Password reset link will be sent if the email is registered." };
  }

  async resetPassword(input: ResetPasswordInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: input.token,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerificationToken: null, // Revoke token
      },
    });

    // Revoke all existing sessions to secure account
    await this.revokeAllSessions(user.id);

    return { message: "Password reset successful. All active sessions have been terminated. Please log in." };
  }

  // 2FA TOTP Actions
  async generateTwoFactorSecret(user: User) {
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, "ZeroX Streaming", secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Save secret temporarily in db (encrypted or plaintext for now - plaintext for otplib evaluation)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    // Generate recovery codes
    const rawCodes: string[] = [];
    const hashedCodes: string[] = [];
    const salt = await bcrypt.genSalt(10);

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 chars code e.g. FE390A1290
      rawCodes.push(code);
      const hashed = await bcrypt.hash(code, salt);
      hashedCodes.push(hashed);
    }

    // Save hashed recovery codes
    await this.prisma.user.update({
      where: { id: user.id },
      data: { recoveryCodes: hashedCodes },
    });

    return {
      qrCode: qrCodeDataUrl,
      secret,
      recoveryCodes: rawCodes,
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException("2FA is not initialized.");
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid authentication code.");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { message: "Two-factor authentication enabled successfully." };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException("2FA is not active on this account.");
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid authentication code.");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        recoveryCodes: [],
      },
    });

    return { message: "Two-factor authentication disabled successfully." };
  }

  async verifyTwoFactorCode(input: VerifyTwoFactorInput, ipAddress: string, userAgent: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(input.tempToken);
    } catch {
      throw new UnauthorizedException("Temporary session token has expired or is invalid.");
    }

    if (!payload.is2faPending) {
      throw new BadRequestException("Invalid operation.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    // Verify OTP code
    let isValid = false;
    if (user.twoFactorSecret) {
      isValid = authenticator.verify({
        token: input.code,
        secret: user.twoFactorSecret,
      });
    }

    // If OTP is invalid, check if code matches recovery codes
    if (!isValid && user.recoveryCodes.length > 0) {
      for (const hashedCode of user.recoveryCodes) {
        const match = await bcrypt.compare(input.code, hashedCode);
        if (match) {
          isValid = true;
          // Revoke/Delete this recovery code (single use)
          const updatedCodes = user.recoveryCodes.filter((c) => c !== hashedCode);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { recoveryCodes: updatedCodes },
          });
          break;
        }
      }
    }

    if (!isValid) {
      throw new UnauthorizedException("Invalid authentication code.");
    }

    // Credentials validated, issue complete tokens
    return this.issueSession(user, ipAddress, userAgent);
  }

  // Token rotation and device session tracking
  async refreshTokens(refreshToken: string, ipAddress: string, userAgent: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid or expired session refresh token.");
    }

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const activeToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!activeToken || activeToken.isRevoked || new Date() > activeToken.expiresAt) {
      // Reuse detection: If token exists in DB but is already marked revoked, indicating theft
      if (activeToken && activeToken.isRevoked) {
        this.logger.warn(`Potential Refresh Token Theft detected for User ID ${payload.sub} on Device ${payload.deviceId}. Revoking all sessions.`);
        await this.revokeAllSessions(payload.sub);
      }
      throw new UnauthorizedException("Session has expired or been terminated.");
    }

    // Issue rotated tokens
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    const newPayload = { sub: user.id, email: user.email, deviceId: payload.deviceId };
    const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: "15m" });
    const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: "7d" });

    // Rotate refresh token hash in DB
    const newHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: activeToken.id },
        data: { isRevoked: true }, // Revoke old token
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          deviceId: payload.deviceId,
          tokenHash: newHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
      this.prisma.userDevice.update({
        where: { deviceId: payload.deviceId },
        data: {
          ipAddress,
          userAgent,
          lastActiveAt: new Date(),
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    try {
      const payload = this.jwtService.verify(refreshToken);
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      
      // Revoke the refresh token
      await this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { isRevoked: true },
      });

      // Optionally delete the UserDevice record on explicit logouts
      await this.prisma.userDevice.deleteMany({
        where: { deviceId: payload.deviceId },
      });
    } catch {
      // Suppress errors during logout token parsing
    }
  }

  async listUserDevices(userId: string): Promise<UserDevice[]> {
    return this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastActiveAt: "desc" },
    });
  }

  async revokeSession(userId: string, deviceId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({
        where: { userId, deviceId },
      }),
      this.prisma.userDevice.deleteMany({
        where: { userId, deviceId },
      }),
    ]);
    return { message: "Device session revoked successfully." };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.userDevice.deleteMany({ where: { userId } }),
    ]);
    return { message: "All device sessions revoked." };
  }

  // Private Helper: Issuing sessions and updating device logs
  private async issueSession(user: User, ipAddress: string, userAgent: string) {
    const deviceId = crypto.randomUUID();
    const { browser, os } = parseUserAgent(userAgent);

    const payload = { sub: user.id, email: user.email, deviceId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Persist session details
    await this.prisma.$transaction([
      // Log Device
      this.prisma.userDevice.upsert({
        where: { deviceId },
        update: {
          lastActiveAt: new Date(),
          ipAddress,
          userAgent,
        },
        create: {
          userId: user.id,
          deviceId,
          deviceName: `${browser} on ${os}`,
          os,
          browser,
          ipAddress,
          userAgent,
        },
      }),
      // Save Refresh Token Hash
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          deviceId,
          tokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Audit logs
    await this.logSessionEvent(user.id, deviceId, ipAddress, userAgent, true);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  private async logSessionEvent(
    userId: string,
    deviceId: string | null,
    ipAddress: string,
    userAgent: string,
    status: boolean,
    failureReason: string | null = null
  ) {
    const { browser, os } = parseUserAgent(userAgent);
    await this.prisma.$transaction([
      this.prisma.loginHistory.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          os,
          browser,
          status,
          failureReason,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: status ? "LOGIN" : "LOGIN_FAILED",
          resource: "Auth",
          details: { deviceId, ipAddress, failureReason } as any,
          ipAddress,
        },
      }),
    ]);
  }
}
