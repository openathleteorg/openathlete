import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
// import { TokenLimiter, ToolCallFilter } from '@mastra/memory/dist/processors';
import { PgVector, PostgresStore } from '@mastra/pg';

/**
 * Configure Mastra Memory for OpenAthlete Coach Assistant
 *
 * ARCHITECTURE:
 * - Storage: PostgreSQL (schema: 'mastra')
 * - Vector Store: PgVector for semantic recall
 * - Embedder: OpenAI text-embedding-3-small (1536 dimensions)
 *
 * FEATURES:
 * 1. Working Memory: Athlete profile, goals, training context
 * 2. Processors: TokenLimiter + ToolCallFilter for context optimization
 * 3. Semantic Recall: Retrieve relevant past conversation segments
 * 4. Thread-based: Each conversation is a thread, associated with athlete (resourceId)
 *
 * MEMORY SCOPES:
 * - Working Memory: 'resource' scope (athlete-level persistence)
 * - Semantic Recall: 'resource' scope (search across all athlete conversations)
 */

/**
 * Clean DATABASE_URL for Mastra (remove ?schema=public parameter)
 * The schemaName option in PostgresStore/PgVector handles schema routing
 */
const getDatabaseUrlForMastra = (): string => {
  const url = process.env.DATABASE_URL || '';
  // Remove ?schema=public or any schema parameter
  return url.split('?')[0];
};

const storage = new PostgresStore({
  connectionString: getDatabaseUrlForMastra(),
  schemaName: 'mastra',
});

const vector = new PgVector({
  connectionString: getDatabaseUrlForMastra(),
  schemaName: 'mastra',
});

const embedder = openai.embedding('text-embedding-3-small');

export function createMastraMemory(): Memory {
  return new Memory({
    storage,
    vector,
    embedder,
    processors: [
      // Limit context to ~12K tokens (GPT-4o supports 128K, but keep it efficient)
      // Filter tool calls from conversation history to reduce noise
      // new ToolCallFilter({
      //   exclude: [], // Empty = exclude all tool calls; specify tool names to exclude only those
      // }),
      // new TokenLimiter(12000),
    ],
    options: {
      // Retrieve last 15 messages by default
      lastMessages: 15,

      semanticRecall: {
        topK: 5, // Retrieve 5 most relevant message segments
        messageRange: 2, // Include 2 messages before and after each match
        scope: 'resource', // Search across all threads for this athlete
      },

      // Working memory: Athlete profile and training context
      workingMemory: {
        enabled: true,
        scope: 'resource', // Persist across all athlete threads (not per-thread)
        template: `# Athlete Profile

## Personal Information
- **Name**:
- **Age**:
- **Gender**:
- **Location / Timezone**:

## Training Context
- **Primary Sport**: [e.g., Marathon, Trail Running, Ultra]
- **Experience Level**: [e.g., Beginner, Intermediate, Advanced, Elite]
- **Current Training Phase**: [e.g., Base, Build, Peak, Recovery]

## Goals
- **Primary Goal**: [e.g., Complete first marathon, Sub-3h marathon, Finish UTMB]
- **Target Event**: [Name and date]
- **Secondary Goals**:

## Current Status
- **Training Volume**: [e.g., 50 km/week, 8h/week]
- **Recent Key Sessions**:
- **Known Limitations**: [e.g., Knee sensitivity, Time constraints]
- **Preferences**: [e.g., Morning runs, Trail focus, Loves intervals]

## Important Facts
- [Key conversation points, memorable details, important reminders]
`,
      },

      // Auto-generate thread titles from first message
      threads: {
        generateTitle: true,
      },
    },
  });
}

/**
 * USAGE PATTERN:
 *
 * const memory = createMastraMemory();
 * const agent = new Agent({ ...config, memory });
 *
 * await agent.generate(content, {
 *   threadId: conversationId,
 *   resourceId: athleteId.toString()
 * });
 *
 * BENEFITS:
 * - Working memory remembers athlete details across all conversations
 * - Semantic recall finds relevant past discussions automatically
 * - TokenLimiter prevents context overflow and reduces API costs
 * - ToolCallFilter keeps conversation history clean and focused
 * - Thread titles auto-generated for easy conversation management
 */
