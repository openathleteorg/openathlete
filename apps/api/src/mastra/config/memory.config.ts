import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

// TODO: Configure Mastra memory with working memory and processors
//
// CONFIGURATION:
// - Storage: PostgreSQL (using existing DATABASE_URL)
// - Schema: 'mastra' (dedicated schema for Mastra tables)
//
// TODO: ENABLE WORKING MEMORY & PROCESSORS (check Mastra docs for correct API)
// The following features need to be configured once we verify the API:
// - Working Memory: Track facts and context across messages
// - TokenLimiter: Prevent context overflow (~8000 tokens limit)
// - ToolCallFilter: Reduce verbose tool response noise
//
// THREAD ORGANIZATION:
// - threadId: Generated per conversation (UUID or athlete-based)
// - resourceId: athlete_id (associates memory with specific athlete)
// - Enables context preservation across multiple interactions
//
// BENEFITS:
// - Working memory retains key facts about athlete throughout conversation
// - Processors prevent hitting context window limits (cost optimization)
// - Thread-based organization maintains conversation state

const storage = new PostgresStore({
  connectionString: process.env.DATABASE_URL || '',
  schemaName: 'mastra',
});

export function createMastraMemory(): Memory {
  return new Memory({
    storage,
    // TODO: Add working memory configuration
    // workingMemory: {
    //   enabled: true,
    //   processMessages: true
    // },
    // TODO: Add memory processors
    // processors: [
    //   new TokenLimiter({ maxTokens: 8000 }),
    //   new ToolCallFilter({ excludeTools: [], keepIfError: true })
    // ]
  });
}

// USAGE NOTES:
// - Call createMastraMemory() when initializing agents or network
// - Always provide threadId when calling agent.generate() or network.generate()
// - Use resourceId = athleteId to associate memory with athlete
// - Working memory will automatically track important facts from conversation
//
// EXAMPLE:
// const memory = createMastraMemory();
// const agent = new Agent({ ...config, memory });
// await agent.generate(prompt, {
//   threadId: conversationId,
//   resourceId: athleteId.toString()
// });
