import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../prisma/services/prisma.service';
import { SubscriptionModule } from '../subscription';
import { AuthController, UserController } from './controllers';
import { UserTypeGuard } from './guards';
import { AuthService, CaslAbilityFactory, UserService } from './services';
import { AthleteInvitationService } from './services/athlete-invitation.service';
import { CoachInvitationService } from './services/coach-invitation.service';
import { InvitationService } from './services/invitation.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApiEnvSchemaType, true>) => ({
        secret: configService.getOrThrow('JWT_SECRET_KEY'),
      }),
    }),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserService,
    TokenService,
    AthleteInvitationService,
    CoachInvitationService,
    InvitationService,
    JwtStrategy,
    CaslAbilityFactory,
    UserTypeGuard,
    PrismaService,
  ],
  exports: [
    CaslAbilityFactory,
    UserService,
    JwtModule,
    UserTypeGuard,
    AthleteInvitationService,
    CoachInvitationService,
  ],
})
export class AuthModule {}
