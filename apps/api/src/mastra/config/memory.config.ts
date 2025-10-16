import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

const storage = new PostgresStore({
  connectionString: process.env.DATABASE_URL || '',
  schemaName: 'mastra',
});

export function createMastraMemory(): Memory {
  return new Memory({
    storage,
  });
}
