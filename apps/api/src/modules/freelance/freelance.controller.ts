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
import { ZodValidationPipe } from 'nestjs-zod';
import { FreelanceService } from './freelance.service';
import {
  FreelanceServiceCreateDto,
  FreelanceInquiryDto,
  InquiryStatusDto,
  InquiryMessageDto,
} from './dto';
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
  create(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: FreelanceServiceCreateDto) {
    return this.svc.create(u.sub, dto);
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
    @Body(ZodValidationPipe) dto: FreelanceInquiryDto,
  ) {
    return this.svc.createInquiry(u.sub, id, dto.brief.trim(), dto.budgetInr, dto.deadlineAt);
  }

  @Post('inquiries/:id/status')
  setInquiryStatus(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: InquiryStatusDto,
  ) {
    return this.svc.setInquiryStatus(u.sub, id, dto.status, dto.providerNote);
  }

  @Post('inquiries/:id/messages')
  addMessage(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: InquiryMessageDto,
  ) {
    return this.svc.addInquiryMessage(u.sub, id, dto.body.trim());
  }
}
