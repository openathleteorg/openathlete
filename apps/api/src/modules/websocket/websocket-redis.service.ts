import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class WebSocketRedisService implements OnModuleInit {
  private readonly logger = new Logger(WebSocketRedisService.name);
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private adapter: ReturnType<typeof createAdapter> | null = null;

  async onModuleInit() {
    await this.initializeRedisClients();
  }

  private async initializeRedisClients() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not set, Socket.IO will use in-memory adapter (not suitable for production with multiple instances)',
      );
      return;
    }

    try {
      const config = this.parseRedisUrl(redisUrl);

      const pubDb = (config.db ?? 0) + 1;
      const subDb = (config.db ?? 0) + 2;

      this.pubClient = new Redis({
        ...config,
        db: pubDb,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.error(
              `Redis pub client connection failed after ${times} attempts`,
            );
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 10000,
        commandTimeout: 15000,
        enableReadyCheck: true,
        // maxRetriesPerRequest must be null for Socket.IO adapter
        maxRetriesPerRequest: null,
      });

      this.subClient = this.pubClient.duplicate();
      this.subClient.options.db = subDb;
      // Ensure subClient also has maxRetriesPerRequest set to null
      this.subClient.options.maxRetriesPerRequest = null;

      this.adapter = createAdapter(this.pubClient, this.subClient);

      this.logger.log(
        `Socket.IO Redis adapter initialized (pub: db ${pubDb}, sub: db ${subDb})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis adapter for Socket.IO: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private parseRedisUrl(redisUrl: string): {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
  } {
    const urlMatchWithUser = redisUrl.match(/^redis:\/\/([^:]+):([^@]+)@(.+)$/);
    if (urlMatchWithUser) {
      const [, username, password, hostPortDb] = urlMatchWithUser;
      const { host, port, db } = this.parseHostPortDb(hostPortDb);

      try {
        return {
          host,
          port,
          username,
          password: decodeURIComponent(password),
          db,
        };
      } catch {
        return {
          host,
          port,
          username,
          password,
          db,
        };
      }
    }

    const urlMatchNoUser = redisUrl.match(/^redis:\/\/(?::([^@]+)@)?(.+)$/);
    if (!urlMatchNoUser) {
      throw new Error('Invalid Redis URL format');
    }

    const [, password, hostPortDb] = urlMatchNoUser;
    const { host, port, db } = this.parseHostPortDb(hostPortDb);

    let decodedPassword: string | undefined;
    if (password) {
      try {
        decodedPassword = decodeURIComponent(password);
      } catch {
        decodedPassword = password;
      }
    }

    return {
      host,
      port,
      password: decodedPassword,
      db,
    };
  }

  private parseHostPortDb(hostPortDb: string): {
    host: string;
    port: number;
    db?: number;
  } {
    const bracketedMatch = hostPortDb.match(
      /^\[([^\]]+)\](?::(\d+))?(?:\/(\d+))?$/,
    );
    if (bracketedMatch) {
      const [, host, portStr, dbStr] = bracketedMatch;
      return {
        host,
        port: portStr ? parseInt(portStr, 10) : 6379,
        db: dbStr ? parseInt(dbStr, 10) : undefined,
      };
    }

    const lastColonIndex = hostPortDb.lastIndexOf(':');
    const slashIndex = hostPortDb.indexOf('/', lastColonIndex);

    if (lastColonIndex !== -1) {
      const portStr =
        slashIndex !== -1
          ? hostPortDb.substring(lastColonIndex + 1, slashIndex)
          : hostPortDb.substring(lastColonIndex + 1);

      const port = parseInt(portStr, 10);
      if (isNaN(port)) {
        return {
          host: hostPortDb,
          port: 6379,
        };
      }

      const host = hostPortDb.substring(0, lastColonIndex);
      const db =
        slashIndex !== -1
          ? parseInt(hostPortDb.substring(slashIndex + 1), 10)
          : undefined;

      return {
        host,
        port,
        db: isNaN(db as number) ? undefined : db,
      };
    }

    return {
      host: hostPortDb,
      port: 6379,
    };
  }

  getAdapter() {
    return this.adapter;
  }

  getPubClient() {
    return this.pubClient;
  }

  getSubClient() {
    return this.subClient;
  }

  async onModuleDestroy() {
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }
  }
}
