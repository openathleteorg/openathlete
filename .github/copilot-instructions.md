## OpenAthlete – AI Coding Agent Instructions

Purpose: Help you produce high–quality, idiomatic contributions quickly. Follow these project-specific patterns; avoid generic boilerplate.

### 1. Monorepo Layout & Workspaces

Packages managed with `pnpm` (see root `package.json`). Main areas:

- `apps/api` NestJS backend (Auth, Core domain, Notifications, Prisma integration)
- `apps/web` React + Vite frontend (React Query, Tailwind, ShadCN, Inlang i18n)
- `libs/database` Prisma client + schema (PostgreSQL, snake_case DB columns)
- `libs/shared` Cross-cutting TS utilities, DTO-ish types, key mappers, email helpers
  Lab prototypes under `lab/` (do NOT assume production stability there).

### 2. Data & Naming Conventions

- Database (Prisma schemas in `libs/database/prisma/schema/*.prisma`) uses `snake_case`.
- API & frontend use `camelCase` objects. Always convert DB results with `keysToCamel` (`libs/shared/src/utils/data.mapper.ts`). Example: in services (`apps/api/src/modules/core/services/athlete.service.ts`) results are wrapped before returning.
- When accepting inbound payloads to persist, convert to snake_case with `keysToSnake` if writing generic helpers.
- Avoid duplicating mapper logic; import from `@openathlete/shared`.

### 3. Authorization & Access Control

- CASL governs fine-grained permissions. Factory: `apps/api/src/modules/auth/services/casl-ability.factory.ts`.
- Pattern: build ability per request, check with `ability.can('read', subject('athlete', athleteEntity))` before returning sensitive data.
- When adding a new entity: extend Subjects in the ability factory and add `can()` rules close to similar ones (group by domain not alphabetically).

### 4. Service / Module Structure (Backend)

- Modules reside in `apps/api/src/modules/*`.
- Keep pure domain logic in `core/services/*` (e.g. `athlete.service.ts`, `equipment.service.ts`). Each service: fetch via `PrismaService`, authorize via CASL, map keys.
- Shared includes selectors (`ATHLETE_INCLUDES` pattern) to prevent over-fetching—reuse or define const include objects near top of service.
- Environment validation via Zod: `libs/shared/src/types/config/environments/*`. Add new required vars to schema + `.env.example`.

### 5. Environment & Secrets

- Local setup: copy `apps/web/.env.example` & `apps/api/.env.example` to real `.env` files.
- Required backend vars include STRAVA*\* and BREVO*\* (see `ApiEnvSchema`). If adding integration require: update schema + docs + example file.

### 6. OAuth / Connector Integrations

- Current external sport provider: Strava.
- Frontend trigger: `apps/web/src/views/dashboard/settings-view/connectors-tab.tsx` calling mutation to fetch provider auth URI.
- For new connector: mirror Strava pattern—add provider enum mapping (`utils/connector-provider.ts`, label map, icon), extend env schema, backend endpoint to generate OAuth URL, and DB persistence for tokens.

### 7. Frontend Patterns

- State & data fetching via React Query; mutations follow `useXMutation` naming inside `apps/web/src/services/`.
- Routing: React Router v7 under `apps/web/src/routes` (check before modifying navigation flows).
- UI components (ShadCN/Radix) use Tailwind utility classes. Favor composition over deep prop drilling.
- Internationalization uses Inlang Paraglide (`project.inlang`, `messages/`). When adding user-visible strings: use translation functions not literals.

### 8. Testing & Quality Gates

- Backend uses Jest (see `apps/api/package.json` `jest` section). Name tests `*.spec.ts` inside `src`.
- Run type/lint/format checks repo-wide: `pnpm tsc:check`, `pnpm lint`, `pnpm format`.
- Prefer adding a focused spec when introducing new service logic or authorization rule.

### 9. Build & Dev Workflows

- Install: `pnpm install` (Node 22 per root `engines`).
- First build shared libs if needed: `pnpm shared build` (some scripts rely on prior dist output).
- DB migrations deploy: `pnpm database run db:deploy` (wraps Prisma migrate deploy). Do NOT hand-edit generated client.
- Start dev (parallel web + api): `pnpm dev`.
- Individual package dev: `pnpm api dev` or `pnpm web dev`.

### 10. Database & Prisma

- Schema split across multiple prisma files; root `schema.prisma` just wires generator + datasource.
- Each domain file (e.g. `athlete.prisma`, `event.prisma`) contributes models via `prisma/schema/schema.prisma` inclusion pattern (ensure imports consistent when adding new file).
- After changing schema: run migration (appropriate script in `libs/database`) then commit both migration folder + updated generated types if generated.

