import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GithubService } from './github.service';

export type IntegrationProvider = 'github' | 'linkedin' | 'leetcode' | 'coursera';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
  ) {}

  async list(userId: string) {
    const rows = await this.prisma.externalIntegration.findMany({ where: { userId } });
    return rows.map((r) => ({
      provider: r.provider,
      connected: !!r.accessTokenEncrypted,
      syncStatus: r.syncStatus,
      lastSyncedAt: r.lastSyncedAt,
    }));
  }

  startConnect(provider: IntegrationProvider, state: string) {
    if (provider === 'github') return { url: this.github.authorizeUrl(state) };
    return { status: 'coming_soon', message: `${provider} integration arrives in Phase 2.` };
  }

  async handleCallback(userId: string, provider: IntegrationProvider, code: string) {
    if (provider !== 'github') throw new BadRequestException(`${provider} OAuth not enabled yet`);
    return this.github.exchangeCode(userId, code);
  }

  async sync(userId: string, provider: IntegrationProvider) {
    if (provider !== 'github') {
      return { status: 'coming_soon', message: `${provider} sync arrives in Phase 2.` };
    }
    return this.github.syncRepos(userId);
  }

  async disconnect(userId: string, provider: IntegrationProvider) {
    await this.prisma.externalIntegration.deleteMany({ where: { userId, provider } });
    return { ok: true };
  }
}
