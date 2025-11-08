import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { token_type, user } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async _generateToken(): Promise<string> {
    return randomUUID();
  }

  async _getExpiracy(type: token_type): Promise<number> {
    switch (type) {
      case token_type.PASSWORD_RESET:
        return 60 * 15 * 1000; // 15 minutes;
      case token_type.ATHLETE_INVITATION:
        return 60 * 60 * 24 * 7 * 1000; // 7 days;
      case token_type.COACH_INVITATION:
        return 60 * 60 * 24 * 7 * 1000; // 7 days;
      default:
        return 0;
    }
  }

  async createToken(user: Pick<user, 'user_id'>, type: token_type) {
    const token = await this.prisma.token.create({
      data: {
        user: {
          connect: user,
        },
        token: await this._generateToken(),
        type,
      },
    });

    return token;
  }

  async verifyToken(token: string): Promise<user | null> {
    const tokenData = await this.prisma.token.findFirst({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    if (!tokenData) {
      return null;
    }

    const expiracy = await this._getExpiracy(tokenData.type);
    const now = new Date();
    const tokenDate = new Date(tokenData.created_at);
    const diff = now.getTime() - tokenDate.getTime();
    if (diff > expiracy) {
      await this.prisma.token.delete({
        where: {
          token_id: tokenData.token_id,
        },
      });
      return null;
    }
    return tokenData.user;
  }
}
