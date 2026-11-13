import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ApiEnvSchemaType,
  AuthResponseDto,
  CreateAccountDto,
  FirebaseLoginDto,
  LoginDto,
} from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AuthUser } from '../decorators/user.decorator';
import { FirebaseAuthService } from './firebase-auth.service';
import { UserService } from './user.service';

function deriveNames(params: { name?: string; email: string }): {
  firstName: string;
  lastName: string;
} {
  const safeName = (params.name || '').trim();
  if (safeName) {
    const parts = safeName.split(/\s+/g).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0]!, lastName: '' };
    }
    return {
      firstName: parts[0]!,
      lastName: parts.slice(1).join(' '),
    };
  }

  const emailLocalPart = params.email.split('@')[0] || 'Athlete';
  return { firstName: emailLocalPart, lastName: '' };
}

/** Who a sign-in provider says the user is */
export type ProviderIdentity = {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  invitationToken?: string;
  coachInvitationToken?: string;
  language?: CreateAccountDto['language'];
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private userService: UserService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  private createToken(
    userId: number,
    email: string,
    isRefresh: boolean,
  ): string {
    return sign(
      { userId: userId, email },
      this.configService.getOrThrow('JWT_SECRET_KEY'),
      {
        expiresIn: isRefresh ? '30d' : '1h',
      },
    );
  }

  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = credentials;
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        userId: true,
        password: true,
        email: true,
      },
    });
    if (!user?.password) throw new UnauthorizedException();

    await this.userService.comparePasswords(
      {
        pass_hash: user.password,
        pass_string: password,
      },
      { email },
    );

    return {
      accessToken: this.createToken(user.userId, user.email, false),
      refreshToken: this.createToken(user.userId, user.email, true),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = verify(
      refreshToken,
      this.configService.getOrThrow('JWT_SECRET_KEY'),
    ) as JwtPayload & Partial<{ userId: number }>;
    if (!payload.userId) throw new UnauthorizedException();
    const user = await this.prisma.user.findFirst({
      where: {
        userId: payload.userId,
      },
      select: {
        userId: true,
        email: true,
      },
    });
    if (!user) throw new UnauthorizedException();

    return {
      accessToken: this.createToken(user.userId, user.email, false),
      refreshToken: this.createToken(user.userId, user.email, true),
    };
  }

  async loginWithFirebase(body: FirebaseLoginDto): Promise<AuthResponseDto> {
    const verified = await this.firebaseAuthService.verifyIdToken(body.idToken);
    const user = await this.providerAccount({
      email: verified.email,
      name: verified.name,
      invitationToken: body.invitationToken,
      coachInvitationToken: body.coachInvitationToken,
      language: body.language,
    });
    return this.sessionFor(user);
  }

  /**
   * The account of an address a provider vouched for (Google,
   * Apple, an OpenID Connect provider), creating it on first sign-in within
   * the instance's sign-up mode.
   */
  async providerAccount(
    identity: ProviderIdentity,
  ): Promise<{ userId: number; email: string }> {
    const email = identity.email.toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: { email },
      select: { userId: true, email: true },
    });

    if (!user) {
      const derived = deriveNames({ name: identity.name, email });
      const firstName = identity.firstName?.trim() || derived.firstName;
      const lastName = identity.lastName?.trim() || derived.lastName;

      // Create a strong random password (OAuth users won't use it directly).
      const randomPassword = randomUUID();
      try {
        const created = await this.userService.createAccount(
          {
            email,
            password: randomPassword,
            firstName,
            lastName,
            invitationToken: identity.invitationToken,
            coachInvitationToken: identity.coachInvitationToken,
            language: identity.language,
          },
          { emailFromProvider: true },
        );
        user = { userId: created.userId, email };
      } catch (error) {
        // A concurrent sign-in for the same account created it first
        if (!(error instanceof ConflictException)) throw error;
        user = await this.prisma.user.findFirst({
          where: { email },
          select: { userId: true, email: true },
        });
        if (!user) throw error;
      }
    }

    return user;
  }

  /** The web app's session tokens for a user */
  sessionFor(user: { userId: number; email: string }): AuthResponseDto {
    return {
      accessToken: this.createToken(user.userId, user.email, false),
      refreshToken: this.createToken(user.userId, user.email, true),
    };
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.userId) {
      throw new UnauthorizedException();
    }
    if (!payload.email) {
      throw new UnauthorizedException();
    }
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: payload.email,
        },
        select: {
          userId: true,
          email: true,
          athlete: {
            select: {
              athleteId: true,
            },
          },
          coachAthletes: {
            select: {
              athleteId: true,
            },
          },
          clubMemberships: { select: { clubId: true, role: true } },
        },
      });

      if (!user) {
        throw new Error(`User not found for email ${payload.email}`);
      }

      if (user.userId !== payload.userId) {
        throw new Error(`Invalid id for email ${user.email}`);
      }

      return {
        ...user,
        userId: user.userId,
        athlete: user.athlete ? { athleteId: user.athlete.athleteId } : null,
        coachAthletes:
          user.coachAthletes?.map((ca) => ({ athleteId: ca.athleteId })) || [],
        clubMemberships: user.clubMemberships,
      };
    } catch (error) {
      this.logger.error('Error in validateUser', error);
      throw error;
    }
  }
}
