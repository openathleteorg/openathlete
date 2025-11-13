import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

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
      // Parse Redis URL (similar to QueueModule logic)
      const config = this.parseRedisUrl(redisUrl);

      // Create pub/sub clients for Socket.IO adapter
      // Use different DB numbers to avoid conflicts (db + 1 for pub, db + 2 for sub)
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
      });

      this.subClient = this.pubClient.duplicate();
      this.subClient.options.db = subDb;

      // Create adapter
      this.adapter = createAdapter(this.pubClient, this.subClient);

      this.logger.log(
        `Socket.IO Redis adapter initialized (pub: db ${pubDb}, sub: db ${subDb})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis adapter for Socket.IO: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - allow app to start without Redis adapter
      // Socket.IO will fall back to in-memory adapter
    }
  }

  private parseRedisUrl(redisUrl: string): {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
  } {
    // Try format with username first: redis://username:password@host
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

    // Try format without username: redis://:password@host or redis://host
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
    // Check if IPv6 is in brackets
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

    // No brackets - find last : before / or end
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

