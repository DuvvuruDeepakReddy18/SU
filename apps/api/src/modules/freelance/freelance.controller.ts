import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FreelanceService } from './freelance.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('freelance')
export class FreelanceController {
  constructor(private readonly svc: FreelanceService) {}

  // ---------- Services ----------

  @Public()
  @Get('services')
  list(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'recent' | 'price_asc' | 'price_desc',
  ) {
    return this.svc.list(category, q, sort);
  }

  @Public()
  @Get('services/map')
  mapPoints() {
    return this.svc.mapPoints();
  }

  // Order matters: declare static paths before ':id' so they're not shadowed.
  @Get('services/mine')
  mine(@CurrentUser() u: JwtPayload) {
    return this.svc.mine(u.sub);
  }

  @Public()
  @Get('services/:id')
  getOne(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post('services')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    if (!body?.title || !body?.category || !body?.description) {
      throw new BadRequestException('title, category, description required');
    }
    return this.svc.create(u.sub, body);
  }

  @Delete('services/:id')
  deactivate(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.deactivate(u.sub, id);
  }

  // ---------- Geocoding ----------

  @Get('geocode')
  geocode(@Query('q') q: string) {
    if (!q) throw new BadRequestException('q required');
    return this.svc.geocode(q);
  }

  // ---------- Inquiries ----------

  @Get('inquiries/sent')
  inquiriesSent(@CurrentUser() u: JwtPayload) {
    return this.svc.inquiriesSent(u.sub);
  }

  @Get('inquiries/received')
  inquiriesReceived(@CurrentUser() u: JwtPayload) {
    return this.svc.inquiriesReceived(u.sub);
  }

  @Get('inquiries/:id')
  getInquiry(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getInquiry(u.sub, id);
  }

  @Post('services/:id/inquire')
  inquire(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: { brief: string; budgetInr?: number; deadlineAt?: string },
  ) {
    if (!body?.brief || body.brief.trim().length < 10) {
      throw new BadRequestException('brief (≥10 chars) required');
    }
    return this.svc.createInquiry(u.sub, id, body.brief.trim(), body.budgetInr, body.deadlineAt);
  }

  @Post('inquiries/:id/status')
  setInquiryStatus(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body()
    body: { status: 'accepted' | 'declined' | 'completed' | 'cancelled'; providerNote?: string },
  ) {
    if (!body?.status) throw new BadRequestException('status required');
    return this.svc.setInquiryStatus(u.sub, id, body.status, body.providerNote);
  }

  @Post('inquiries/:id/messages')
  addMessage(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: { body: string },
  ) {
    if (!body?.body?.trim()) throw new BadRequestException('body required');
    return this.svc.addInquiryMessage(u.sub, id, body.body.trim());
  }
}
