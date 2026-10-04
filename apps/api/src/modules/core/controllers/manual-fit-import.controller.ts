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
  ImportGpxActivityFileDto,
  importActivityFileDtoSchema,
  importGpxActivityFileDtoSchema,
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

  @Post('gpx')
  @ApiOperation({
    summary: 'Import a recorded GPX activity',
    description:
      'Multipart `file` (one .gpx track, up to 20 MB and 100,000 points), `name` and an optional `sport` that overrides the track type. Points need times: a planned route is refused. Distance, moving time and climbing are calculated from the track, and sensors missing on more than a tenth of the points are left out. Same ownership, duplicate rules and processing as FIT files.',
  })
  @ApiResponse({ status: 201, description: 'Imported, or already imported' })
  @ApiResponse({
    status: 400,
    description:
      'Not a recorded GPX track: GPX_INVALID, GPX_NO_TIME (a route or a track without times) or GPX_LIMIT',
  })
  @ApiResponse({ status: 403, description: 'No athlete profile' })
  @ApiResponse({
    status: 409,
    description: 'GPX_DUPLICATE_TIME: another activity starts at the same time',
  })
  @ApiResponse({ status: 413, description: 'GPX_LIMIT: file too large' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_MANUAL_FIT_BYTES, files: 1, fields: 2, parts: 4 },
    }),
  )
  importGpx(
    @JwtUser() user: AuthUser,
    @UploadedFile() file: ManualFitFile | undefined,
    @Body(new ZodValidationPipe(importGpxActivityFileDtoSchema))
    body: ImportGpxActivityFileDto,
  ) {
    return this.service.importGpx(user, file, body.name, body.sport);
  }
}
