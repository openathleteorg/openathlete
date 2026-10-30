import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core/core.module';
import { SeoPlanController } from './seo-plan.controller';
import { SeoPlanService } from './seo-plan.service';

@Module({
  imports: [AuthModule, forwardRef(() => CoreModule)],
  controllers: [SeoPlanController],
  providers: [SeoPlanService],
  exports: [SeoPlanService],
})
export class SeoPlanModule {}
