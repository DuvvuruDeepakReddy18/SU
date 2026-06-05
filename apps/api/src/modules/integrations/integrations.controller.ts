import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { IntegrationsService, type IntegrationProvider } from './integrations.service';
import { DigiLockerService } from './digilocker.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@skillverify/shared';

const KNOWN: IntegrationProvider[] = ['github', 'linkedin', 'leetcode', 'coursera'];

function assertProvider(p: string): asserts p is IntegrationProvider {
  if (!(KNOWN as readonly string[]).includes(p)) {
    throw new BadRequestException(`Unknown provider ${p}`);
  }
}

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly svc: IntegrationsService,
    private readonly digilocker: DigiLockerService,
  ) {}

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
   * DigiLocker (MeriPehchaan) OAuth — step 1. Returns the authorize URL to
   * redirect the user to. 503s until DIGILOCKER_CLIENT_ID/SECRET are set
   * (Govt-of-India onboarding), so the frontend shows "Coming soon".
   */
  @Post('digilocker/connect')
  digiLockerConnect(@CurrentUser() u: JwtPayload) {
    return this.digilocker.buildAuthorizeUrl(u.sub);
  }

  /**
   * DigiLocker OAuth — step 2. DigiLocker redirects the user's browser here
   * with ?code&state. Public (no JWT on a provider redirect); the CSRF `state`
   * recovers the user. Exchanges the code, then bounces back to the dashboard.
   */
  @Public()
  @Get('digilocker/callback')
  async digiLockerCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    try {
      if (!code || !state) throw new BadRequestException('Missing code/state');
      await this.digilocker.handleCallback(code, state);
      return res.redirect(`${appUrl}/dashboard/integrations?digilocker=linked`);
    } catch {
      return res.redirect(`${appUrl}/dashboard/integrations?digilocker=error`);
    }
  }
}
