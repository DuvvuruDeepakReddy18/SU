import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { AiScreenService } from './ai-screen.service';
import { StartAiScreenDto, AiScreenAnswerDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

// AI mock-interview prep tool (Ch.7, prep-tool half). Free; not granting L4.
@Controller('ai-screen')
export class AiScreenController {
  constructor(private readonly svc: AiScreenService) {}

  @Post('start')
  start(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: StartAiScreenDto) {
    return this.svc.start(u.sub, dto);
  }

  @Post(':id/answer')
  answer(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: AiScreenAnswerDto,
  ) {
    return this.svc.answer(u.sub, id, dto.answer);
  }

  // Declared before :id so /ai-screen/me resolves to the list, not the detail.
  @Get('me')
  listMine(@CurrentUser() u: JwtPayload) {
    return this.svc.listMine(u.sub);
  }

  @Get(':id')
  get(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.get(u.sub, id);
  }
}
