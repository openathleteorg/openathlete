import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { SubscriptionModule } from '../subscription';
import { AuthController, UserController } from './controllers';
import { OidcController } from './controllers/oidc.controller';
import { UserTypeGuard } from './guards';
import { AuthService, CaslAbilityFactory, UserService } from './services';
import { AccountDeletionService } from './services/account-deletion.service';
import { AccountExportService } from './services/account-export.service';
import { AthleteInvitationService } from './services/athlete-invitation.service';
import { CoachInvitationService } from './services/coach-invitation.service';
import { FirebaseAuthService } from './services/firebase-auth.service';
import { InvitationService } from './services/invitation.service';
import { OidcService } from './services/oidc.service';
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
  controllers: [AuthController, OidcController, UserController],
  providers: [
    AuthService,
    FirebaseAuthService,
    UserService,
    AccountDeletionService,
    AccountExportService,
    TokenService,
    OidcService,
    AthleteInvitationService,
    CoachInvitationService,
    InvitationService,
    JwtStrategy,
    CaslAbilityFactory,
    UserTypeGuard,
  ],
  exports: [
    CaslAbilityFactory,
    UserService,
    JwtModule,
    UserTypeGuard,
    AthleteInvitationService,
    CoachInvitationService,
    OidcService,
  ],
})
export class AuthModule {}
