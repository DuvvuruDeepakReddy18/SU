import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadSchema, type JwtPayload } from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
    });
  }

  async validate(raw: unknown): Promise<JwtPayload> {
    const payload = JwtPayloadSchema.parse(raw);
    // Tokens are long-lived (30d, no refresh flow), so signature + expiry alone
    // isn't enough: reject soft-deleted accounts here so a deleted (or banned)
    // user can't keep hitting the API with a still-valid token. One indexed
    // lookup per authenticated request — the app needs the DB on every route
    // anyway, so this adds no real availability coupling.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { deletedAt: true, role: true, institutionId: true },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('This account is no longer active.');
    }
    // Trust the live role + institution from the DB over the values baked into
    // the (up to 30d-lived) token, so a role or institution change takes effect
    // on the next request instead of waiting for a re-login. Same indexed
    // lookup we already do for the deletedAt check — no extra query.
    return { ...payload, role: user.role, institutionId: user.institutionId };
  }
}
