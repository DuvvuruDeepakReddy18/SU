import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { Judge0Client } from './judge0.client';
import { LocalRunner } from './local-runner';
import { CodeRunner } from './code-runner';
import { AiReviewer } from './ai-reviewer';

@Module({
  controllers: [PracticeController],
  providers: [PracticeService, Judge0Client, LocalRunner, CodeRunner, AiReviewer],
  exports: [PracticeService],
})
export class PracticeModule {}
