import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  me(@CurrentUser() u: JwtPayload) {
    return this.profile.getMine(u.sub);
  }

  @Patch('me')
  update(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: UpdateProfileDto) {
    return this.profile.update(u.sub, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadAvatar(@CurrentUser() u: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.profile.uploadAvatar(u.sub, file);
  }

  @Post('college-id')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadCollegeId(@CurrentUser() u: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.profile.uploadCollegeId(u.sub, file);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadResume(@CurrentUser() u: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this.profile.uploadResume(u.sub, file);
  }

  // Storage-free alternative — user pastes the text of their resume.
  @Post('resume-text')
  parseResumeText(@CurrentUser() u: JwtPayload, @Body() body: { text: string }) {
    if (!body?.text || typeof body.text !== 'string') {
      throw new Error('text is required');
    }
    return this.profile.parseResumeText(u.sub, body.text);
  }

  @Public()
  @Get('public/:slug')
  publicBySlug(@Param('slug') slug: string) {
    return this.profile.getPublicBySlug(slug);
  }
}
