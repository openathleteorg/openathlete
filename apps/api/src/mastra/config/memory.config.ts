import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
// import { TokenLimiter, ToolCallFilter } from '@mastra/memory/dist/processors';
import { PgVector, PostgresStore } from '@mastra/pg';

const getDatabaseUrlForMastra = (): string => {
  const url = process.env.DATABASE_URL || '';
  return url.split('?')[0];
};

export const mastraStorage = new PostgresStore({
  connectionString: getDatabaseUrlForMastra(),
  schemaName: 'mastra',
});

const storage = mastraStorage;

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
      // new ToolCallFilter({
      //   exclude: [],
      // }),
      // new TokenLimiter(12000),
    ],
    options: {
      // Retrieve last 15 messages by default
      lastMessages: 15,

      // semanticRecall: {
      //   topK: 5, // Retrieve 5 most relevant message segments
      //   messageRange: 2, // Include 2 messages before and after each match
      //   scope: 'resource', // Search across all threads for this athlete
      // },

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

      threads: {
        generateTitle: true,
      },
    },
  });
}
