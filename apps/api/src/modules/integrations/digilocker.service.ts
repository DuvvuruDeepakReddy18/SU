import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../../infra/redis/redis.service';

/**
 * DigiLocker (MeriPehchaan) OAuth 2.0 — the real handshake, fully scaffolded but
 * GATED. Every method 503s until DIGILOCKER_CLIENT_ID + DIGILOCKER_CLIENT_SECRET
 * are set, because the flow can't function without Govt-of-India onboarding
 * (a registered client + sandbox access). Once those env vars exist this is the
 * complete flow: authorize → callback (CSRF state) → token exchange → identity.
 *
 * Endpoints default to the MeriPehchaan host; override with DIGILOCKER_BASE_URL
 * to point at the sandbox during integration.
 */
@Injectable()
export class DigiLockerService {
  private readonly log = new Logger(DigiLockerService.name);
  private readonly base =
    process.env.DIGILOCKER_BASE_URL ?? 'https://digilocker.meripehchaan.gov.in/public/oauth2/1';

  constructor(private readonly redis: RedisService) {}

  private get config() {
    return {
      clientId: process.env.DIGILOCKER_CLIENT_ID,
      clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
      redirectUri: `${process.env.API_PUBLIC_URL ?? 'http://localhost:4000'}/api/v1/integrations/digilocker/callback`,
    };
  }

  isConfigured(): boolean {
    const { clientId, clientSecret } = this.config;
    return !!clientId && !!clientSecret;
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'DigiLocker integration is pending Govt-of-India API onboarding. Stay tuned.',
      );
    }
  }

  /**
   * Step 1: build the authorize URL the user is redirected to. A random `state`
   * is stored in Redis (10 min TTL) bound to the user, to defend the callback
   * against CSRF and to recover the user without a session on the redirect.
   */
  async buildAuthorizeUrl(userId: string): Promise<{ url: string }> {
    this.assertConfigured();
    const { clientId, redirectUri } = this.config;
    const state = randomBytes(16).toString('hex');
    await this.redis.client.set(`digilocker:state:${state}`, userId, 'EX', 600);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
    });
    return { url: `${this.base}/authorize?${params.toString()}` };
  }

  /**
   * Step 2: handle the redirect back. Validates `state`, exchanges the code for
   * a token, and fetches the user's verified identity (e-Aadhaar name etc.).
   *
   * TODO (on activation): persist the link and cross-check the verified legal
   * name against StudentProfile.governmentName to strengthen L1. The exact
   * identity response shape must be confirmed against the DigiLocker sandbox.
   */
  async handleCallback(code: string, state: string) {
    this.assertConfigured();
    const userId = await this.redis.client.get(`digilocker:state:${state}`);
    if (!userId) throw new BadRequestException('Invalid or expired DigiLocker session.');
    await this.redis.client.del(`digilocker:state:${state}`);

    const token = await this.exchangeCode(code);
    const identity = await this.fetchIdentity(token.access_token);
    this.log.log(`DigiLocker identity fetched for user ${userId}`);
    return { ok: true, userId, identity };
  }

  private async exchangeCode(code: string): Promise<{ access_token: string }> {
    const { clientId, clientSecret, redirectUri } = this.config;
    const res = await fetch(`${this.base}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) {
      throw new BadGatewayException(`DigiLocker token exchange failed (${res.status}).`);
    }
    return (await res.json()) as { access_token: string };
  }

  private async fetchIdentity(accessToken: string): Promise<unknown> {
    // The issued-documents / user endpoint sits at the API root (not under oauth2).
    const root = this.base.replace(/\/oauth2\/1$/, '');
    const res = await fetch(`${root}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new BadGatewayException(`DigiLocker identity fetch failed (${res.status}).`);
    }
    return res.json();
  }
}
