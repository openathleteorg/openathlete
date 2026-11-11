import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { FileCleanupScheduler } from './file-cleanup.scheduler';
import { FilesController } from './files.controller';
import { StoredFileService } from './stored-file.service';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [StoredFileService, FileCleanupScheduler],
})
export class FilesModule {}
