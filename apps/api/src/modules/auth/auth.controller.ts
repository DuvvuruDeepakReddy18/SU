import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, OAuthSyncDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body(ZodValidationPipe) dto: SignupDto) {
    return this.auth.signup(dto);
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
