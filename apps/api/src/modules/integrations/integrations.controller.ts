import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IntegrationsService, type IntegrationProvider } from './integrations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

const KNOWN: IntegrationProvider[] = ['github', 'linkedin', 'leetcode', 'coursera'];

function assertProvider(p: string): asserts p is IntegrationProvider {
  if (!(KNOWN as readonly string[]).includes(p)) {
    throw new BadRequestException(`Unknown provider ${p}`);
  }
}

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload) {
    return this.svc.list(u.sub);
  }

  @Post(':provider/connect')
  connect(@CurrentUser() u: JwtPayload, @Param('provider') provider: string) {
    assertProvider(provider);
    return this.svc.startConnect(provider, u.sub);
  }

  @Get(':provider/callback')
  callback(
    @CurrentUser() u: JwtPayload,
    @Param('provider') provider: string,
    @Query('code') code: string,
  ) {
    assertProvider(provider);
    if (!code) throw new BadRequestException('Missing code');
    return this.svc.handleCallback(u.sub, provider, code);
  }

  @Post(':provider/exchange')
  exchange(
    @CurrentUser() u: JwtPayload,
    @Param('provider') provider: string,
    @Body() body: { code: string },
  ) {
    assertProvider(provider);
    if (!body?.code) throw new BadRequestException('Missing code');
    return this.svc.handleCallback(u.sub, provider, body.code);
  }

  @Post(':provider/sync')
  sync(@CurrentUser() u: JwtPayload, @Param('provider') provider: string) {
    assertProvider(provider);
    return this.svc.sync(u.sub, provider);
  }

  @Delete(':provider')
  remove(@CurrentUser() u: JwtPayload, @Param('provider') provider: string) {
    assertProvider(provider);
    return this.svc.disconnect(u.sub, provider);
  }

  /**
   * DigiLocker stub. The real flow requires Govt-of-India onboarding +
   * issued client_id/secret. Until DIGILOCKER_CLIENT_ID is set in env, we
   * surface a clear 503 so the frontend can show "Coming soon".
   * When set, returns the OAuth authorize URL the user should be redirected
   * to (TODO: actual token exchange in a follow-up).
   */
  @Post('digilocker/connect')
  digiLockerConnect(@CurrentUser() u: JwtPayload) {
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    if (!clientId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'DigiLocker integration is pending Govt-of-India API onboarding. Stay tuned.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const redirectUri = `${process.env.API_PUBLIC_URL ?? 'http://localhost:4000'}/api/v1/integrations/digilocker/callback`;
    // DigiLocker uses standard OAuth 2.0; state should be a signed token in prod.
    const state = u.sub;
    const url = `https://api.digitallocker.gov.in/public/oauth2/1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    return { url };
  }
}
