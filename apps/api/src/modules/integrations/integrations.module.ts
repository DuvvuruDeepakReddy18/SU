import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GithubService } from './github.service';
import { DigiLockerService } from './digilocker.service';
import { TokenCrypto } from './token-crypto';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GithubService, DigiLockerService, TokenCrypto],
  exports: [IntegrationsService, GithubService],
})
export class IntegrationsModule {}