### 11. Error & Exception Handling

- Backend throws Nest exceptions (`NotFoundException`, `ForbiddenException`) early; do not return `null` for missing entities—match existing services.
- Wrap external API failures (Strava, Brevo) with meaningful Nest HTTP exceptions to propagate consistent error shapes.

### 12. Adding New Domain Features (Backend Checklist)

1. Define Prisma model / extend existing.
2. Run migration + regenerate client.
3. Add service in `core/services`, include: fetch (Prisma), authorize (CASL), map (keysToCamel).
4. Expose via controller in `core/controllers` (follow existing naming; use DTO or Zod schema if pattern emerges).
5. Update CASL factory if new resource needs access control.

### 13. Common Anti-Patterns to Avoid

- Duplicating key conversion code—import from shared utils.
- Returning raw Prisma objects (snake_case) to controllers.
- Adding env vars without updating Zod schema + example files.
- Bypassing ability checks for user-bound resources.

### 14. Helpful Imports

- Prisma client: `import { PrismaService } from 'src/modules/prisma/services/prisma.service';`
- Key mapping: `import { keysToCamel } from '@openathlete/shared';`
- Ability: `const ability = await this.abilities.getFor({ user });`

### 15. When Unsure

Look for an analogue service/controller and mirror structure; consistency > novelty.

### 16. Adding a New Mastra Agent Tool (Complete Checklist)

The AI agent uses Mastra to provide conversational capabilities. Tools allow the agent to perform actions (fetch data, create resources, etc.). Follow this comprehensive checklist when adding a new tool.

#### Backend Implementation (apps/api/src/modules/agent)

**1. Create the Tool File (`tools/<tool-name>.tool.ts`)**

Structure your tool following this pattern:

```typescript
import { createTool } from '@mastra/core';
import { z } from 'zod';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type MyToolInput = {
  // Define your parameters
};

// Tool context type (always includes user)
type ToolContext = {
  user: AuthUser | null;
};

export function myToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'my-tool',  // Use kebab-case
    description: 'Clear description for the AI about when and how to use this tool',
    inputSchema: z.object({
      // Define parameters with descriptions to guide the AI
      param1: z.string().describe('Clear description of what this parameter is'),
      param2: z.number().optional().describe('Optional parameter'),
    }),
    outputSchema: z.object({
      // Define the structure of your output
      success: z.boolean(),
      data: z.record(z.unknown()),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      // Extract parameters from context
      const params = (context as any).context as MyToolInput;

      try {
        // 1. Fetch data via PrismaService
        const data = await prismaService.someModel.findMany({
          where: { athlete_id: user.user_id },
        });

        // 2. Transform data (DB uses snake_case, return camelCase or keep snake_case for consistency)
        // 3. Return formatted result
        return {
          success: true,
          data: { ... },
        };
      } catch (error) {
        console.error('[myTool] Error:', error);
        throw new Error(`Failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    },
  });
}
```

**2. Export Tool from Index (`tools/index.ts`)**

```typescript
export { myToolFactory } from "./my-tool.tool";
```

**3. Register Tool in Agent (`agents/openathlete.agent.ts`)**

```typescript
import { myToolFactory } from "../tools";

