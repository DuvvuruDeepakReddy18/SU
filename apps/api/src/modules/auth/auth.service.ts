import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User, UserRole } from '@prisma/client';
import type { JwtPayload } from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { OAuthSyncDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: { email: string; password: string; fullName: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already registered');

    const institution = await this.resolveInstitution(input.email);
    if (!institution) {
      throw new BadRequestException(
        'Sign-up is restricted to verified institution email domains. Contact your institution.',
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const slug = await this.generateSlug(input.fullName);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: 'STUDENT',
        institutionId: institution.id,
        studentProfile: {
          create: { fullName: input.fullName, sharableSlug: slug, isPublic: true },
        },
      },
    });
    return this.issueTokens(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  async syncOAuthUser(input: OAuthSyncDto) {
    let user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      const institution = await this.resolveInstitution(input.email);
      if (!institution) {
        throw new BadRequestException(
          'This OAuth account is not associated with a verified institution domain.',
        );
      }
      const slug = await this.generateSlug(input.fullName);
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          role: 'STUDENT',
          institutionId: institution.id,
          emailVerified: new Date(),
          studentProfile: {
            create: {
              fullName: input.fullName,
              sharableSlug: slug,
              avatarUrl: input.avatarUrl ?? null,
              isPublic: true,
            },
          },
        },
      });
    }
    return this.issueTokens(user);
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, institution: true },
    });
  }

  private issueTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      institutionId: user.institutionId ?? null,
    };
    // Access token lives 7 days in dev (matches NextAuth session sensibly).
    // For prod, drop to 15m and implement refresh via the refreshToken below.
    const accessTtl = process.env.NODE_ENV === 'production' ? '15m' : '7d';
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: accessTtl }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '30d' }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  private async resolveInstitution(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    return this.prisma.institution.findUnique({ where: { domain } });
  }

  private async generateSlug(name: string) {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    let candidate = base || `user-${Date.now()}`;
    let suffix = 0;

    while (true) {
      const clash = await this.prisma.studentProfile.findUnique({
        where: { sharableSlug: candidate },
      });
      if (!clash) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }
}
