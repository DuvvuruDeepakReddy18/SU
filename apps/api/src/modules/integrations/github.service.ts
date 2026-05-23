import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenCrypto } from './token-crypto';

type GhRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  pushed_at: string;
  fork: boolean;
  private: boolean;
};

@Injectable()
export class GithubService {
  private readonly log = new Logger(GithubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: TokenCrypto,
  ) {}

  // OAuth start URL (Auth.js will normally handle this; we expose this
  // for users who connect GitHub *after* signup with a different OAuth provider).
  authorizeUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID ?? '';
    const redirectUri = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/integrations/github/callback`;
    const scope = 'read:user repo';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(userId: string, code: string) {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const json = (await res.json()) as { access_token?: string; error?: string };
    if (!json.access_token) throw new Error(json.error ?? 'OAuth exchange failed');

    const profile = await this.fetchUser(json.access_token);
    await this.prisma.externalIntegration.upsert({
      where: { userId_provider: { userId, provider: 'github' } },
      update: {
        accessTokenEncrypted: this.crypto.encrypt(json.access_token),
        providerUserId: String(profile.id),
        syncStatus: 'idle',
      },
      create: {
        userId,
        provider: 'github',
        providerUserId: String(profile.id),
        accessTokenEncrypted: this.crypto.encrypt(json.access_token),
      },
    });
    return profile;
  }

  async syncRepos(userId: string) {
    const integration = await this.prisma.externalIntegration.findUnique({
      where: { userId_provider: { userId, provider: 'github' } },
    });
    if (!integration?.accessTokenEncrypted) {
      throw new Error('GitHub not connected');
    }
    const token = this.crypto.decrypt(integration.accessTokenEncrypted);

    await this.prisma.externalIntegration.update({
      where: { id: integration.id },
      data: { syncStatus: 'syncing' },
    });

    try {
      const repos = await this.fetchRepos(token);
      for (const repo of repos) {
        if (repo.fork || repo.private) continue;
        await this.prisma.project.upsert({
          where: { id: `gh_${repo.id}` },
          update: {
            title: repo.name,
            description: repo.description ?? null,
            repoUrl: repo.html_url,
            liveUrl: repo.homepage ?? null,
            stars: repo.stargazers_count,
            techStack: this.deriveStack(repo),
            lastCommitAt: new Date(repo.pushed_at),
          },
          create: {
            id: `gh_${repo.id}`,
            userId,
            source: 'github',
            title: repo.name,
            description: repo.description ?? null,
            repoUrl: repo.html_url,
            liveUrl: repo.homepage ?? null,
            stars: repo.stargazers_count,
            techStack: this.deriveStack(repo),
            lastCommitAt: new Date(repo.pushed_at),
            linkedSkills: [],
          },
        });
      }
      await this.prisma.externalIntegration.update({
        where: { id: integration.id },
        data: { syncStatus: 'idle', lastSyncedAt: new Date() },
      });
      return { synced: repos.length };
    } catch (e) {
      this.log.error(`GitHub sync failed: ${(e as Error).message}`);
      await this.prisma.externalIntegration.update({
        where: { id: integration.id },
        data: { syncStatus: 'error' },
      });
      throw e;
    }
  }

  private async fetchUser(token: string) {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    return (await res.json()) as { id: number; login: string; name: string | null };
  }

  private async fetchRepos(token: string): Promise<GhRepo[]> {
    const out: GhRepo[] = [];
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        },
      );
      const batch = (await res.json()) as GhRepo[];
      out.push(...batch);
      if (batch.length < 100) break;
    }
    return out;
  }

  private deriveStack(repo: GhRepo): string[] {
    const stack = new Set<string>();
    if (repo.language) stack.add(repo.language);
    for (const t of repo.topics ?? []) stack.add(t);
    return [...stack];
  }
}
