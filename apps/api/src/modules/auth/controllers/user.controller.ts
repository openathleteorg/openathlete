import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Gender, UserLanguage, UserRole } from '@openathlete/database';
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

import { Language } from 'src/common/constants/languages.constant';

import { JwtUser } from '../decorators';
import { AuthUser } from '../decorators/user.decorator';
import { UserTypeGuard } from '../guards';
import { UserService } from '../services';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user account',
    description:
      'Registers a new user account with email and password. Automatically creates an athlete profile with default 5-zone heart rate training zones (Recovery, Endurance, Tempo, Threshold, VO2 Max) for all sports. If invitation tokens are provided, they will be consumed to link the new account to existing coach/athlete relationships. Sends a welcome email to the new user and a signup notification to the admin.',
  })
  @ApiBody({
    description: 'Account creation data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'securePassword123',
        },
        firstName: {
          type: 'string',
          example: 'John',
        },
        lastName: {
          type: 'string',
          example: 'Doe',
        },
        invitationToken: {
          type: 'string',
          description: 'Optional athlete invitation token to link to a coach',
          example: 'abc123def456...',
        },
        coachInvitationToken: {
          type: 'string',
          description: 'Optional coach invitation token to link to an athlete',
          example: 'xyz789uvw012...',
        },
      },
      required: ['email', 'password', 'firstName', 'lastName'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - failed to hash password',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user with this email already exists',
  })
  createAcount(
    @Body(new ZodValidationPipe(createAccountDtoSchema)) body: CreateAccountDto,
  ) {
    return this.userService.createAccount(body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch()
  @ApiOperation({
    summary: 'Update user account information',
    description:
      "Updates the authenticated user's personal information including first name, last name, and gender. Only the provided fields will be updated.",
  })
  @ApiBody({
    description: 'Account update data',
    schema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          example: 'Jane',
        },
        lastName: {
          type: 'string',
          example: 'Smith',
        },
        gender: {
          type: 'string',
          enum: Object.values(Gender),
          example: 'FEMALE',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
    schema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          example: 'Jane',
        },
        lastName: {
          type: 'string',
          example: 'Smith',
        },
        gender: {
          type: 'string',
          enum: Object.values(Gender),
          example: 'FEMALE',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  updateAccount(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateAccountDtoSchema)) body: UpdateAccountDto,
  ) {
    return this.userService.updateAccount(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get current user information',
    description:
      "Retrieves the authenticated user's profile information including user ID, email, name, gender, roles, onboarding status, and preferred language.",
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
        },
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
        firstName: {
          type: 'string',
          example: 'John',
        },
        lastName: {
          type: 'string',
          example: 'Doe',
        },
        gender: {
          type: 'string',
          enum: Object.values(Gender),
          nullable: true,
          example: 'MALE',
        },
        roles: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(UserRole),
          },
          example: ['ATHLETE', 'COACH'],
        },
        onboardingCompleted: {
          type: 'boolean',
          example: true,
        },
        language: {
          type: 'string',
          enum: Object.values(UserLanguage),
          example: 'EN',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getMe(@JwtUser() user: AuthUser) {
    return this.userService.getMe(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch('language')
  @ApiOperation({
    summary: 'Update user preferred language',
    description:
      "Updates the authenticated user's preferred language for the application interface. Supported languages are French (FR) and English (EN).",
  })
  @ApiBody({
    description: 'Language preference',
    schema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: Object.values(UserLanguage),
          example: 'FR',
        },
      },
      required: ['language'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Language updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  updateLanguage(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(z.object({ language: z.nativeEnum(Language) })))
    body: { language: Language },
  ) {
    return this.userService.updateLanguage(user, body.language);
  }

  @Post('password-reset/request')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      "Initiates a password reset process by sending a reset token to the user's email address. The token is valid for a limited time and will be sent via email with a link to reset the password. If the email is not found in the system, the request is silently ignored for security reasons.",
  })
  @ApiBody({
    description: 'Password reset request',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Password reset email sent (or silently ignored if email not found)',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - email not found in system',
  })
  passwordResetRequest(
    @Body(new ZodValidationPipe(passwordResetRequestSchema))
    body: PasswordResetRequestDto,
  ) {
    return this.userService.passwordResetRequest(body);
  }

  @Post('password-reset')
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      "Resets the user's password using a valid password reset token received via email. The token must be valid and not expired. After successful reset, the old password is invalidated.",
  })
  @ApiBody({
    description: 'Password reset data',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Password reset token received via email',
          example: 'abc123def456...',
        },
        password: {
          type: 'string',
          format: 'password',
          description: 'New password',
          example: 'newSecurePassword123',
        },
      },
      required: ['token', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - failed to hash password',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired reset token',
  })
  passwordReset(
    @Body(new ZodValidationPipe(passwordResetSchema)) body: PasswordResetDto,
  ) {
    return this.userService.passwordReset(body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('complete-onboarding')
  @ApiOperation({
    summary: 'Complete user onboarding',
    description:
      "Completes the user onboarding process by setting up user profile, metrics, and relationships. Updates user gender and marks onboarding as completed. Creates athlete metrics (weight, height, HR max, HR rest) if provided. If the user is an ATHLETE and provides a coachEmail, sends a coach invitation. If the user is a COACH and provides athleteEmails, sends athlete invitations. All metrics are stored with today's date and upserted to avoid duplicates.",
  })
  @ApiBody({
    description: 'Onboarding completion data',
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(UserRole),
          },
          description: 'User roles (at least one required)',
          example: ['ATHLETE', 'COACH'],
          minItems: 1,
        },
        gender: {
          type: 'string',
          enum: Object.values(Gender),
          example: 'MALE',
        },
        weight: {
          type: 'number',
          description: 'Weight in kilograms',
          example: 70.5,
          minimum: 0,
        },
        height: {
          type: 'number',
          description: 'Height in centimeters',
          example: 175,
          minimum: 0,
        },
        hrMax: {
          type: 'integer',
          description: 'Maximum heart rate in bpm',
          example: 190,
          minimum: 1,
        },
        hrRest: {
          type: 'integer',
          description: 'Resting heart rate in bpm',
          example: 55,
          minimum: 1,
        },
        coachEmail: {
          type: 'string',
          format: 'email',
          description:
            'Coach email to invite (only used if roles includes ATHLETE)',
          example: 'coach@example.com',
        },
        athleteEmails: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email',
          },
          description:
            'Athlete emails to invite (only used if roles includes COACH)',
          example: ['athlete1@example.com', 'athlete2@example.com'],
        },
      },
      required: ['roles'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete record not found for user',
  })
  completeOnboarding(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(completeOnboardingDtoSchema))
    body: CompleteOnboardingDto,
  ) {
    return this.userService.completeOnboarding(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch('push-token')
  @ApiOperation({
    summary: 'Update push notification token',
    description:
      "Updates the authenticated user's push notification token for receiving mobile push notifications. The token is only updated if it differs from the current stored token. This is typically called when the app starts or when the push token changes.",
  })
  @ApiBody({
    description: 'Push token data',
    schema: {
      type: 'object',
      properties: {
        pushToken: {
          type: 'string',
          description: 'Push notification token from the device',
          example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          minLength: 1,
        },
      },
      required: ['pushToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Push token updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  updatePushToken(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(z.object({ pushToken: z.string().min(1) })))
    body: { pushToken: string },
  ) {
    return this.userService.updatePushToken(user, body.pushToken);
  }
}
