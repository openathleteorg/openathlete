import { ZodValidationPipe } from 'nestjs-zod';

import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ConnectorProvider } from '@openathlete/database';
import {
  ActivityDescriptionPreviewQueryDto,
  ActivityDescriptionPreviewResponseDto,
  activityDescriptionPreviewQuerySchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityDescriptionService } from './activity-description.service';

@ApiTags('Provider')
@Controller('provider/strava/activity-description')
export class ActivityDescriptionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly descriptions: ActivityDescriptionService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('preview')
  @ApiOperation({
    summary: 'Preview the Strava activity description',
    description:
      "Renders the analysis OpenAthlete writes into new Strava activities' descriptions, from the athlete's latest activity that gives enough to say. Nothing is sent to Strava.",
  })
  @ApiResponse({
    status: 200,
    description: 'The text, or null when no recent activity gives enough',
  })
  @ApiResponse({ status: 404, description: 'No athlete profile' })
  async preview(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(activityDescriptionPreviewQuerySchema))
    query: ActivityDescriptionPreviewQueryDto,
  ): Promise<ActivityDescriptionPreviewResponseDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
      select: {
        athleteId: true,
        user: { select: { language: true } },
        providerAccounts: {
          where: { provider: ConnectorProvider.STRAVA },
          select: { activityDescriptionLanguage: true },
        },
      },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');

    const language =
      query.language ??
      athlete.providerAccounts[0]?.activityDescriptionLanguage ??
      athlete.user.language;
    return {
      description: await this.descriptions.preview(athlete.athleteId, language),
    };
  }
}
