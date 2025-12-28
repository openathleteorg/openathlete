import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { TokenType, User } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async _generateToken(): Promise<string> {
    return randomUUID();
  }

  async _getExpiracy(type: TokenType): Promise<number> {
    switch (type) {
      case TokenType.PASSWORD_RESET:
        return 60 * 15 * 1000; // 15 minutes;
      case TokenType.ATHLETE_INVITATION:
        return 60 * 60 * 24 * 7 * 1000; // 7 days;
      case TokenType.COACH_INVITATION:
        return 60 * 60 * 24 * 7 * 1000; // 7 days;
      default:
        return 0;
    }
  }

  async createToken(user: Pick<User, 'userId'>, type: TokenType) {
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

  async verifyToken(token: string): Promise<User | null> {
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
    const tokenDate = new Date(tokenData.createdAt);
    const diff = now.getTime() - tokenDate.getTime();
    if (diff > expiracy) {
      await this.prisma.token.delete({
        where: {
          tokenId: tokenData.tokenId,
        },
      });
      return null;
    }
    return tokenData.user;
  }
}
