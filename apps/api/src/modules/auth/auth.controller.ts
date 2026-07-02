import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Req,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import * as express from "express";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {
  RegisterInputSchema,
  LoginInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  VerifyTwoFactorInputSchema,
} from "@zerox/shared";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyTwoFactorDto,
} from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(RegisterInputSchema))
  async register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginInputSchema))
  async login(
    @Body() input: LoginDto,
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response
  ) {
    const ipAddress = request.ip || request.headers["x-forwarded-for"] as string || "127.0.0.1";
    const userAgent = request.headers["user-agent"] || "";

    const result = await this.authService.login(input, ipAddress, userAgent);

    if ("isTwoFactorRequired" in result) {
      return result;
    }

    // Set JWT cookies
    response.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    response.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "Login successful",
      user: result.user,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response
  ) {
    const refreshToken = request.cookies?.["refreshToken"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is missing");
    }

    const ipAddress = request.ip || request.headers["x-forwarded-for"] as string || "127.0.0.1";
    const userAgent = request.headers["user-agent"] || "";

    const result = await this.authService.refreshTokens(refreshToken, ipAddress, userAgent);

    response.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    response.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: "Tokens refreshed successfully" };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response
  ) {
    const refreshToken = request.cookies?.["refreshToken"];
    await this.authService.logout(refreshToken);
    response.clearCookie("accessToken");
    response.clearCookie("refreshToken");
    return { message: "Logout successful" };
  }

  @Get("verify-email")
  async verifyEmail(@Query("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ForgotPasswordInputSchema))
  async forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ResetPasswordInputSchema))
  async resetPassword(@Body() input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  @Post("2fa/verify")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(VerifyTwoFactorInputSchema))
  async verifyTwoFactor(
    @Body() input: VerifyTwoFactorDto,
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response
  ) {
    const ipAddress = request.ip || request.headers["x-forwarded-for"] as string || "127.0.0.1";
    const userAgent = request.headers["user-agent"] || "";

    const result = await this.authService.verifyTwoFactorCode(input, ipAddress, userAgent);

    // Set JWT cookies
    response.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    response.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "2FA verified successfully",
      user: result.user,
    };
  }

  // Session Management (requires login)
  @UseGuards(JwtAuthGuard)
  @Get("devices")
  async getActiveDevices(@Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.authService.listUserDevices(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("devices/revoke/:deviceId")
  @HttpCode(HttpStatus.OK)
  async revokeDevice(
    @Param("deviceId") deviceId: string,
    @Req() request: express.Request
  ) {
    const userId = (request as any).user.id;
    return this.authService.revokeSession(userId, deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("devices/revoke-all")
  @HttpCode(HttpStatus.OK)
  async revokeAllDevices(@Req() request: express.Request) {
    const userId = (request as any).user.id;
    return this.authService.revokeAllSessions(userId);
  }

  // 2FA Setup Management
  @UseGuards(JwtAuthGuard)
  @Post("2fa/generate")
  @HttpCode(HttpStatus.OK)
  async generate2fa(@Req() request: express.Request) {
    const user = (request as any).user;
    return this.authService.generateTwoFactorSecret(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/enable")
  @HttpCode(HttpStatus.OK)
  async enable2fa(@Req() request: express.Request, @Body("code") code: string) {
    const userId = (request as any).user.id;
    return this.authService.enableTwoFactor(userId, code);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/disable")
  @HttpCode(HttpStatus.OK)
  async disable2fa(@Req() request: express.Request, @Body("code") code: string) {
    const userId = (request as any).user.id;
    return this.authService.disableTwoFactor(userId, code);
  }
}
