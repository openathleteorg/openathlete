import { Global, Module } from '@nestjs/common';

import { StorageService } from './storage.service';

/** Global: account deletion needs the bucket without the files module */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
