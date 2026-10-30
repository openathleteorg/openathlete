import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  CanActivate,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Patch,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  ApiEnvSchemaType,
  ConnectGarminPersonal,
  GarminPersonalPreferences,
  GarminPersonalSync,
  connectGarminPersonalSchema,
  garminPersonalPreferencesSchema,
  garminPersonalSyncSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from '../../../common/security/rate-limits';
import { JwtUser } from '../../auth';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { GarminPersonalService } from './garmin-personal-service';

@Injectable()
export class GarminPersonalEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService<ApiEnvSchemaType, true>) {}
  canActivate() {
    if (this.config.get('GARMIN_PERSONAL_API_ENABLED') !== true)
      throw new ServiceUnavailableException('PROVIDER_NOT_CONFIGURED');
    return true;
  }
}

@ApiTags('Provider')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), GarminPersonalEnabledGuard)
@ApiResponse({
  status: 503,
  description:
    'Garmin Personal API is disabled on this instance (PROVIDER_NOT_CONFIGURED)',
})
@ApiResponse({ status: 401, description: 'Authentication required' })
@Controller('provider/garmin-personal')
export class GarminPersonalController {
  constructor(private readonly service: GarminPersonalService) {}
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Sanitized connection state; never includes credentials',
  })
  @ApiOperation({
    summary: 'Get your Garmin Personal connection and sanitized sync status',
  })
  status(@JwtUser() user: AuthUser) {
    return this.service.status(user.userId);
  }
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Sanitized connection state; never includes credentials',
  })
  @Throttle(RATE_LIMITS.login)
  @ApiOperation({
    summary: 'Validate and save your own Garmin Personal API key',
  })
  connect(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(connectGarminPersonalSchema))
    body: ConnectGarminPersonal,
  ) {
    return this.service.connect(user.userId, body);
  }
  @Patch()
  @ApiResponse({
    status: 409,
    description:
      'Preferences are locked while an import is queued or running (sync_in_progress)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sanitized connection state; never includes credentials',
  })
  @ApiOperation({
    summary:
      'Change your activity-import consent and automatic sync preferences',
  })
  preferences(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(garminPersonalPreferencesSchema))
    body: GarminPersonalPreferences,
  ) {
    return this.service.preferences(user.userId, body);
  }
  @Delete()
  @ApiResponse({
    status: 200,
    description: 'Sanitized connection state; never includes credentials',
  })
  @ApiOperation({
    summary:
      'Delete your stored key and stop future pulls; keep imported activities',
  })
  disconnect(@JwtUser() user: AuthUser) {
    return this.service.disconnect(user.userId);
  }
  @Post('sync')
  @HttpCode(202)
  @Throttle(RATE_LIMITS.providerSync)
  @ApiResponse({
    status: 202,
    description: 'Import request accepted; returns { queued: boolean }',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid range, missing key or imports disabled',
  })
  @ApiResponse({ status: 429, description: 'Too many import requests' })
  @ApiOperation({
    summary:
      'Queue your activity imports for an inclusive range of up to 28 calendar days',
  })
  sync(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(garminPersonalSyncSchema))
    body: GarminPersonalSync,
  ) {
    return this.service.enqueue(user.userId, body);
  }
}
