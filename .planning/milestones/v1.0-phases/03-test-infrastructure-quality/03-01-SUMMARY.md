---
phase: 03-test-infrastructure-quality
plan: 01
subsystem: testing
tags: [vitest, msw, testing-library, react-query, zod, jsdom]

# Dependency graph
requires:
  - phase: 02-type-safety
    provides: calculateMacros, useWorkouts, localDate, workoutSchema, profileSchema — source under test
provides:
  - Vitest 4 test infrastructure with jsdom, vite-tsconfig-paths, React plugin
  - MSW setupServer with Supabase PostgREST handler for workouts
  - React Query test wrapper with retry disabled (createWrapper, renderWithProviders)
  - 31 passing tests across 5 test files covering calculateMacros, dates, schemas, and useWorkouts
affects: [03-02-ui-components]

# Tech tracking
tech-stack:
  added:
    - vitest@4.1.0
    - "@vitejs/plugin-react@6.0.1"
    - "@testing-library/react@16.3.2"
    - "@testing-library/jest-dom@6.9.1"
    - "@testing-library/user-event@14.6.1"
    - "@testing-library/dom@10.4.1"
    - "msw@2.12.13"
    - "jsdom@29.0.0"
    - "vite-tsconfig-paths@6.1.1"
    - "@vitest/coverage-v8@4.1.0"
    - "@radix-ui/react-alert-dialog@1.1.15"
  patterns:
    - Vitest globals=true with explicit imports (import { describe, it, expect } from 'vitest')
    - vi.mock hoisting pattern — factory cannot reference external variables
    - __mockX pattern to expose vi.fn instances from hoisted vi.mock factory
    - createWrapper() per-test pattern to prevent React Query cross-test cache bleed
    - gcTime:0 staleTime:0 retry:false in test QueryClient to avoid timeouts and cache bleed

key-files:
  created:
    - vitest.config.ts
    - src/__tests__/setup.ts
    - src/__tests__/mocks/server.ts
    - src/__tests__/mocks/handlers.ts
    - src/__tests__/helpers/renderWithProviders.tsx
    - src/__tests__/utils/macros/calculateMacros.test.ts
    - src/__tests__/utils/dates/localDate.test.ts
    - src/__tests__/schemas/workoutSchema.test.ts
    - src/__tests__/schemas/profileSchema.test.ts
    - src/__tests__/hooks/workouts/useWorkouts.test.ts
  modified:
    - package.json

key-decisions:
  - "vi.mock used for supabaseClient in useWorkouts tests — @supabase/node-fetch bypasses MSW global fetch interception entirely"
  - "__mockOrder/__mockSelect pattern exposes vi.fn from hoisted vi.mock factory via module re-import"
  - "MSW handlers retained for non-hook tests and future use; useWorkouts mocks supabase at module level instead"
  - "vitest.config.ts env block provides NEXT_PUBLIC_SUPABASE_URL and ANON_KEY — supabaseClient.ts throws at import time without them"

patterns-established:
  - "Test mock pattern: vi.mock factory uses __mockX exports to expose fns; import * as module to access them"
  - "createWrapper() called fresh per test to get isolated QueryClient — never shared between tests"
  - "beforeEach() resets mock chain (mockFrom -> mockSelect -> mockOrder) to default success response"

requirements-completed: [QUAL-01]

# Metrics
duration: 11min
completed: 2026-03-19
---

# Phase 03 Plan 01: Test Infrastructure Summary

**Vitest 4 + MSW + React Query test infrastructure with 31 passing tests covering calculateMacros unit tests, useWorkouts integration tests (vi.mock), date utilities, and Zod schema validation**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-19T17:35:28Z
- **Completed:** 2026-03-19T17:46:55Z
- **Tasks:** 2
- **Files modified:** 11 (1 modified, 10 created)

## Accomplishments
- Installed complete Vitest 4 test stack: vitest, @testing-library/react, msw, jsdom, vite-tsconfig-paths, @vitest/coverage-v8, @radix-ui/react-alert-dialog
- Created full test infrastructure: vitest.config.ts, MSW server + handlers, React Query test wrapper, global setup
- 31 tests passing across 5 test files: calculateMacros (10), localDate (4), workoutSchema (5), profileSchema (7), useWorkouts (4) — exit code 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, configure Vitest, create test infrastructure** - `ff827f7` (chore)
2. **Task 2: Write unit tests and integration tests for all test targets** - `16ccf2c` (feat)

