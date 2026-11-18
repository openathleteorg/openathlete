import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  CreateActivityUploadWebhookDto,
  createActivityUploadWebhookSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from '../../../common/security/rate-limits';
import { JwtUser, UserTypeGuard } from '../../auth';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { ActivityUploadWebhookService } from '../services/activity-upload-webhook.service';

@ApiTags('Activities')
@Controller('activity-import/webhook')
export class ActivityUploadWebhookController {
  constructor(private readonly service: ActivityUploadWebhookService) {}

  @Get('connection')
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get your activity upload webhook status' })
  @Header('Cache-Control', 'no-store')
  status(@JwtUser() user: AuthUser) {
    return this.service.status(user.userId);
  }

  @Post('connection')
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate or replace your activity upload token' })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  generate(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createActivityUploadWebhookSchema))
    body: CreateActivityUploadWebhookDto,
  ) {
    return this.service.generate(user.userId, body.runGapSignature);
  }

  @Delete('connection')
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke your activity upload token' })
  @HttpCode(204)
  revoke(@JwtUser() user: AuthUser) {
    return this.service.revoke(user.userId);
  }

  @Post(['upload', 'upload/:token'])
  @Throttle(RATE_LIMITS.activityFile)
  @HttpCode(200)
  @ApiOperation({ summary: 'Queue a FIT activity for import' })
  @ApiConsumes('application/octet-stream', 'multipart/form-data')
  @ApiResponse({ status: 200, description: 'Upload queued' })
  @ApiResponse({ status: 400, description: 'Invalid upload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'Upload too large' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Queue temporarily unavailable' })
  receive(
    @Body() body: unknown,
    @Param('token') token?: string,
    @Headers('authorization') authorization?: string,
    @Headers('content-type') contentType?: string,
    @Headers('x-rungap-hmac-sha256') signature?: string,
  ) {
    return this.service.receive(
      token ?? /^Bearer (\S+)$/i.exec(authorization ?? '')?.[1],
      body,
      contentType,
      signature,
    );
  }
}
