import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { InstitutionsService } from './institutions.service';
import { SuggestInstitutionDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly svc: InstitutionsService) {}

  @Public()
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('category') category: string | undefined,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.search(q ?? '', category, limit);
  }

  @Public()
  @Get('categories')
  categories() {
    return this.svc.listCategories();
  }

  // Public on purpose: students hit this from the signup picker before they
  // have an account. Rate-limited by the global ThrottlerModule (120/min).
  @Public()
  @Post('suggest')
  suggest(@Body(ZodValidationPipe) dto: SuggestInstitutionDto) {
    return this.svc.suggest(dto);
  }
}
