import { Module } from '@nestjs/common';

import { WebSocketRedisService } from './websocket-redis.service';

@Module({
  providers: [WebSocketRedisService],
  exports: [WebSocketRedisService],
})
export class WebSocketModule {}