**Plan metadata:** (docs commit in progress)

## Files Created/Modified
- `vitest.config.ts` - Vitest 4 config: jsdom, tsconfigPaths, react plugin, env vars, setupFiles
- `src/__tests__/setup.ts` - Global test setup: jest-dom matchers, MSW server lifecycle
- `src/__tests__/mocks/server.ts` - MSW setupServer export
- `src/__tests__/mocks/handlers.ts` - Default handler: GET /rest/v1/workouts returns test workout row
- `src/__tests__/helpers/renderWithProviders.tsx` - createWrapper() and renderWithProviders() with isolated QueryClient
- `src/__tests__/utils/macros/calculateMacros.test.ts` - 10 tests: BMR formulas, TDEE, getMacroSplit ratios, goal adjustments
- `src/__tests__/utils/dates/localDate.test.ts` - 4 tests: yyyy-MM-dd formatting, zero-padding
- `src/__tests__/schemas/workoutSchema.test.ts` - 5 tests: WorkoutTemplateSchema and ExerciseTemplateSchema
- `src/__tests__/schemas/profileSchema.test.ts` - 7 tests: ProfileSchema bounds/enums, UserProfileSchema nullable fields
- `src/__tests__/hooks/workouts/useWorkouts.test.ts` - 4 tests: success path, exercises array, error state, loading state
- `package.json` - Added test/test:watch/test:ci scripts; devDependencies updated

## Decisions Made

**@supabase/node-fetch bypasses MSW:** The Supabase PostgREST client imports `@supabase/node-fetch` (uses Node.js `http`/`https` modules directly), which completely bypasses `globalThis.fetch` that MSW v2 intercepts. Discovered when useWorkouts tests stayed in `isPending` forever despite MSW being set up correctly.

**vi.mock solution:** Mocked `@/lib/supabaseClient` at the module level using `vi.mock`. The factory uses the `__mockOrder`/`__mockSelect` export trick to expose `vi.fn` instances from inside the hoisted factory (vi.mock factories cannot reference variables declared in the test file scope). This preserves the test's intent: controlling Supabase response data per-test with per-test error injection.

**MSW handlers retained:** The MSW server and handlers remain in place for future tests that may not use the supabase client directly (e.g., testing API routes, form submissions), and the design matches what the plan specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced MSW interceptor with vi.mock for useWorkouts tests**
- **Found during:** Task 2 (Write unit tests and integration tests)
- **Issue:** @supabase/node-fetch (used internally by @supabase/postgrest-js) bypasses MSW's global fetch interception. Tests using `renderHook(() => useWorkouts())` with MSW handlers stayed in `fetchStatus: "fetching"` indefinitely — the HTTP request was never intercepted.
- **Fix:** Used `vi.mock('@/lib/supabaseClient', ...)` to mock the supabase client at module level. Exposed vi.fn instances via `__mockOrder`/`__mockSelect` exports on the mock module, then controlled per-test responses via `beforeEach` and per-test `mockResolvedValue` calls.
- **Files modified:** src/__tests__/hooks/workouts/useWorkouts.test.ts
- **Verification:** All 4 useWorkouts tests pass — success path returns parsed data, error path reaches isError=true, loading state confirmed
- **Committed in:** 16ccf2c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test approach)
**Impact on plan:** Fix necessary for tests to work at all. The behavioral tests match plan requirements exactly: success path, error path, and loading state are all verified. MSW infrastructure is retained for future use.

## Issues Encountered
- `@supabase/node-fetch` custom fetch bypasses MSW — discovered through debug testing (fetchStatus staying "fetching" indefinitely). Resolved by mocking at module level with vi.mock.
- vi.mock hoisting with external variable references: ReferenceError on first attempt. Resolved using self-contained factory with `__mockX` export pattern.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test infrastructure complete: `npx vitest run` exits 0 with 31 passing tests
- `npm run test:ci` script ready for CI pipelines with verbose output + coverage
- Pattern established for future hook tests: vi.mock supabaseClient with __mockX pattern
- MSW handlers available for non-hook integration tests in Phase 03 Plan 02

---
*Phase: 03-test-infrastructure-quality*
*Completed: 2026-03-19*

## Self-Check: PASSED

- All 10 created files exist on disk
- Commits ff827f7 and 16ccf2c confirmed in git log
- npx vitest run: 5 test files, 31 tests, 0 failures, exit code 0
