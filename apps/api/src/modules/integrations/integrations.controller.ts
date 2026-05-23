import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
}
