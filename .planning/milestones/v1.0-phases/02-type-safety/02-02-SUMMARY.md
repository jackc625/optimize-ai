---
phase: 02-type-safety
plan: 02
subsystem: hooks
tags: [react-query, type-safety, bug-fix, eslint, timezone, macros, habits]
dependency_graph:
  requires:
    - 02-01 (localDate.ts utility, UserProfileSchema, profileSchema.ts)
  provides:
    - useHabits React Query hooks (useHabits, useAddHabit, useCompleteHabit, useDeleteHabit)
    - useMacros React Query hook with Zod validation and correct activityLevel mapping
    - ESLint exhaustive-deps enforcement as error
  affects:
    - src/app/dashboard/habits/page.tsx (consumes new hook API)
    - src/components/macros/MacroSummary.tsx (consumes new hook API)
    - All hooks with toISOString patterns (BUG-01 fixed)
tech_stack:
  added: []
  patterns:
    - React Query useQuery/useMutation replacing useState/useEffect data fetching
    - Separate mutation hooks pattern (useAddHabit, useCompleteHabit, useDeleteHabit)
    - todayCompleted as string[] (not Set<string>) for React Query serialization safety
    - activityLevel string-to-numeric multiplier mapping for calculateMacros
    - fmt() at module scope to avoid exhaustive-deps violation
key_files:
  created: []
  modified:
    - src/hooks/habits/useHabits.ts
    - src/hooks/macros/useMacros.ts
    - src/app/dashboard/habits/page.tsx
    - src/components/macros/MacroSummary.tsx
    - src/hooks/weight/useWeightLogs.ts
    - src/app/dashboard/workouts/[id]/log/page.tsx
    - eslint.config.mjs
decisions:
  - "todayCompleted returned as string[] from useHabits, reconstructed to Set in consumer — React Query cannot cache Set objects"
  - "ACTIVITY_MULTIPLIERS map (sedentary=1.2, moderate=1.55, active=1.9) fixes pre-existing NaN bug where string was passed to numeric activityLevel in calculateMacros"
  - "fmt() moved to module scope in MacroSummary.tsx — stable reference, no exhaustive-deps violation"
  - "No eslint-disable comments needed — React Query migrations eliminated all violations"
metrics:
  duration: "~7 min"
  completed_date: "2026-03-19"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 7
requirements-completed:
  - TYPE-02
  - TYPE-04
  - BUG-01
---

# Phase 02 Plan 02: Hook Migration to React Query and ESLint Enforcement Summary

**One-liner:** React Query migration for useHabits and useMacros, BUG-01 timezone fixes across 4 files, and ESLint exhaustive-deps enabled as error with zero violations.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Migrate useHabits to React Query and fix BUG-01 date patterns | d943e72 | useHabits.ts, habits/page.tsx, useWeightLogs.ts, workouts/[id]/log/page.tsx |
| 2 | Migrate useMacros to React Query and update MacroSummary consumption | c7fd6c9 | useMacros.ts, MacroSummary.tsx |
| 3 | Enable ESLint exhaustive-deps rule and fix remaining violations | 66395a7 | eslint.config.mjs |

## What Was Built

### Task 1: useHabits Migration + BUG-01 Fixes

Rewrote `useHabits.ts` from manual useState/useEffect data fetching to four separate React Query hooks:

- `useHabits()` — `useQuery<HabitsQueryData, Error>` composite query (habits + logs + today's completions)
- `useAddHabit()` — `useMutation<void, Error, string>` with toast and cache invalidation
- `useCompleteHabit()` — `useMutation<void, Error, string>` with today's local date
- `useDeleteHabit()` — `useMutation<void, Error, string>` with cache invalidation

BUG-01 fixes applied:
- `calculateStreak()` now uses `formatLocalDate(current)` instead of `current.toISOString().split("T")[0]`
- `getLocalDate()` replaces `new Date().toISOString().split("T")[0]` in useWeightLogs.ts (line 62)
- `getLocalDate()` replaces `new Date().toISOString().slice(0, 10)` in workouts/[id]/log/page.tsx (line 80)

`todayCompleted` is returned as `string[]` (not `Set<string>`) from the query; the habits page reconstructs a `Set` locally for the `.has()` check.

### Task 2: useMacros Migration + activityLevel Bug Fix

Rewrote `useMacros.ts` as `useQuery<MacroOutput, Error>` with:
- `UserProfileSchema.safeParse` validation (throws on failure with descriptive Zod error)
- `ACTIVITY_MULTIPLIERS` map converting string enum (`sedentary/moderate/active`) to numeric TDEE multiplier — this fixes a pre-existing NaN bug where the string was passed directly to `calculateMacros()` which expected `number`
- `staleTime: 1000 * 60 * 5` matching the workouts pattern

`MacroSummary.tsx` updated:
- Destructures `{ data: macros, isLoading: macrosLoading, refetch }` from `useMacros()`
- `handleRecalculate` calls `await refetch()` instead of `await refresh()`
- `fmt()` moved to module scope to prevent exhaustive-deps lint error (it was inside the component referencing itself in a useEffect dependency)

### Task 3: ESLint exhaustive-deps Enforcement

Added `"react-hooks/exhaustive-deps": "error"` to `eslint.config.mjs`. The React Query migrations in Tasks 1-2 preemptively eliminated all violations by removing `useEffect(() => fetchData(), [])` patterns from both migrated hooks. `npm run lint` passes with zero errors on the first run — no additional fixes were needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing NaN bug in activityLevel calculation**
- **Found during:** Task 2
- **Issue:** Old `useMacros.ts` passed `profileData.activity_level || "moderate"` (string) as `activityLevel` to `calculateMacros()`, but `ProfileInput.activityLevel` is typed as `number`. This caused `bmr * "moderate"` = `NaN` for all macro calculations.
- **Fix:** Added `ACTIVITY_MULTIPLIERS` constant mapping string enum values to Mifflin-St Jeor TDEE multipliers (sedentary=1.2, moderate=1.55, active=1.9). The plan explicitly called this out as the required fix.
- **Files modified:** `src/hooks/macros/useMacros.ts`
- **Commit:** c7fd6c9

None - all other changes executed exactly as written.

## Verification Results

All success criteria passed:

1. `npx tsc --noEmit` — exit 0 (zero errors)
2. `npm run lint` — "No ESLint warnings or errors"
3. `npm run build` — successful, all routes built
4. `useHabits` — pure React Query, no useState/useEffect
5. `useMacros` — pure React Query, no useState/useEffect
6. Separate mutation hooks: `useAddHabit()`, `useCompleteHabit()`, `useDeleteHabit()`
7. Habits page uses `data?.habits`, `new Set(data?.todayCompleted)`, and mutation hooks
8. MacroSummary uses `refetch` (not `refresh`), destructures React Query shape
9. No `.toISOString().split('T')[0]` or `.toISOString().slice(0,10)` anywhere in `src/` (only in a comment in `localDate.ts`)
10. `activityLevel` correctly mapped from string enum to numeric multiplier
11. All toast messages preserved verbatim per UI-SPEC

## Self-Check: PASSED
