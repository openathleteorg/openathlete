import type { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';

import {
  BetaAccessRequestDto,
  betaAccessRequestSchema,
} from '@openathlete/shared';

import { BetaAccessService } from '../services/beta-access.service';

@Controller('beta-access')
export class BetaAccessController {
  constructor(private betaAccessService: BetaAccessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async request(
    @Body(new ZodValidationPipe(betaAccessRequestSchema))
    body: BetaAccessRequestDto,
    @Req() req: Request,
  ) {
    await this.betaAccessService.request(body, {
      ip:
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        undefined,
      userAgent: req.headers['user-agent'],
    });
    return { ok: true };
  }
}

