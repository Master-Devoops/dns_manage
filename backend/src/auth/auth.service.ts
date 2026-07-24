import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private activityLogs: ActivityLogsService,
  ) {}

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || '15m',
    });

    const refreshTokenValue = randomUUID() + randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    await this.activityLogs.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      message: `${user.name} logged in`,
    });

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refresh(token: string) {
    const record = await this.prisma.refreshToken.findUnique({ where: { token } });

    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    return this.issueTokens(user);
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Revoke all existing refresh tokens on password change
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * NOTE: Forgot-password flow requires an email provider (SMTP/SES/SendGrid etc).
   * This generates a short-lived reset token; wire up an email service in production
   * to actually deliver it to the user instead of returning it in the response.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal whether the email exists
      return { message: 'If that account exists, a reset link has been sent' };
    }

    const resetToken = this.jwt.sign(
      { sub: user.id, purpose: 'password-reset' },
      { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: '15m' },
    );

    // TODO: send resetToken via email instead of logging
    return { message: 'If that account exists, a reset link has been sent', resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.config.get('JWT_ACCESS_SECRET') });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: payload.sub },
      data: { revoked: true },
    });

    return { message: 'Password reset successfully' };
  }
}
