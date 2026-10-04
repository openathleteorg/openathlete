import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  ImportActivityFileDto,
  importActivityFileDtoSchema,
} from '@openathlete/shared';

import { AuthUser, JwtUser } from '../../auth/decorators/user.decorator';
import { MAX_MANUAL_FIT_BYTES } from '../helpers/manual-fit-import';
import {
  ManualFitFile,
  ManualFitImportService,
} from '../services/manual-fit-import.service';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('activity-import')
export class ManualFitImportController {
  constructor(private readonly service: ManualFitImportService) {}

  @Post('fit')
  @ApiOperation({
    summary: 'Import a recorded FIT activity',
    description:
      'Multipart `file` (one .fit activity, up to 20 MB, 100,000 records and 1,000 laps) and `name`. The activity is saved for the authenticated athlete with its original date, streams and laps, then processed like a synced one, without AI feedback questions. The same file again returns the existing activity; another activity with the same start time is refused. Warnings report omitted or missing data.',
  })
  @ApiResponse({ status: 201, description: 'Imported, or already imported' })
  @ApiResponse({
    status: 400,
    description:
      'Not a valid FIT activity: FIT_INVALID, FIT_NOT_ACTIVITY or FIT_MULTISPORT_UNSUPPORTED',
  })
  @ApiResponse({ status: 403, description: 'No athlete profile' })
  @ApiResponse({
    status: 409,
    description: 'FIT_DUPLICATE_TIME: another activity starts at the same time',
  })
  @ApiResponse({
    status: 413,
    description: 'FIT_LIMIT: file or content too large',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_MANUAL_FIT_BYTES, files: 1, fields: 1, parts: 3 },
    }),
  )
  import(
    @JwtUser() user: AuthUser,
    @UploadedFile() file: ManualFitFile | undefined,
    @Body(new ZodValidationPipe(importActivityFileDtoSchema))
    body: ImportActivityFileDto,
  ) {
    return this.service.import(user, file, body.name);
  }
}
