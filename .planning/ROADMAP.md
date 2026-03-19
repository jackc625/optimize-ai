# Roadmap: Optimize AI

## Overview

This is a codebase audit and hardening milestone for an existing production health-tracking dashboard. The work is not building new features — it is closing five categories of risk in the current codebase: unsafe production dependencies, missing auth guards, incomplete RLS policies, inconsistent type safety at Supabase boundaries, and zero test coverage. Phases are ordered by dependency: the infrastructure must be safe before type patterns can be standardized, and hooks must be consistent before tests can be written against them.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Safety** - Establish a production-safe baseline with no silent crashes, no auth race conditions, no malformed URLs, and audited RLS policies
- [ ] **Phase 2: Type Safety** - Eliminate unsafe `as` casts at every Supabase boundary, standardize all hooks on React Query, and enforce correct useEffect dependencies via ESLint (completed 2026-03-19; UAT gap closure in progress)
- [ ] **Phase 3: Test Infrastructure + Quality** - Install Vitest with baseline tests for critical paths, add structured logging, replace inaccessible confirm dialogs, and fix timezone-unsafe date handling

## Phase Details

### Phase 1: Critical Safety
**Goal**: The application runs safely in production — no missing runtime dependencies, no silent env var failures, no unauthenticated data exposure, no auth race conditions, and no broken routing
**Depends on**: Nothing (first phase)
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, BUG-02, BUG-03
**Success Criteria** (what must be TRUE):
  1. A production build includes `@supabase/supabase-js` in `dependencies`, so the deployed app never crashes due to a missing module
  2. Starting the app without `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` throws a clear error immediately rather than failing silently at the first database call
  3. Every table in the database (including child tables `workout_exercises`, `habit_logs`, `workout_log_exercises`) has RLS policies verified to enforce `auth.uid() = user_id` on SELECT, INSERT, UPDATE, and DELETE — no user can read or modify another user's data
  4. Navigating to any `/dashboard/*` route while unauthenticated redirects to the login page without ever rendering protected page content
  5. Navigating to the workout log route produces a correctly formed URL (`/dashboard/workouts/{id}/log`) with no double-slash, and the `QueryClient` is instantiated inside `useState` so SSR requests do not share cache state
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Move @supabase/supabase-js to dependencies, add module-load env var validation, fix SSR QueryClient cache leak
- [x] 01-02-PLAN.md — Write and apply RLS SQL migration for all 9 Supabase tables
- [x] 01-03-PLAN.md — Implement middleware auth guard, wire cookie signal, fix login redirect flow, fix workout URL double-slash

### Phase 2: Type Safety
**Goal**: Every Supabase response is validated by Zod at the hook boundary, all hooks use React Query, TypeScript types derive from Zod inferences rather than `as` casts, and ESLint enforces correct useEffect dependencies going forward
**Depends on**: Phase 1
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04, BUG-01
**Success Criteria** (what must be TRUE):
  1. No hook in the codebase contains an `as TypeName` cast applied to raw Supabase `data` — all Supabase responses pass through Zod `.safeParse()` before being used
  2. `useHabits` and `useMacros` use `useQuery`/`useMutation` from React Query, consistent with all other hooks, and their derived state is accessible via standard query status fields
  3. The ESLint `react-hooks/exhaustive-deps` rule is enabled and passes with zero violations — all `useEffect` dependency arrays are complete and correct
  4. `ProfileForm` enum values (activity level, goal, gender) are validated against Zod schemas before being written to the database, so invalid form submissions cannot persist malformed enum strings
  5. Habit streak data displayed for a user in a non-UTC timezone reflects the correct local date, not a UTC-shifted date
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Create Zod schemas and date utility foundation; convert all workout hooks to safeParse; fix ProfileForm enum casts, MacroSummary fmt cast, macros history and profile edit page casts
- [x] 02-02-PLAN.md — Migrate useHabits and useMacros to React Query; fix all BUG-01 date patterns; enable ESLint exhaustive-deps rule
- [ ] 02-03-PLAN.md — (GAP CLOSURE) Fix macro recalculate button: add toast feedback, error handling, and minimum loading duration

### Phase 3: Test Infrastructure + Quality
**Goal**: The codebase has a working test suite covering critical utilities and hooks, structured error logging replaces raw `console.error()` calls, accessible UI replaces browser-native dialogs, and timezone-safe date utilities replace all fragile `.toISOString().split('T')[0]` patterns
**Depends on**: Phase 2
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04
**Success Criteria** (what must be TRUE):
  1. Running `vitest run` from the project root completes successfully, with unit tests covering all BMR/TDEE/macro-split calculation paths in `calculateMacros` and integration tests covering the `useWorkouts` hook using React Query test utilities
  2. Every error caught in a hook or page is logged via a `logError(context, err)` utility that includes the operation name and full error object — no bare `console.error(err)` calls remain
  3. Deleting a workout requires confirming via a keyboard-accessible modal dialog (not `window.confirm()`), so the action is completable without a mouse and is announced correctly to screen readers
  4. All "Loading..." text placeholders on the workouts list, weight log, and habits pages are replaced with skeleton components that match the final layout shape, so the page does not experience a layout shift when data loads
**Plans**: TBD

Plans:
- [ ] 03-01: Configure Vitest 4 + RTL + msw; write `calculateMacros` unit tests and `useWorkouts` integration tests
- [ ] 03-02: Add `logError()` utility and replace all `console.error()` calls; replace `window.confirm()` with accessible `ConfirmDialog`; add loading skeleton components

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Safety | 3/3 | Complete | 2026-02-27 |
| 2. Type Safety | 2/3 | Gap closure   | - |
| 3. Test Infrastructure + Quality | 0/2 | Not started | - |
