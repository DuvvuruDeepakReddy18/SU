import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { BookInterviewSchema, BookSlotSchema, GenerateSlotsSchema } from '@skillverify/shared';
import { InterviewsService } from './interviews.service';
import { RazorpayService } from './razorpay.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import type { JwtPayload } from '@skillverify/shared';

class BookInterviewDto extends createZodDto(BookInterviewSchema) {}
class BookSlotDto extends createZodDto(BookSlotSchema) {}
class GenerateSlotsDto extends createZodDto(GenerateSlotsSchema) {}

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

  // ---------- Daily-slot model (Ch.6) ----------

  /** Open slots for a given L3-proven skill's domain. */
  @Get('slots')
  slots(@CurrentUser() u: JwtPayload, @Query('skillId') skillId: string) {
    if (!skillId) throw new BadRequestException('skillId is required.');
    return this.svc.availableSlots(u.sub, skillId);
  }

  /** Book a slot — reserves the seat and randomly pairs the panel. */
  @Post('slots/book')
  @UseInterceptors(IdempotencyInterceptor)
  bookSlot(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: BookSlotDto) {
    return this.svc.bookSlot(u.sub, dto);
  }

  /** Admin/ops: generate daily slots per domain for the next N days. */
  @Post('slots/generate')
  @Roles('PLATFORM_ADMIN')
  generateSlots(@Body(ZodValidationPipe) dto: GenerateSlotsDto) {
    return this.svc.generateSlots(dto);
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
