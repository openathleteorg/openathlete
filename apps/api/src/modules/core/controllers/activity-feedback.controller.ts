import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { ActivityFeedbackService } from '../services/activity-feedback.service';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
};

@Controller('activity-feedback')
export class ActivityFeedbackController {
  constructor(
    private readonly activityFeedbackService: ActivityFeedbackService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
      },
    }),
  )
  async transcribeAudio(
    @JwtUser() user: AuthUser,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    const allowedMimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size exceeds maximum allowed size of 25MB',
      );
    }

    return this.activityFeedbackService.transcribeAudio(file);
  }
}
