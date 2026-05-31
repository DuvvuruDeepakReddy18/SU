import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, OAuthSyncDto } from './dto';
import { StorageService } from '../../infra/storage/storage.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Post('signup')
  signup(@Body(ZodValidationPipe) dto: SignupDto) {
    return this.auth.signup(dto);
  }

  // Public upload endpoint used by the signup form before the user has an
  // account. Returns the S3 key the client passes back to /auth/signup.
  // Files land under `temp/college-ids/` so they're easy to GC if signup
  // is abandoned.
  @Public()
  @Post('upload-college-id')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadCollegeId(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('College ID must be JPG, PNG, WebP, or PDF.');
    }
    if (!this.storage.isConfigured()) {
      throw new BadRequestException(
        'File uploads aren’t configured on this server. Contact support.',
      );
    }
    return this.storage.upload('temp/college-ids', {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body(ZodValidationPipe) dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Called by Auth.js after a successful Google/GitHub OAuth.
  // The Next.js callback hits this with the verified provider profile.
  @Public()
  @HttpCode(200)
  @Post('oauth/sync')
  syncOAuth(@Body(ZodValidationPipe) dto: OAuthSyncDto) {
    return this.auth.syncOAuthUser(dto);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user.sub);
  }
}
