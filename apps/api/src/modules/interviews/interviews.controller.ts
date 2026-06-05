import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { BookInterviewSchema } from '@skillverify/shared';
import { InterviewsService } from './interviews.service';
import { RazorpayService } from './razorpay.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import type { JwtPayload } from '@skillverify/shared';

class BookInterviewDto extends createZodDto(BookInterviewSchema) {}

@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly svc: InterviewsService,
    private readonly razorpay: RazorpayService,
  ) {}

  @Get()
  list(@CurrentUser() u: JwtPayload) {
    return this.svc.list(u.sub);
  }

  /** Skills the student can book an L4 interview for (their L3-proven skills). */
  @Get('eligible-skills')
  eligibleSkills(@CurrentUser() u: JwtPayload) {
    return this.svc.eligibleSkills(u.sub);
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  book(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: BookInterviewDto) {
    return this.svc.book(u.sub, dto);
  }

  @Delete(':id')
  cancel(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.cancel(u.sub, id);
  }

  /**
   * Create a Razorpay order for an L4 interview. Returns 503 until
   * RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set. The frontend uses the
   * returned `keyId` + `orderId` to open the Razorpay checkout modal.
   *
   * `scheduledAt` is required at order time so the webhook can finish the
   * booking even if the frontend never calls /verify-and-book.
   */
  @Post('payments/order')
  @UseInterceptors(IdempotencyInterceptor)
  createPaymentOrder(
    @CurrentUser() u: JwtPayload,
    @Body() body: { scheduledAt: string; notes?: string; skillId?: string },
  ) {
    if (!body?.scheduledAt) {
      throw new BadRequestException('scheduledAt required at order time.');
    }
    return this.razorpay.createInterviewOrder({
      userId: u.sub,
      scheduledAt: body.scheduledAt,
      notes: body.notes,
      skillId: body.skillId,
    });
  }

  /**
   * Final step of the checkout flow. Frontend posts the {orderId,
   * paymentId, signature} from Razorpay's success callback plus the slot
   * details. We verify the HMAC signature, then atomically create the
   * booking with the payment ids stamped on it.
   */
  @Post('payments/verify-and-book')
  verifyAndBook(
    @CurrentUser() u: JwtPayload,
    @Body()
    body: {
      orderId: string;
      paymentId: string;
      signature: string;
      scheduledAt: string;
      notes?: string;
      skillId?: string;
    },
  ) {
    if (!body) throw new BadRequestException('Missing payment payload');
    return this.razorpay.verifyAndBook(u.sub, body);
  }
}
