import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { StorageModule } from './infra/storage/storage.module';
import { QueueModule } from './infra/queue/queue.module';
import { OpenRouterModule } from './infra/openrouter/openrouter.module';
import { EmailModule } from './infra/email/email.module';
import { HealthController } from './common/health.controller';

import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SkillsModule } from './modules/skills/skills.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { PracticeModule } from './modules/practice/practice.module';
import { CommunityModule } from './modules/community/community.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DomainsModule } from './modules/domains/domains.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { PlacementsModule } from './modules/placements/placements.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { FreelanceModule } from './modules/freelance/freelance.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessagesModule } from './modules/messages/messages.module';
import { RecruitersModule } from './modules/recruiters/recruiters.module';
import { InstitutionAdminModule } from './modules/institution-admin/institution-admin.module';
import { InterviewerModule } from './modules/interviewer/interviewer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Default budget: 120 requests / minute / IP. Abuse-prone routes (auth)
    // tighten this with per-route @Throttle; webhooks/health opt out with
    // @SkipThrottle. NOTE: in-memory storage — correct for a single instance.
    // When scaling horizontally, swap in a Redis ThrottlerStorage so the
    // budget is shared across instances.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    StorageModule,
    QueueModule,
    OpenRouterModule,
    EmailModule,
    AuthModule,
    ProfileModule,
    SkillsModule,
    IntegrationsModule,
    VerificationsModule,
    PracticeModule,
    CommunityModule,
    LeaderboardModule,
    NotificationsModule,
    DomainsModule,
    InterviewsModule,
    PlacementsModule,
    CompetitionsModule,
    FreelanceModule,
    InstitutionsModule,
    AdminModule,
    ChatModule,
    MessagesModule,
    RecruitersModule,
    InstitutionAdminModule,
    InterviewerModule,
  ],
  controllers: [HealthController],
  providers: [
    // Enforce the throttle budget globally. Without this, ThrottlerModule is
    // configured but inert — every route was effectively unlimited.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
