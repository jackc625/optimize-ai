# Phase 3: Test Infrastructure + Quality - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Vitest with baseline tests for critical paths, add structured error logging to replace raw `console.error()` calls, replace `window.confirm()` with an accessible dialog component, and add loading skeleton components to eliminate layout shift. This phase is quality infrastructure and UX polish — no new features, no architecture changes.

</domain>

<decisions>
## Implementation Decisions

### Test scope & infrastructure
- **Framework:** Vitest 4 with React Testing Library for hook/component tests
- **Mocking:** MSW (Mock Service Worker) for Supabase API calls — intercepts at the fetch level, exercises real Supabase client code path
- **MSW handlers:** Centralized handlers in `src/__tests__/mocks/handlers.ts` for common Supabase responses, with per-test overrides for specific scenarios
- **Test file location:** Separate `src/__tests__/` directory mirroring the source tree (NOT co-located)
- **React Query test wrapper:** Custom `renderWithProviders` helper that wraps in QueryClientProvider with test-configured QueryClient — reusable across all hook tests
- **Test scope beyond requirements:**
  - Required: `calculateMacros` unit tests (BMR, TDEE, macro split) + `useWorkouts` integration tests
  - Additional: Date utility tests (`localDate.ts`), Zod schema validation tests, and any other testable utilities
- **Coverage:** No enforced threshold — get tests running first, add reporting without blocking
- **CI scripts:** Add `test:ci` script with `--reporter=verbose` and coverage output, plus `test` and `test:watch` for local dev

### Confirm dialog
- **Library:** `@radix-ui/react-alert-dialog` — headless, accessible (ARIA alert dialog role), keyboard navigable, focus-trapped
- **Component:** Generic reusable `ConfirmDialog` accepting `title`, `description`, `confirmLabel`, `onConfirm`, `variant` ('destructive' | 'default')
- **Visual style:** Red confirm button + neutral gray cancel button for destructive variant. Title states the action ("Delete Workout"), body explains the consequence
- **Overlay:** Semi-transparent dark backdrop that dims the page behind the dialog
- **Current usage:** Replace `window.confirm()` in `src/app/dashboard/workouts/page.tsx`

### Loading skeletons
- **Animation:** Pulse (opacity fade) using Tailwind's built-in `animate-pulse` — no custom CSS
- **Primitives:** Shared `<Skeleton />` component in `src/components/ui/Skeleton.tsx` — renders a rounded gray animated div, accepts `className` for sizing
- **Fidelity:** High fidelity — skeletons mirror exact card shapes, row heights, and column layouts of the loaded state. No layout shift when data arrives
- **Item count:** 3 skeleton items in list pages (workouts, habits, weight)
- **Target pages:** Workouts list, weight log, and habits pages — replace all "Loading..." text placeholders

### Error logging
- **Utility:** `logError(context: string, err: unknown)` in `src/utils/logger.ts`
- **Context captured:** Operation name, full error object, ISO timestamp, and Supabase error codes when available
- **Output:** Console-only (`console.error`) — no external service integration. Easy to swap later
- **Log levels:** Just `logError()` — single function, no logWarn/logInfo
- **Scope:** Replace ALL raw `console.error()` calls in hooks and pages (11 files identified)

### Claude's Discretion
- Exact MSW handler implementations and test data fixtures
- Vitest config details (globals, environment, setup files)
- Skeleton component sizing/spacing to match each page's loaded layout
- ConfirmDialog animation/transition details
- logError() internal formatting and Supabase error code extraction logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` — QUAL-01, QUAL-02, QUAL-03, QUAL-04 define exact acceptance criteria
- `.planning/ROADMAP.md` §Phase 3 — Success criteria 1-4 define what must be TRUE

### Codebase analysis
- `.planning/codebase/TESTING.md` — Full test strategy analysis, recommended patterns, testable code identification
- `.planning/codebase/CONCERNS.md` §Testing Coverage, §Error Handling & Logging, §Missing Critical Features — Issue descriptions and fix approaches
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, import organization, module design to follow

### Files to modify/test
- `src/utils/macros/calculateMacros.ts` — Primary unit test target (BMR, TDEE, macro split)
- `src/utils/macros/calculateBMR.ts` — Pure function, unit test target
- `src/utils/macros/calculateTDEE.ts` — Pure function, unit test target
- `src/utils/macros/getMacroSplit.ts` — Pure function, unit test target
- `src/hooks/workouts/useWorkouts.ts` — Integration test target (React Query + MSW)
- `src/utils/dates/localDate.ts` — Date utility test target
- `src/schemas/workoutSchema.ts` — Zod schema test target
- `src/schemas/profileSchema.ts` — Zod schema test target
- `src/app/dashboard/workouts/page.tsx` — window.confirm() replacement target
- 11 files with `console.error` — logError() replacement targets

### Prior phase context
- `.planning/phases/01-critical-safety/01-CONTEXT.md` — "Phase 3 handles structured logging" decision
- `.planning/phases/02-type-safety/02-CONTEXT.md` — Zod safeParse patterns, React Query hooks, date-fns utility decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button.tsx`, `Card.tsx`: Existing UI components — ConfirmDialog and Skeleton should match their styling conventions
- `react-hot-toast`: Established toast pattern for user-facing notifications
- Tailwind `animate-pulse`: Built-in animation class for skeleton loading
- Macro utils (`calculateBMR`, `calculateTDEE`, `getMacroSplit`, `calculateMacros`): Pure functions with no side effects — ideal unit test targets
- `workoutSchema.ts`, `profileSchema.ts`: Existing Zod schemas for validation testing
- `localDate.ts`: Date utility added in Phase 2 for timezone-safe date handling

### Established Patterns
- React Query hooks: `useQuery`/`useMutation` with `queryKey` arrays — hook tests need QueryClientProvider wrapper
- Supabase data flow: `supabase.from().select()` → check error → safeParse → return typed data
- All imports use `@/` path alias
- Error handling: try/catch with `console.error()` + `toast.error()` — logError replaces the console.error part

### Integration Points
- `package.json`: Needs vitest, @testing-library/react, msw, @radix-ui/react-alert-dialog dependencies
- `vitest.config.ts`: New file for test configuration
- `src/components/ui/Skeleton.tsx`: New shared component
- `src/components/ui/ConfirmDialog.tsx`: New shared component
- `src/utils/logger.ts`: New utility
- `src/__tests__/`: New test directory structure

</code_context>

<specifics>
## Specific Ideas

- User wants broad test coverage: not just the required calculateMacros + useWorkouts, but also date utilities, Zod schemas, and any other testable utilities
- Test files in separate `src/__tests__/` directory, NOT co-located with source files
- ConfirmDialog should be generic/reusable, not workout-specific — support future confirm actions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-test-infrastructure-quality*
*Context gathered: 2026-03-19*
