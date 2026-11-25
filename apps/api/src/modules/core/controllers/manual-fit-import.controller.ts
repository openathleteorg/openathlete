import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
  ImportTcxActivityFileDto,
  importActivityFileDtoSchema,
  importGpxActivityFileDtoSchema,
  importTcxActivityFileDtoSchema,
} from '@openathlete/shared';

import { AuthUser, JwtUser } from '../../auth/decorators/user.decorator';
import { ActivityImportAuthGuard } from '../../mcp/auth/activity-import-auth.guard';
import { MAX_MANUAL_FIT_BYTES } from '../helpers/manual-fit-import';
import {
  ManualFitFile,
  ManualFitImportService,
} from '../services/manual-fit-import.service';

@ApiTags('Activities')
@ApiBearerAuth()
// The web app's session, or an OAuth token of an app that sends files
@UseGuards(ActivityImportAuthGuard)
@Controller('activity-import')
export class ManualFitImportController {
  constructor(private readonly service: ManualFitImportService) {}

  @Post('fit')
  @ApiOperation({
    summary: 'Import a recorded FIT activity',
    description:
      'Multipart `file` (one .fit activity, up to 20 MB, 100,000 records and 1,000 laps) and `name`. The activity is saved for the authenticated athlete with its original date, streams and laps, then processed like a synced one. An activity that started in the last 7 days is processed as new (weather, coach notice, push notification, AI summary and questions); an older one, or the same file again, as history. The same file again returns the existing activity; another activity with the same start time is refused. Warnings report omitted or missing data.',
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

  @Post('tcx')
  @ApiOperation({
    summary: 'Import a recorded TCX activity',
    description:
      'Multipart `file` (one .tcx activity, up to 20 MB, 100,000 track points and 1,000 laps), `name` and an optional `sport` that overrides the activity type (TCX only names running and biking). The laps give timer time, distance and heart rate when present; the rest is calculated from the track, as for GPX. Courses, workouts and multisport files are refused. Same ownership, duplicate rules and processing as FIT files.',
  })
  @ApiResponse({ status: 201, description: 'Imported, or already imported' })
  @ApiResponse({
    status: 400,
    description:
      'Not a recorded TCX activity: TCX_INVALID, TCX_NO_TIME (a course, a workout or no times), TCX_MULTISPORT_UNSUPPORTED or TCX_LIMIT',
  })
  @ApiResponse({ status: 403, description: 'No athlete profile' })
  @ApiResponse({
    status: 409,
    description: 'TCX_DUPLICATE_TIME: another activity starts at the same time',
  })
  @ApiResponse({ status: 413, description: 'TCX_LIMIT: file too large' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_MANUAL_FIT_BYTES, files: 1, fields: 2, parts: 4 },
    }),
  )
  importTcx(
    @JwtUser() user: AuthUser,
    @UploadedFile() file: ManualFitFile | undefined,
    @Body(new ZodValidationPipe(importTcxActivityFileDtoSchema))
    body: ImportTcxActivityFileDto,
  ) {
    return this.service.importTcx(user, file, body.name, body.sport);
  }
}
