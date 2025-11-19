import { ZodValidationPipe } from 'nestjs-zod';

import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  loginDtoSchema,
  refreshTokenDtoSchema,
} from '@openathlete/shared';

import { AuthService, UserService } from '../services';
import { InvitationService } from '../services/invitation.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private invitationService: InvitationService,
  ) {}

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginDtoSchema)) credentials: LoginDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.login(credentials);
  }

  @Post('refresh-token')
  async refreshToken(
    @Body(new ZodValidationPipe(refreshTokenDtoSchema)) body: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(body.refreshToken);
  }

  @Get('email-exists')
  async emailExists(@Query('email') email: string) {
    return this.userService.exists({
      email,
    });
  }

  @Get('invitation')
  async verifyInvitation(@Query('token') token: string) {
    const invitation =
      await this.invitationService.verifyInvitationToken(token);
    if (!invitation) {
      return { valid: false };
    }
    return {
      valid: true,
      email: invitation.email,
    };
  }
}
