import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { SubscriptionModule } from '../subscription/subscription.module';
import { FileCleanupScheduler } from './file-cleanup.scheduler';
import { FilesController } from './files.controller';
import { StoredFileService } from './stored-file.service';

@Module({
  imports: [AuthModule, forwardRef(() => SubscriptionModule)],
  controllers: [FilesController],
  providers: [StoredFileService, FileCleanupScheduler],
})
export class FilesModule {}
