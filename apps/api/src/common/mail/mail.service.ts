import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') || 'onboarding@resend.dev';

    if (apiKey && apiKey !== 're_placeholder' && apiKey.trim() !== '') {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend Mail Service initialized successfully.');
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Falling back to local console logging for outgoing mails.',
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<boolean> {
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: `ZeroX Streaming <${this.fromEmail}>`,
          to,
          subject,
          html: htmlContent,
        });
        this.logger.log(
          `Email successfully dispatched to ${to}. Subject: "${subject}"`,
        );
        return true;
      } catch (error) {
        this.logger.error(`Failed to send email to ${to} via Resend.`, error);
        return false;
      }
    } else {
      this.logger.log(`
=========================================
[MOCKED OUTBOX EMAIL DISPATCH]
To:      ${to}
Subject: ${subject}
Content:
${htmlContent}
=========================================
      `);
      return true;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/verify-email?token=${token}`;
    const subject = 'Verify your ZeroX Account';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #141414; color: #ffffff; border-radius: 8px;">
        <h1 style="color: #E50914; text-align: center;">ZEROX</h1>
        <p>Thank you for signing up to ZeroX! Please confirm your email address by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #E50914; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666666;">If you didn't create an account on ZeroX, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendEmail(to, subject, htmlContent);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/reset-password?token=${token}`;
    const subject = 'Reset your ZeroX Password';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #141414; color: #ffffff; border-radius: 8px;">
        <h1 style="color: #E50914; text-align: center;">ZEROX</h1>
        <p>You requested a password reset for your ZeroX account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #E50914; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666666;">This password reset link is valid for 1 hour. If you didn't make this request, please secure your account.</p>
      </div>
    `;
    return this.sendEmail(to, subject, htmlContent);
  }
}
