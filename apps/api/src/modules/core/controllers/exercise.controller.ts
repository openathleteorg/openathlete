import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  type CompleteStrengthSessionDto,
  type CreateCustomExerciseDto,
  type UpdateCustomExerciseDto,
  completeStrengthSessionSchema,
  createCustomExerciseSchema,
  updateCustomExerciseSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { CustomExerciseService } from '../services/custom-exercise.service';
import { StrengthSessionService } from '../services/strength-session.service';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller()
export class ExerciseController {
  constructor(
    private readonly customExercises: CustomExerciseService,
    private readonly strengthSessions: StrengthSessionService,
  ) {}

  @Get('exercise/custom')
  @ApiOperation({
    summary: 'Custom exercises the user can use',
    description:
      'Their own, and those of the coaches and athletes they are linked to. The bundled catalog is a static file of the web app.',
  })
  @ApiResponse({ status: 200, description: 'Custom exercises, by name' })
  list(@JwtUser() user: AuthUser) {
    return this.customExercises.list(user);
  }

  @Post('exercise/custom')
  @ApiOperation({ summary: 'Create a custom exercise' })
  @ApiResponse({ status: 201, description: 'The exercise created' })
  create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCustomExerciseSchema))
    dto: CreateCustomExerciseDto,
  ) {
    return this.customExercises.create(user, dto);
  }

  @Patch('exercise/custom/:id')
  @ApiOperation({ summary: 'Change one of my custom exercises' })
  @ApiResponse({ status: 404, description: 'Not one of mine' })
  update(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateCustomExerciseSchema))
    dto: UpdateCustomExerciseDto,
  ) {
    return this.customExercises.update(user, id, dto);
  }

  @Delete('exercise/custom/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete one of my custom exercises' })
  @ApiResponse({ status: 404, description: 'Not one of mine' })
  remove(@JwtUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.customExercises.remove(user, id);
  }

  @Post('event/:eventId/strength-session')
  @ApiOperation({
    summary: 'Record a session played in the session player',
    description:
      'The planned session becomes done: an activity is created with the sets as they were done, and linked to it.',
  })
  @ApiResponse({ status: 201, description: 'The activity created' })
  @ApiResponse({ status: 409, description: 'The session is already done' })
  complete(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body(new ZodValidationPipe(completeStrengthSessionSchema))
    dto: CompleteStrengthSessionDto,
  ) {
    return this.strengthSessions.complete(user, eventId, dto);
  }
}
