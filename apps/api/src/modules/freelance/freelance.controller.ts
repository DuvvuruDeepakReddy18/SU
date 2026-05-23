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
  list(@Query('category') category?: string, @Query('q') q?: string) {
    return this.svc.list(category, q);
  }

  @Get('services/mine')
  mine(@CurrentUser() u: JwtPayload) {
    return this.svc.mine(u.sub);
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
