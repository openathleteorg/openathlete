import { ZodValidationPipe } from 'nestjs-zod';

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  loginDtoSchema,
  refreshTokenDtoSchema,
} from '@openathlete/shared';

import { AuthService, UserService } from '../services';
import { InvitationService } from '../services/invitation.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private invitationService: InvitationService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user with email and password',
    description:
      'Validates user credentials and returns access and refresh tokens. The access token expires in 1 hour, while the refresh token expires in 30 days.',
  })
  @ApiBody({
    description: 'User login credentials',
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
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'JWT access token (expires in 1 hour)',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9...',
        },
        refreshToken: {
          type: 'string',
          description: 'JWT refresh token (expires in 30 days)',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials - email or password is incorrect',
  })
  async login(
    @Body(new ZodValidationPipe(loginDtoSchema)) credentials: LoginDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.login(credentials);
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
    description:
      'Generates a new pair of access and refresh tokens using a valid refresh token. Useful for maintaining user sessions without requiring re-authentication.',
  })
  @ApiBody({
    description: 'Refresh token request',
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Valid refresh token',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9...',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refresh successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'New JWT access token (expires in 1 hour)',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9...',
        },
        refreshToken: {
          type: 'string',
          description: 'New JWT refresh token (expires in 30 days)',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(
    @Body(new ZodValidationPipe(refreshTokenDtoSchema)) body: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(body.refreshToken);
  }

  @Get('email-exists')
  @ApiOperation({
    summary: 'Check if an email address is already registered',
    description:
      'Verifies whether a given email address is already associated with an existing user account. Useful for registration forms to prevent duplicate accounts.',
  })
  @ApiQuery({
    name: 'email',
    type: String,
    description: 'Email address to check',
    example: 'user@example.com',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Email existence check result',
    schema: {
      type: 'boolean',
      example: true,
      description: 'true if email exists, false otherwise',
    },
  })
  async emailExists(@Query('email') email: string) {
    return this.userService.exists({
      email,
    });
  }

  @Get('invitation')
  @ApiOperation({
    summary: 'Verify invitation token validity',
    description:
      'Validates an invitation token and returns the associated email if valid. The token can be for either an athlete invitation or a coach invitation. Returns valid=false if the token is invalid or expired.',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Invitation token to verify',
    example: 'abc123def456...',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation verification result',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          description: 'Whether the invitation token is valid',
          example: true,
        },
        email: {
          type: 'string',
          format: 'email',
          description:
            'Email address associated with the invitation (only present if valid=true)',
          example: 'invited@example.com',
        },
      },
      required: ['valid'],
    },
  })
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
