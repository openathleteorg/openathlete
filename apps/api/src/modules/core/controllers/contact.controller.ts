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
  ContactSubmissionDto,
  contactSubmissionSchema,
} from '@openathlete/shared';

import { ContactService } from '../services/contact.service';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Body(new ZodValidationPipe(contactSubmissionSchema))
    body: ContactSubmissionDto,
    @Req() req: Request,
  ) {
    await this.contactService.submit(body, {
      ip:
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        undefined,
      userAgent: req.headers['user-agent'],
    });
    return { ok: true };
  }
}
