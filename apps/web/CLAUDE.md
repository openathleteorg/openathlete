# Web app (React + Vite)

The same build ships to Vercel (hosted), to the Docker image (self-hosted) and to the Capacitor iOS and Android apps.

## Layout

- `src/api/<domain>/`: one folder per API domain.
  - `<domain>.api.ts`: static methods calling `client` and `routes` from `@/utils/axios`, typed with `@openathlete/shared` DTOs;
  - `<domain>.keys.ts`: stable React Query keys;
  - `<domain>.hooks.ts`: `useXQuery` and `useXMutation`. Mutations invalidate the queries they affect.
- `src/pages/`: route entry points. `src/views/`: page bodies. `src/components/`: reusable pieces, with shadcn/ui primitives in `components/ui/`.
- `src/routes/`: route tree (`sections/*.routes.tsx`). Build URLs with `getPath([...])` from `routes/paths.ts`.
- `src/contexts/`: auth (tokens in `localStorage`), current space (athlete or coach), chatbot.
- `messages/{en,fr,it,es}.json`: Paraglide catalogs. `src/paraglide/` is generated.

## Rules

- **Text**: every user-visible string is `m.some_key()` from `@/paraglide/messages`. Add the key to all four catalogs, then run `pnpm check:locale-parity` at the root (see the `i18n` skill).
- **Server state**: React Query hooks only. Don't copy query data into local state.
- **Forms**: React Hook Form with a Zod schema, built from `libs/shared` when the API validates the same data, and the `RHF*` fields in `components/hook-form` (they show validation messages). Show API errors with `toast.error`.
- **Small screens**: below 768px the dashboard uses `MobileWebHeader` and the sidebar drawer. Check new pages at 390px: no horizontal scroll, touch targets of 44px.
- **Native apps**: guard native-only code with `isCapacitor()` from `@/utils/capacitor`.
- **Third parties**: nothing may load or send data unless its build variable is set. PostHog, Contentsquare and error monitoring are opt-in (`utils/analytics.ts`, `utils/error-monitoring.ts`). The E2E test `makes no third-party request` enforces this.
- **Consent (GDPR)**: analytics and session recordings start only through `whenConsentGranted` (`utils/consent.ts`), after the user accepts the banner. A new tracker goes through it too, and is listed in the website privacy policy.
- **API URL**: read through `API_BASE_URL` (`src/config.ts`). Docker images inject it at runtime into a `<meta>` tag of `index.html` (`docker/40-api-public-url.sh`); never bake deployment values into the bundles.

## Checks

- `pnpm test`: Vitest unit tests (`*.test.ts`).
- `pnpm lint` and `pnpm tsc:check`. Rebuild `libs/shared` first if it changed.
- User flows: add or extend a Playwright test in `e2e/tests/web` or `e2e/tests/mobile` (see the `e2e` skill).
