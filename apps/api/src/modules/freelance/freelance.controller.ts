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

  @Public()
  @Get('services')
  list(
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'recent' | 'price_asc' | 'price_desc',
  ) {
    return this.svc.list(category, q, sort);
  }

  // IMPORTANT: '/services/mine' must be declared BEFORE '/services/:id' so
  // the static path matches before the param catches it.
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
}
