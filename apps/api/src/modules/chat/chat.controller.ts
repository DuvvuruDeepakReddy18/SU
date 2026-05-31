import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from 'nestjs-zod';
import { ChatService, type ChatMessage } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});
class ChatDto extends createZodDto(ChatSchema) {}

@Controller('chat')
export class ChatController {
  constructor(private readonly svc: ChatService) {}

  @Post()
  chat(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: ChatDto) {
    // Quick sanity check that the latest turn is actually from the user.
    if (dto.messages.at(-1)?.role !== 'user') {
      throw new BadRequestException('The last message must be from role=user.');
    }
    return this.svc.chat(u.sub, dto.messages as ChatMessage[]);
  }
}
