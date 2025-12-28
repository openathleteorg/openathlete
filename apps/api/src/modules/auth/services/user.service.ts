import * as argon2 from 'argon2';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  Gender,
  MetricType,
  Prisma,
  SportType,
  TokenType,
  User,
  UserRole,
} from '@openathlete/database';
import {
  ApiEnvSchemaType,
  CompleteOnboardingDto,
  CreateAccountDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  UpdateAccountDto,
} from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { SendEmailEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AuthUser } from '../decorators/user.decorator';
import { AthleteInvitationService } from './athlete-invitation.service';
import { CoachInvitationService } from './coach-invitation.service';
import { TokenService } from './token.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger();
  HASH_PEPPER: Buffer | undefined;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    private eventEmitter: EventEmitter2,
    private tokenService: TokenService,
    private invitationService: AthleteInvitationService,
    private coachInvitationService: CoachInvitationService,
  ) {
    this.HASH_PEPPER = this.configService.get('HASH_PEPPER')
      ? Buffer.from(this.configService.get('HASH_PEPPER'))
      : undefined;
  }

  async findOneOrFail(where: Prisma.UserWhereInput): Promise<User> {
    return this.prisma.user.findFirstOrThrow({ where });
  }

  async findOne(where: Prisma.UserWhereInput): Promise<User | null> {
    return this.prisma.user.findFirst({ where });
  }

  async exists(where: Prisma.UserWhereInput): Promise<boolean> {
    return this.prisma.user.findFirst({ where }).then((user) => !!user);
  }

  public hashPassword = async (plainPassword: string) =>
    await argon2.hash(plainPassword, {
      secret: this.HASH_PEPPER,
    });

  public getMe = async (user: AuthUser) => {
    return await this.prisma.user.findUniqueOrThrow({
      where: { userId: user.userId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        roles: true,
        onboardingCompleted: true,
        language: true,
      },
    });
  };

  public updateLanguage = async (user: AuthUser, language: Language) => {
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { language },
    });
    return { success: true };
  };

  public updatePushToken = async (user: AuthUser, pushToken: string) => {
    const currentUser = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      select: { pushToken: true },
    });

    if (currentUser?.pushToken !== pushToken) {
      await this.prisma.user.update({
        where: { userId: user.userId },
        data: { pushToken: pushToken },
      });
      this.logger.log(`Updated push token for user ${user.userId}`);
    }

    return { success: true };
  };

  public createAccount = async ({
    email,
    password,
    firstName,
    lastName,
    invitationToken,
    coachInvitationToken,
  }: CreateAccountDto) => {
    const hashedPassword = await this.hashPassword(password);

    if (!hashedPassword) {
      throw new BadRequestException('Failed to hash password');
    }

    const userExists = await this.exists({ email });

    if (userExists) {
      throw new ConflictException('User already exists');
    }

    // Default 5-zone heart rate system for new athletes
    // Colors chosen to be coherent and compatible with color inputs (hex)
    const DEFAULT_HR_ZONES = [
      {
        name: 'Zone 1',
        description: 'Recovery',
        min: 0,
        max: 131,
        color: '#9CA3AF', // gray-400
      },
      {
        name: 'Zone 2',
        description: 'Endurance',
        min: 132,
        max: 142,
        color: '#22C55E', // green-500
      },
      {
        name: 'Zone 3',
        description: 'Tempo',
        min: 143,
        max: 152,
        color: '#EAB308', // yellow-500
      },
      {
        name: 'Zone 4',
        description: 'Threshold',
        min: 153,
        max: 163,
        color: '#F97316', // orange-500
      },
      {
        name: 'Zone 5',
        description: 'VO2 Max',
        min: 164,
        max: 220,
        color: '#EF4444', // red-500
      },
    ];

    const allSports = Object.values(SportType) as SportType[];

    const created = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        roles: [UserRole.ATHLETE, UserRole.COACH],
        athlete: {
          create: {
            trainingZones: {
              create: DEFAULT_HR_ZONES.map((z, idx) => ({
                name: z.name,
                description: z.description,
                index: idx,
                type: 'HEARTRATE',
                color: z.color,
                values: {
                  create: [
                    {
                      min: z.min,
                      max: z.max,
                      sports: allSports,
                    },
                  ],
                },
              })),
            },
          },
        },
      },
      select: {
        userId: true,
      },
    });

    if (invitationToken) {
      await this.invitationService.consumeInvitation(
        invitationToken,
        created.userId,
      );
    }

    if (coachInvitationToken) {
      await this.coachInvitationService.consumeInvitation(
        coachInvitationToken,
        created.userId,
      );
    }

    this.eventEmitter.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'welcome',
        to: email,
        params: {
          name: firstName,
          dashboard_url: `${this.configService.get('APP_URL')}/dashboard`,
        },
      }),
    );

    this.eventEmitter.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'signup-notification',
        to: 'contact@openathlete.org',
        params: {
          email,
          firstName,
          lastName,
        },
      }),
    );

    return created;
  };

  public updateAccount = async (user: AuthUser, data: UpdateAccountDto) => {
    return await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
      },
      select: {
        firstName: true,
        lastName: true,
        gender: true,
      },
    });
  };

  async comparePasswords(
    params: { pass_string: string; pass_hash: string },
    options?: { email?: string },
  ) {
    const { pass_string, pass_hash } = params || {};
    const { email } = options || {};

    const areCredentialsValid = await argon2.verify(pass_hash, pass_string, {
      secret: this.HASH_PEPPER,
    });
    if (!areCredentialsValid) {
      this.logger.log(
        `Invalid credentials for user${email ? ` with email ${email}` : ''}`,
      );
      throw new UnauthorizedException();
    }

    return areCredentialsValid;
  }

  public passwordResetRequest = async (body: PasswordResetRequestDto) => {
    const user = await this.findOne({ email: body.email });
    if (!user) {
      this.logger.log(`User with email ${body.email} not found`);
      throw new UnauthorizedException();
    }

    const token = await this.tokenService.createToken(
      { userId: user.userId },
      TokenType.PASSWORD_RESET,
    );

    this.eventEmitter.emit(
      SendEmailEvent.SLUG,
      new SendEmailEvent({
        type: 'password-reset',
        to: body.email,
        params: {
          url: `${this.configService.get('APP_URL')}/auth/password-reset?token=${token.token}`,
        },
      }),
    );
  };

  public passwordReset = async (body: PasswordResetDto) => {
    const user = await this.tokenService.verifyToken(body.token);

    if (!user) {
      this.logger.log(`Token ${body.token} not found or expired`);
      throw new UnauthorizedException();
    }

    const hashedPassword = await this.hashPassword(body.password);

    if (!hashedPassword) {
      throw new BadRequestException('Failed to hash password');
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { password: hashedPassword },
    });
  };

  public completeOnboarding = async (
    user: AuthUser,
    data: CompleteOnboardingDto,
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update user roles, gender, and mark onboarding as completed
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        gender: data.gender as Gender | undefined,
        onboardingCompleted: true,
      },
    });

    // Get athlete record
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete record not found');
    }

    // Create metrics if provided
    const metricsToCreate: Array<{
      type: MetricType;
      date: Date;
      value: number;
    }> = [];

    if (data.weight) {
      metricsToCreate.push({
        type: 'WEIGHT',
        date: today,
        value: data.weight,
      });
    }

    if (data.height) {
      metricsToCreate.push({
        type: 'HEIGHT',
        date: today,
        value: data.height,
      });
    }

    if (data.hrMax) {
      metricsToCreate.push({
        type: 'HR_MAX',
        date: today,
        value: data.hrMax,
      });
    }

    if (data.hrRest) {
      metricsToCreate.push({
        type: 'HR_REST',
        date: today,
        value: data.hrRest,
      });
    }

    // Create metrics (upsert to avoid duplicates)
    for (const metric of metricsToCreate) {
      await this.prisma.athleteMetric.upsert({
        where: {
          athleteId_type_date: {
            athleteId: athlete.athleteId,
            type: metric.type,
            date: metric.date,
          },
        },
        create: {
          athleteId: athlete.athleteId,
          type: metric.type,
          date: metric.date,
          value: metric.value,
        },
        update: {
          value: metric.value,
        },
      });
    }

    // Invite coach if provided
    if (data.coachEmail && data.roles.includes('ATHLETE')) {
      await this.coachInvitationService.createInvitation(
        user.userId,
        data.coachEmail,
      );
    }

    // Invite athletes if provided
    if (
      data.athleteEmails &&
      data.athleteEmails.length > 0 &&
      data.roles.includes('COACH')
    ) {
      for (const email of data.athleteEmails) {
        try {
          await this.invitationService.createInvitation(user.userId, email);
        } catch (error) {
          // Log but don't fail the entire onboarding if one invitation fails
          this.logger.warn(`Failed to invite athlete ${email}: ${error}`);
        }
      }
    }

    return { success: true };
  };
}
