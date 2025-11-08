import { ZodValidationPipe } from 'nestjs-zod';

import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CompleteOnboardingDto,
  CreateAccountDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  UpdateAccountDto,
  completeOnboardingDtoSchema,
  createAccountDtoSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  updateAccountDtoSchema,
} from '@openathlete/shared';

import { JwtUser } from '../decorators';
import { AuthUser } from '../decorators/user.decorator';
import { UserTypeGuard } from '../guards';
import { UserService } from '../services';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  createAcount(
    @Body(new ZodValidationPipe(createAccountDtoSchema)) body: CreateAccountDto,
  ) {
    return this.userService.createAccount(body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch()
  updateAccount(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateAccountDtoSchema)) body: UpdateAccountDto,
  ) {
    return this.userService.updateAccount(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('me')
  getMe(@JwtUser() user: AuthUser) {
    return this.userService.getMe(user);
  }

  @Post('password-reset/request')
  passwordResetRequest(
    @Body(new ZodValidationPipe(passwordResetRequestSchema))
    body: PasswordResetRequestDto,
  ) {
    return this.userService.passwordResetRequest(body);
  }

  @Post('password-reset')
  passwordReset(
    @Body(new ZodValidationPipe(passwordResetSchema)) body: PasswordResetDto,
  ) {
    return this.userService.passwordReset(body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('complete-onboarding')
  completeOnboarding(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(completeOnboardingDtoSchema))
    body: CompleteOnboardingDto,
  ) {
    return this.userService.completeOnboarding(user, body);
  }
}
