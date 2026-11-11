import type { Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  IMAGE_MAX_BYTES,
  type UploadImageDto,
  type UploadedImageDto,
  uploadImageDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { type ImageUpload, StoredFileService } from './stored-file.service';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly files: StoredFileService) {}

  @Post('images')
  @ApiOperation({
    summary: 'Upload an image for a note or a message',
    description:
      'Multipart field `file` (JPEG, PNG, WebP or GIF, 5 MB at most), with `purpose` COACH_NOTE (only the uploader sees it) or MESSAGE and its `messageThreadId` (the participants see it). Texts show the image with `![image](file:<fileId>)`; an image no text shows is deleted after a day.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '{ fileId }' })
  @ApiResponse({ status: 400, description: 'No file, or not an image' })
  @ApiResponse({
    status: 403,
    description: 'Not a participant of the conversation',
  })
  @ApiResponse({ status: 413, description: 'Image larger than 5 MB' })
  @ApiResponse({
    status: 503,
    description: 'Images are not available on this instance (no S3_*)',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // One byte more than allowed, so the service answers 413 itself
      limits: { fileSize: IMAGE_MAX_BYTES + 1, files: 1, fields: 2, parts: 3 },
    }),
  )
  upload(
    @JwtUser() user: AuthUser,
    @UploadedFile() file: ImageUpload | undefined,
    @Body(new ZodValidationPipe(uploadImageDtoSchema)) dto: UploadImageDto,
  ): Promise<UploadedImageDto> {
    return this.files.uploadImage(user, file, dto);
  }

  @Get(':fileId')
  @ApiOperation({
    summary: 'An image',
    description:
      'For its uploader, and for the participants of the conversation of a message image.',
  })
  @ApiParam({ name: 'fileId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'The image' })
  @ApiResponse({ status: 404, description: 'No such image for the user' })
  async get(
    @JwtUser() user: AuthUser,
    @Param('fileId', new ParseUUIDPipe()) fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { body, contentType } = await this.files.open(user, fileId);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      // Ids are never reused: the browser may keep it, for this user only
      'Cache-Control': 'private, max-age=31536000, immutable',
    });
    body.pipe(res);
  }
}
