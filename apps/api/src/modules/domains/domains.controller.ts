import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('practice/domains')
export class DomainsController {
  constructor(private readonly svc: DomainsService) {}

  @Public()
  @Get()
  list() {
    return this.svc.list();
  }

  @Public()
  @Get(':slug')
  detail(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(30), ParseIntPipe) pageSize: number,
  ) {
    return this.svc.getBySlug(slug, page, pageSize);
  }
}
