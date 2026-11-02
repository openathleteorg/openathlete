import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { InstanceController } from './instance.controller';

@Module({
  imports: [AuthModule],
  controllers: [InstanceController],
})
export class InstanceModule {}