export function createOpenAthleteAgent(prismaService, toolContext) {
  const myTool = myToolFactory(prismaService, toolContext);

  return new Agent({
    name: "OpenAthlete Assistant",
    instructions: `...
    
You have access to tools to:
- My new tool capability
...`,
    model: "openai/gpt-4o",
    tools: {
      myTool: myTool, // Use camelCase for tool key
      // ... other tools
    },
  });
}
```

**4. Add Enriched Block Support (if needed) (`services/mastra-agent.service.ts`)**

If your tool returns data that should be displayed with a custom UI block (not just raw text):

a) Add a new block type to `libs/shared/src/types/dtos/agent/agent.dto.ts`:

```typescript
export const AgentBlockType = z.enum([
  // ... existing types
  "MY_CUSTOM_BLOCK",
]);
```

b) Add enrichment logic in `createEnrichedBlock` method:

```typescript
private async createEnrichedBlock(
  user: AuthUser,
  messageId: number,
  toolName: string,
  toolResult: Record<string, unknown>,
  onChunk: (data: StreamChunkData) => void,
): Promise<void> {
  let enrichedBlock: Record<string, unknown> | null = null;

  // Match both kebab-case and camelCase tool names
  if (toolName === 'myTool' || toolName === 'my-tool') {
    enrichedBlock = await this.blockService.createBlock(user, messageId, {
      type: 'MY_CUSTOM_BLOCK' as any,
      order: 2,
      content: 'Summary text',
      metadata: {
        // Store structured data for frontend rendering
        data: toolResult.data,
      },
      status: 'completed',
    });
  }
  // ... other tool enrichments

  if (enrichedBlock) {
    onChunk({ type: 'block_created', data: enrichedBlock });
  }
}
```

#### Frontend Implementation (apps/web)

**5. Add Tool Messages for i18n (`apps/web/messages/*.json`)**

Add processing and completed messages in **both** English and French:

**`messages/en.json`:**

```json
{
  "tool_my_tool_processing": "Performing action...",
  "tool_my_tool_completed": "Action completed"
}
```

**`messages/fr.json`:**

```json
{
  "tool_my_tool_processing": "Action en cours...",
  "tool_my_tool_completed": "Action terminée"
}
```

**6. Register Tool in Message Mapper (`apps/web/src/utils/tool-messages.ts`)**

```typescript
const TOOL_NAME_MAP: Record<string, string> = {
  "my-tool": "my_tool", // kebab-case from backend
  myTool: "my_tool", // camelCase variant
  // ... other tools
};

export function getToolMessage(
  toolName: string,
  status: "processing" | "completed"
): string {
  const normalizedTool = TOOL_NAME_MAP[toolName];

  // ... existing code ...

  if (normalizedTool === "my_tool") {
    return status === "processing"
      ? m.tool_my_tool_processing()
      : m.tool_my_tool_completed();
  }

  // ... fallback
}
```

**7. Add Custom Block Renderer (if needed) (`apps/web/src/components/chatbot/block-renderer.tsx`)**

If you added a custom block type:

a) Add case to `BlockRenderer`:

```typescript
export function BlockRenderer({ block, isStreaming }: BlockRendererProps) {
  switch (block.type) {
    // ... existing cases
    case 'MY_CUSTOM_BLOCK':
      return <MyCustomBlock block={block} />;
    default:
      return <TextBlock block={block} isStreaming={isStreaming} />;
  }
}
```

b) Implement the block component:

```typescript
function MyCustomBlock({ block }: { block: AgentMessageBlock }) {
  const data = block.metadata?.data as any;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        <IconComponent className="h-5 w-5" />
        <span className="text-sm font-medium">Block Title</span>
      </div>
      <div className="p-4 bg-background">
        {/* Render your custom UI with data */}
      </div>
    </div>
  );
}
```

#### Important Considerations

**Error Handling:**

- Always validate `user` context in tools
- Wrap Prisma calls in try-catch
- Throw descriptive errors that help debug issues
- Log errors with context: `console.error('[toolName] Context:', error)`

**Data Conventions:**

- DB queries return `snake_case`
- For consistency with existing tools, keep snake_case in tool outputs OR convert to camelCase if user-facing
- When using keysToCamel, import from `@openathlete/shared`

**Authorization:**

- Always filter by `user.user_id` or `user.athlete_id` in Prisma queries
- For advanced permissions, inject and use CASL ability checks

**Tool Naming:**

- Tool file: `my-tool.tool.ts` (kebab-case)
- Tool ID in Mastra: `'my-tool'` (kebab-case)
- Tool key in agent: `myTool` (camelCase)
- i18n keys: `tool_my_tool_*` (snake_case)

**Testing Your Tool:**

- Test via the chatbot UI at `/dashboard/chatbot`
- Verify tool is called correctly (check backend logs)
- Ensure enriched blocks render properly
- Test in both English and French
- Verify error states and edge cases

**Common Pitfalls to Avoid:**

- Forgetting to export tool from `tools/index.ts`
- Mismatched tool name formats (kebab vs camel) causing enrichment to fail
- Not adding i18n messages in BOTH languages
- Forgetting to add custom block type to shared DTO enum
- Not handling missing user context
- Returning Prisma objects directly without considering snake_case

**Checklist Summary:**

- [ ] Create tool file in `apps/api/src/modules/agent/tools/`
- [ ] Export from `tools/index.ts`
- [ ] Register in `agents/openathlete.agent.ts`
- [ ] Add enriched block logic if needed (shared DTO + service)
- [ ] Add i18n messages (EN + FR)
- [ ] Register tool in `tool-messages.ts`
- [ ] Add custom block renderer if needed
- [ ] Test thoroughly in chatbot UI
- [ ] Verify error handling and edge cases

### Miscellaneous

- All the comments in the codebase should be written in English.
- Use `// TODO:` comments to indicate areas needing future work.
- Always add text in multiple languages using the i18n system and paraglide.

---

Provide feedback if any section is unclear or missing for future refinement.
