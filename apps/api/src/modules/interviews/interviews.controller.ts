import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly svc: InterviewsService) {}

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
   * Razorpay order-creation stub. Returns 503 until both RAZORPAY_KEY_ID and
   * RAZORPAY_KEY_SECRET are set. When live, this should create a Razorpay
   * order and return the client_secret for the frontend checkout flow.
   *
   * Phase 1 keeps interviews free; the UI hides the payment step entirely
   * when the feature flag is off (see GET /config → razorpay).
   */
  @Post('payments/order')
  createPaymentOrder(@CurrentUser() _u: JwtPayload) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Razorpay is not configured. Booking remains free during beta.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    // TODO: integrate Razorpay SDK here when credentials are available.
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        message: 'Razorpay integration coming in Phase 2.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
