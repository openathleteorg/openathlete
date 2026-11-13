# Contributing to OpenAthlete

Thank you for your interest in contributing to OpenAthlete! 🎉 We're excited to have you join our community of developers, athletes, and enthusiasts building the future of open-source training platforms.

This guide will help you understand how to contribute effectively to the project. Whether you're fixing bugs, adding features, improving documentation, or helping with translations, your contributions are valuable and appreciated.

## Table of Contents

- [Contributing to OpenAthlete](#contributing-to-openathlete)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Ways to Contribute](#ways-to-contribute)
    - [🐛 Report Bugs](#-report-bugs)
    - [💡 Suggest Features](#-suggest-features)
    - [🔧 Write Code](#-write-code)
    - [📝 Improve Documentation](#-improve-documentation)
    - [🌍 Translate](#-translate)
    - [🎨 Design \& UX](#-design--ux)
    - [📢 Spread the Word](#-spread-the-word)
  - [Getting Started](#getting-started)
  - [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Initial Setup](#initial-setup)
    - [Verifying Your Setup](#verifying-your-setup)
  - [Project Structure](#project-structure)
  - [Development Workflow](#development-workflow)
    - [Branch Naming](#branch-naming)
    - [Making Changes](#making-changes)
    - [Pre-commit Checklist](#pre-commit-checklist)
  - [Code Standards](#code-standards)
    - [TypeScript](#typescript)
    - [React (Frontend)](#react-frontend)
    - [NestJS (Backend)](#nestjs-backend)
    - [Database](#database)
    - [Internationalization (i18n)](#internationalization-i18n)
    - [Shared Types](#shared-types)
  - [Testing](#testing)
  - [Pull Request Process](#pull-request-process)
    - [PR Checklist](#pr-checklist)
    - [PR Description Template](#pr-description-template)
  - [Commit Message Convention](#commit-message-convention)
  - [Documentation](#documentation)
  - [Getting Help](#getting-help)
    - [📚 Resources](#-resources)
    - [💬 Community](#-community)
    - [🆘 Before Asking](#-before-asking)
    - [📝 When Asking for Help](#-when-asking-for-help)
  - [Recognition](#recognition)
  - [License](#license)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming, respectful, and inclusive environment for everyone.

**Key expectations:**
- Be respectful and considerate of others
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members
- Help create a positive learning environment

## Ways to Contribute

There are many ways to contribute to OpenAthlete, and not all of them require writing code:

### 🐛 Report Bugs
- Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- Search existing issues first to avoid duplicates
- Provide clear steps to reproduce
- Include relevant environment details

### 💡 Suggest Features
- Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- Explain the problem you're trying to solve
- Describe your proposed solution
- Consider alternative approaches

### 🔧 Write Code
- Fix bugs (look for issues labeled `bug` or `good first issue`)
- Implement features (check issues labeled `enhancement` or `help wanted`)
- Improve code quality and performance
- Refactor existing code

### 📝 Improve Documentation
- Fix typos and clarify explanations
- Add missing documentation
- Improve code comments
- Update examples and tutorials

### 🌍 Translate
- Add translations for new features
- Improve existing translations
- Add support for new languages
- See [Internationalization](#internationalization-i18n) section for details

### 🎨 Design & UX
- Improve UI/UX
- Create mockups for new features
- Provide design feedback
- Improve accessibility

### 📢 Spread the Word
- Star the repository
- Share OpenAthlete with others
- Write blog posts or tutorials
- Help others in discussions

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up your development environment** (see [Development Setup](#development-setup))
4. **Create a branch** for your changes
5. **Make your changes** following our guidelines
6. **Test your changes** thoroughly
7. **Submit a pull request**

## Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v22 (version in `.nvmrc`; we recommend using [nvm](https://github.com/nvm-sh/nvm) for version management)
- **pnpm** v9.x or higher ([installation guide](https://pnpm.io/installation))
- **Docker**, for the local PostgreSQL and Redis and the integration and end-to-end tests
- **Git** (latest version recommended)

> 💡 **Tip**: If you have Node.js installed, you can check your version with `node --version`. Use `nvm use` (or `nvm install && nvm use` if needed) to ensure you're using the correct version.

### Initial Setup

1. **Fork and clone the repository:**
   ```bash
   # Fork the repository on GitHub first, then:
   git clone https://github.com/YOUR_USERNAME/openathlete.git
   cd openathlete
   ```

2. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/openathleteorg/openathlete.git
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Set up environment variables:**
   
   **Frontend:**
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   
   **Backend and database:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp libs/database/.env.example libs/database/.env
   ```
   
   Update the `.env` files with your local configuration. At minimum, you'll need:
   - `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/openathlete`)
   - `JWT_SECRET_KEY` and `HASH_PEPPER` - secrets of at least 32 characters (generate with `openssl rand -base64 48`)
   - `VITE_API_BASE_URL` - Backend API URL (for frontend, e.g., `http://localhost:3000`)

5. **Set up Node.js version:**
   ```bash
   nvm use
   # If the version isn't installed:
   nvm install && nvm use
   ```

6. **Build shared packages:**
   ```bash
   pnpm shared build
   ```

7. **Start PostgreSQL and Redis, and apply the migrations:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   pnpm database run db:generate
   pnpm database run db:deploy
   ```

   The default `DATABASE_URL` and `REDIS_URL` in the `.env.example` files match this setup. To use your own PostgreSQL instead, it needs the [pgvector](https://github.com/pgvector/pgvector) extension.

8. **Start the development servers:**
   ```bash
   pnpm dev
   ```
   
   This will start:
   - **Frontend** at `http://localhost:5173`
   - **Backend API** at `http://localhost:3000`

### Verifying Your Setup

After setup, verify everything is working:

1. **Type checking:**
   ```bash
   pnpm tsc:check
   ```

2. **Linting:**
   ```bash
   pnpm lint
   ```

3. **Formatting:**
   ```bash
   pnpm format
   ```

4. **Access the application:**
   - Open `http://localhost:5173` in your browser
   - The API should be accessible at `http://localhost:3000`
   - Check the API documentation at `http://localhost:3000/docs` (Swagger)

## Project Structure

OpenAthlete is a monorepo using pnpm workspaces. Here's the structure:

```
openathlete/
├── apps/
│   ├── api/              # NestJS backend application
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared utilities
│   │   │   └── main.ts   # Application entry point
│   │   └── package.json
│   ├── web/              # React frontend application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── lib/        # Utilities and helpers
│   │   │   └── routes/     # Route definitions
│   │   ├── messages/       # Translation files (Paraglide)
│   │   └── package.json
│   ├── docs/              # Documentation site
│   └── website/           # Marketing website
├── libs/
│   ├── shared/            # Shared types, DTOs, and utilities
│   │   └── src/          # Source of truth for API contracts
│   ├── database/          # Prisma schema and migrations
│   │   └── prisma/
│   │       └── schema/    # Database schema (split by domain)
│   └── config/            # Shared configuration
│       ├── eslint-config/ # ESLint configuration
│       └── prettier-config/ # Prettier configuration
├── scripts/               # Utility scripts
└── package.json          # Root package.json
```

**Key principles:**
- **Shared types** (`libs/shared`) are the source of truth for DTOs and API contracts
- **Database schema** is split by domain in `libs/database/prisma/schema/`
- **Frontend translations** are in `apps/web/messages/` (Paraglide)
- **Monorepo scripts** are run from the root using `pnpm <command>`

## Development Workflow

### Branch Naming

Create descriptive branches for your changes:

```bash
# Features
git checkout -b feature/add-workout-export

# Bug fixes
git checkout -b fix/login-error-handling

# Documentation
git checkout -b docs/update-api-docs

# Refactoring
git checkout -b refactor/improve-auth-service
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Making Changes

1. **Update your fork:**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create your branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Write code following our [code standards](#code-standards)
   - Add tests if applicable
   - Update documentation
   - Follow the [pre-commit checklist](#pre-commit-checklist)

4. **Test your changes:**
   ```bash
   # Type checking
   pnpm tsc:check
   
   # Linting
   pnpm lint
   
   # Formatting
   pnpm format
   ```

5. **Commit your changes:**
   Follow our [commit message convention](#commit-message-convention)

6. **Push and create a PR:**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create a pull request on GitHub.

### Pre-commit Checklist

Before committing, ensure:

- [ ] Code follows our [code standards](#code-standards)
- [ ] Type checking passes: `pnpm tsc:check`
- [ ] Linting passes: `pnpm lint`
- [ ] Formatting is correct: `pnpm format`
- [ ] All user-facing strings use Paraglide (no hardcoded text)
- [ ] Translations are added for new strings (if applicable)
- [ ] Database migrations are created (if schema changed)
- [ ] Documentation is updated (if needed)
- [ ] Commit message follows [convention](#commit-message-convention)

## Code Standards

### TypeScript

**Zero `any` policy:** We have a strict no-`any` policy. Always use precise types.

**Guidelines:**
- Use TypeScript for all new code
- Follow strict type checking (no `any` types)
- Use shared types from `@openathlete/shared` when available
- Prefer Zod-inferred types, discriminated unions, and exhaustive switches
- Use meaningful variable and function names
- Prefer `async/await` over promises
- Use functional programming patterns where appropriate

**Example:**
```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
import { ProcessDataDto } from '@openathlete/shared';

function processData(data: ProcessDataDto): number {
  return data.value;
}
```

### React (Frontend)

**Guidelines:**
- Use functional components with hooks
- Follow existing component patterns
- Use Tailwind CSS for styling
- Implement responsive design
- Follow accessibility guidelines (WCAG)
- Use React Query for server state management
- Keep components small and focused
- Extract reusable logic into custom hooks

**Component structure:**
```typescript
// ✅ Good component structure
import { m } from '@/paraglide/messages';
import { useQuery } from '@tanstack/react-query';

export function WorkoutList() {
  const { data, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: fetchWorkouts,
  });

  if (isLoading) return <div>{m.loading()}</div>;

  return (
    <div>
      {data?.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

**Important:**
- **Always use Paraglide** for user-facing strings (see [Internationalization](#internationalization-i18n))
- Never hardcode English text in components
- Use React Query for all server state
- Avoid mixing server state with local state

### NestJS (Backend)

**Guidelines:**
- Follow NestJS best practices and patterns
- Use dependency injection
- Keep controllers thin (delegate to services)
- Implement proper error handling
- Use guards for authentication and authorization
- Write comprehensive API documentation (Swagger)
- Use DTOs for data validation (Zod schemas)
- Perform CASL ability checks in services
- Don't bypass guards or CASL checks

**Module structure:**
```
src/modules/
  └── feature-name/
      ├── feature-name.module.ts
      ├── controllers/
      │   └── feature-name.controller.ts
      └── services/
          └── feature-name.service.ts
```

**Controller example:**
```typescript
// ✅ Good controller
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ZodValidationPipe } from 'nestjs-zod';
import { GetWorkoutsDto } from '@openathlete/shared';

@Controller('workouts')
@UseGuards(AuthGuard('jwt'))
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Get()
  async findAll(@Query(ZodValidationPipe) query: GetWorkoutsDto) {
    return this.workoutService.findAll(query);
  }
}
```

**Service example:**
```typescript
// ✅ Good service
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@openathlete/database';

@Injectable()
export class WorkoutService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetWorkoutsDto) {
    // CASL checks here
    // Business logic here
    return this.prisma.workout.findMany({
      where: { userId: query.userId },
    });
  }
}
```

**Important:**
- Use `PrismaService` directly (no repository pattern)
- Validate input with `ZodValidationPipe` using schemas from `@openathlete/shared`
- Guard authenticated routes with `@UseGuards(AuthGuard('jwt'))`
- Get user via `@JwtUser()` decorator
- Keep business rules and CASL checks in services

### Database

**Guidelines:**
- Use Prisma for all database operations
- Write migrations for schema changes
- Follow existing naming conventions
- Include proper indexes and relationships
- Split schema by domain in `libs/database/prisma/schema/`

**Schema changes workflow:**
1. Edit the appropriate schema file in `libs/database/prisma/schema/`
2. **Wait for approval** before running Prisma commands
3. Summarize schema diffs in your PR description
4. After approval, generate Prisma client:
   ```bash
   pnpm database run db:generate
   ```
5. Create migration:
   ```bash
   pnpm database run db:migrate dev
   ```
6. **Never hand-edit** the generated Prisma client

**Example schema:**
```prisma
// libs/database/prisma/schema/workout.prisma
model Workout {
  id        String   @id @default(cuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("workout")
}
```

### Internationalization (i18n)

**Critical:** All user-facing strings MUST use Paraglide. Never hardcode English text.

**Guidelines:**
- **Always use Paraglide** for translations in `apps/web`
- Import messages: `import { m } from '@/paraglide/messages'`
- Use message keys: `{m.my_message()}`
- Message keys use `snake_case`
- Add translations to every catalog in `apps/web/messages/` (`en`, `fr`, `it`, `es`, `pt-BR`, `de`)

**Adding new translations:**
1. Add the message key to `apps/web/messages/en.json`:
   ```json
   {
     "workout_created_successfully": "Workout created successfully"
   }
   ```
2. Add the translation to every other catalog, for example `apps/web/messages/fr.json`:
   ```json
   {
     "workout_created_successfully": "Entraînement créé avec succès"
   }
   ```
3. Regenerate Paraglide messages:
   ```bash
   cd apps/web
   pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
   ```
4. Use in your component:
   ```typescript
   import { m } from '@/paraglide/messages';
   
   function MyComponent() {
     return <div>{m.workout_created_successfully()}</div>;
   }
   ```

**Checking for untranslated strings:**
```bash
pnpm find:untranslated
pnpm check:locale-parity
```

### Shared Types

**Guidelines:**
- All DTOs and shared types are defined in `libs/shared`
- Export Zod schemas and inferred types
- Import from `@openathlete/shared` everywhere (API and UI)
- This is the source of truth for API contracts

**Example:**
```typescript
// libs/shared/src/workout/dto.ts
import { z } from 'zod';

export const CreateWorkoutDtoSchema = z.object({
  name: z.string().min(1),
  duration: z.number().positive(),
});

export type CreateWorkoutDto = z.infer<typeof CreateWorkoutDtoSchema>;
```

**Using in backend:**
```typescript
import { CreateWorkoutDto, CreateWorkoutDtoSchema } from '@openathlete/shared';

@Post()
async create(@Body(ZodValidationPipe(CreateWorkoutDtoSchema)) dto: CreateWorkoutDto) {
  // ...
}
```

**Using in frontend:**
```typescript
import { CreateWorkoutDto } from '@openathlete/shared';

const mutation = useMutation({
  mutationFn: (data: CreateWorkoutDto) => api.workouts.create(data),
});
```

## Testing

Add tests with every bug fix and feature, at the lowest level that catches the regression:

| Level | Where | Run |
| --- | --- | --- |
| Unit (API) | `apps/api/src/**/*.spec.ts` (Jest) | `pnpm api test` |
| Unit (web) | `apps/web/src/**/*.test.ts` (Vitest) | `pnpm web test` |
| Integration (real PostgreSQL) | `apps/api/src/**/*.int-spec.ts` | `scripts/verify.sh --integration` |
| AI agents (fake OpenAI API) | `apps/api/test/agents.test.cjs` | `scripts/verify.sh --build` |
| End to end (production Docker images, Playwright) | `e2e/tests/` | `scripts/verify.sh --e2e` |

`scripts/verify.sh` runs the same checks as CI: lint, type check, translations and unit tests by default, and more with `--build`, `--integration`, `--e2e` or `--all`. It needs Docker for the last two.

## Pull Request Process

### PR Checklist

Before submitting your PR, ensure:

- [ ] Your branch is up to date with `upstream/main`
- [ ] All tests pass (if applicable)
- [ ] Type checking passes: `pnpm tsc:check`
- [ ] Linting passes: `pnpm lint`
- [ ] Formatting is correct: `pnpm format`
- [ ] All user-facing strings use Paraglide
- [ ] Translations are added for new strings
- [ ] Database migrations are created (if schema changed)
- [ ] Documentation is updated
- [ ] PR description is clear and follows the template
- [ ] Related issues are linked

### PR Description Template

Use this template for your PR description:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tests added/updated
- [ ] Manual testing performed
- [ ] All tests pass

## Screenshots (if applicable)
<!-- Add screenshots here -->

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Type checking passes
- [ ] Linting passes
```

**PR Process:**
1. **Create your PR** from your fork to `openathleteorg/openathlete`
2. **Fill out the PR template** completely
3. **Link related issues** using keywords (e.g., "Closes #123")
4. **Request review** from maintainers
5. **Address feedback** promptly and professionally
6. **Keep your branch updated** by rebasing on `upstream/main` if needed
7. **Once approved**, a maintainer will merge your PR

**What happens next:**
- Maintainers will review your PR
- CI/CD will run automated checks (lint, type-check, build)
- You may receive feedback or requested changes
- Once approved, your PR will be merged
- Your contribution will be recognized (see [Recognition](#recognition))

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Scopes (optional):**
- `api` - Backend changes
- `web` - Frontend changes
- `shared` - Shared library changes
- `database` - Database changes
- `docs` - Documentation changes
- `i18n` - Translation changes

**Examples:**
```bash
# Feature
feat(web): add workout export functionality

# Bug fix
fix(api): handle null values in workout service

# Documentation
docs: update development setup guide

# With scope and body
feat(api): add workout filtering

Add support for filtering workouts by date range and sport type.
This improves the user experience when viewing large workout lists.

Closes #123
```

**Tips:**
- Use imperative mood ("add" not "added" or "adds")
- Keep the subject line under 50 characters
- Capitalize the first letter
- Don't end with a period
- Reference issues in the footer: `Closes #123`

## Documentation

**Guidelines:**
- Keep documentation up to date
- Use JSDoc comments for functions and components
- Add comments for complex logic
- Update README if needed
- Update docs site (`apps/docs`) for user-facing changes

**Documentation locations:**
- **Code comments**: Inline documentation for complex logic
- **JSDoc**: Function and class documentation
- **README.md**: Project overview and quick start
- **apps/docs**: Comprehensive documentation site
- **API docs**: Auto-generated from Swagger annotations

**Example JSDoc:**
```typescript
/**
 * Calculates training load based on workout duration and intensity.
 * 
 * @param duration - Workout duration in minutes
 * @param intensity - Intensity level (1-10)
 * @returns Training load points
 * 
 * @example
 * ```typescript
 * const load = calculateTrainingLoad(60, 7);
 * // Returns: 420
 * ```
 */
function calculateTrainingLoad(duration: number, intensity: number): number {
  return duration * intensity;
}
```

## Getting Help

We're here to help! Here are ways to get support:

### 📚 Resources
- **Documentation**: [docs.openathlete.org](https://docs.openathlete.org)
- **API Docs**: [api.openathlete.org/docs](https://api.openathlete.org/docs)
- **Discord**: [Join our community](https://discord.gg/j4PP6tDwuP)
- **GitHub Issues**: [Report bugs](https://github.com/openathleteorg/openathlete/issues)

### 💬 Community
- **Discord**: Best for questions and discussions - [Join us](https://discord.gg/j4PP6tDwuP)
- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For code-related questions

### 🆘 Before Asking
1. **Search existing issues** and Discord messages
2. **Check the documentation**
3. **Review similar code** in the codebase
4. **Try to reproduce** the issue yourself

### 📝 When Asking for Help
- Be clear and specific
- Provide context (what you're trying to do)
- Include error messages and logs
- Share relevant code snippets
- Mention what you've already tried

## Recognition

We value all contributions! Contributors are recognized in:

- **GitHub Contributors** - Automatic recognition in the contributors list
- **Release Notes** - Mentioned in release announcements
- **Documentation** - Listed in contributor acknowledgments
- **Community** - Appreciated in discussions and reviews

Thank you for helping make OpenAthlete better! 🎉

## License

By contributing to OpenAthlete, you agree that your contributions will be licensed under the project's [MPL-2.0 License](LICENSE).

---

**Ready to contribute?** Start by:
1. [Forking the repository](https://github.com/openathleteorg/openathlete/fork)
2. [Setting up your development environment](#development-setup)
3. [Finding an issue to work on](https://github.com/openathleteorg/openathlete/issues?q=is:open+label:"good+first+issue")
4. [Creating your first pull request](#pull-request-process)

**Questions?** Don't hesitate to ask in our [Discord community](https://discord.gg/j4PP6tDwuP)!

Thank you for contributing to OpenAthlete! Together, we're building the future of open-source training platforms. 🚀
