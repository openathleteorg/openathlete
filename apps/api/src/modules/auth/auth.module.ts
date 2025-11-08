import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaService } from '../prisma/services/prisma.service';
import { AuthController, UserController } from './controllers';
import { AuthService, CaslAbilityFactory, UserService } from './services';
import { AthleteInvitationService } from './services/athlete-invitation.service';
import { CoachInvitationService } from './services/coach-invitation.service';
import { InvitationService } from './services/invitation.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
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
    PrismaService,
  ],
  exports: [
    CaslAbilityFactory,
    UserService,
    JwtModule,
    AthleteInvitationService,
    CoachInvitationService,
  ],
})
export class AuthModule {}
