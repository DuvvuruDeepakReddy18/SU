import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { RazorpayService } from './razorpay.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

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

  @Post()
  book(
    @CurrentUser() u: JwtPayload,
    @Body() body: { skillId?: string; scheduledAt: string; notes?: string },
  ) {
    if (!body?.scheduledAt) throw new BadRequestException('scheduledAt required');
    return this.svc.book(u.sub, body);
  }

  @Delete(':id')
  cancel(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.cancel(u.sub, id);
  }

  /**
   * Create a Razorpay order for an L4 interview. Returns 503 until
   * RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set. The frontend uses the
   * returned `keyId` + `orderId` to open the Razorpay checkout modal.
   */
  @Post('payments/order')
  createPaymentOrder(@CurrentUser() u: JwtPayload) {
    return this.razorpay.createInterviewOrder(u.sub);
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
