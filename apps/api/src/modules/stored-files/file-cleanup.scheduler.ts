import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { StoredFileService } from './stored-file.service';

@Injectable()
export class FileCleanupScheduler {
  private readonly logger = new Logger(FileCleanupScheduler.name);

  constructor(private readonly files: StoredFileService) {}

  /** Idempotent: several containers running it at once is harmless */
  @Cron('25 3 * * *', { timeZone: 'UTC' })
  async deleteUnreferencedImages() {
    try {
      await this.files.deleteUnreferenced();
    } catch (error) {
      this.logger.error('Image cleanup failed', error);
    }
  }
}
