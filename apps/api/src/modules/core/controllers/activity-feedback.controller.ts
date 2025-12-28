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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserTypeGuard } from 'src/modules/auth';

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

@ApiTags('Activity Feedback')
@Controller('activity-feedback')
export class ActivityFeedbackController {
  constructor(
    private readonly activityFeedbackService: ActivityFeedbackService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
      },
    }),
  )
  @ApiOperation({
    summary: 'Transcribe audio to text',
    description:
      "Transcribes an audio file to text using OpenAI Whisper model. This endpoint is typically used to convert voice recordings of activity feedback into text format. The audio file is processed server-side using OpenAI's Whisper-1 model with French language detection. The transcription can then be used to fill in feedback answers or comments. Supports various audio formats (webm, mp4, ogg, wav, mpeg, mp3) with a maximum file size of 25MB.",
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description:
            'Audio file to transcribe. Supported formats: webm, mp4, ogg, wav, mpeg, mp3. Maximum size: 25MB.',
        },
      },
      required: ['audio'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Audio transcribed successfully',
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Transcribed text from the audio file',
          example:
            "J'ai ressenti une légère douleur au genou gauche pendant la course.",
        },
      },
      required: ['text'],
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - no audio file provided, invalid file type, or file size exceeds 25MB',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: [
            'No audio file provided',
            'Invalid file type. Allowed types: audio/webm, audio/mp4, audio/ogg, audio/wav, audio/mpeg, audio/mp3',
            'File size exceeds maximum allowed size of 25MB',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error - transcription failed (e.g., OpenAI API error)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Failed to transcribe audio: [error details]',
        },
      },
    },
  })
  async transcribeAudio(@UploadedFile() file: MulterFile) {
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
