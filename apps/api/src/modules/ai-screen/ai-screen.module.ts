import { Module } from '@nestjs/common';
import { AiScreenController } from './ai-screen.controller';
import { AiScreenService } from './ai-screen.service';

@Module({
  controllers: [AiScreenController],
  providers: [AiScreenService],
})
export class AiScreenModule {}
