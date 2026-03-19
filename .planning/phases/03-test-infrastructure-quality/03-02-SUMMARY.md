---
phase: 03-test-infrastructure-quality
plan: "02"
subsystem: ui-quality
tags:
  - error-logging
  - accessibility
  - skeleton-loading
  - ux
dependency_graph:
  requires:
    - "03-01"
  provides:
    - logError utility (src/utils/logger.ts)
    - ConfirmDialog component (src/components/ui/ConfirmDialog.tsx)
    - Skeleton component (src/components/ui/Skeleton.tsx)
  affects:
    - src/app/dashboard/layout.tsx
    - src/app/dashboard/page.tsx
    - src/app/dashboard/macros/history/page.tsx
    - src/app/dashboard/profile/edit/page.tsx
    - src/app/dashboard/profile/setup/page.tsx
    - src/app/dashboard/workouts/new/page.tsx
    - src/app/dashboard/workouts/page.tsx
    - src/app/dashboard/weight/page.tsx
    - src/app/dashboard/habits/page.tsx
    - src/components/macros/MacroSummary.tsx
    - src/components/profile/ProfileForm.tsx
    - src/hooks/habits/useHabits.ts
    - src/hooks/weight/useWeightLogs.ts
tech_stack:
  added:
    - "@radix-ui/react-alert-dialog (already installed) for accessible modal dialogs"
  patterns:
    - "Structured error logging with context + timestamp + Supabase error code"
    - "Radix AlertDialog for accessible confirm dialogs (ARIA, focus trap, keyboard nav)"
    - "Shared Skeleton primitive with animate-pulse + aria-hidden"
key_files:
  created:
    - src/utils/logger.ts
    - src/components/ui/ConfirmDialog.tsx
    - src/components/ui/Skeleton.tsx
  modified:
    - src/app/dashboard/layout.tsx
    - src/app/dashboard/page.tsx
    - src/app/dashboard/macros/history/page.tsx
    - src/app/dashboard/profile/edit/page.tsx
    - src/app/dashboard/profile/setup/page.tsx
    - src/app/dashboard/workouts/new/page.tsx
    - src/app/dashboard/workouts/page.tsx
    - src/app/dashboard/weight/page.tsx
    - src/app/dashboard/habits/page.tsx
    - src/components/macros/MacroSummary.tsx
    - src/components/profile/ProfileForm.tsx
    - src/hooks/habits/useHabits.ts
    - src/hooks/weight/useWeightLogs.ts
decisions:
  - "logError collapses if/else error type checks — accepts unknown and handles Supabase error code detection internally"
  - "workouts/new/page.tsx two console.error calls collapsed into single logError since it handles unknown type"
  - "ConfirmDialog Cancel rendered before Action to ensure Tab order is Cancel -> Confirm per UI-SPEC"
  - "Destructive button uses className override (bg-destructive) since Button variant='destructive' does not exist"
  - "Habits page loading: removed animate-pulse from li wrapper since each Skeleton child applies its own animation"
requirements_satisfied:
  - QUAL-02
  - QUAL-03
  - QUAL-04
metrics:
  duration: "11 min"
  completed: "2026-03-19"
  tasks_completed: 3
  files_changed: 16
---

# Phase 03 Plan 02: Error Logging, Accessible Dialogs, and Skeleton Loading Summary

**One-liner:** Structured logError utility replacing 20 console.error calls, Radix AlertDialog ConfirmDialog replacing window.confirm, and shared Skeleton primitive across 3 loading states.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create logError utility and replace all console.error calls | a97bad6 | src/utils/logger.ts + 11 files modified |
| 2 | Create ConfirmDialog and replace window.confirm in workouts page | 3a90bc7 | src/components/ui/ConfirmDialog.tsx + workouts/page.tsx |
| 3 | Create Skeleton component and replace loading states in 3 pages | 23d9c06 | src/components/ui/Skeleton.tsx + 3 page files |

## What Was Built

### Task 1: logError Utility (QUAL-02)

`src/utils/logger.ts` exports `logError(context: string, err: unknown): void`. Logs a structured object containing: operation context string, ISO timestamp, optional Supabase error code (detected via `isSupabaseError` type guard), and the original error. Replaced 20 bare `console.error()` calls across 11 files. All `toast.error()` user-facing notifications preserved.

Context names used:
- `checkProfile`, `loadProfileName`, `fetchMacroHistory`, `parseMacroHistory`, `loadProfile`
- `createWorkout`, `deleteWorkout`, `saveMacros`, `saveProfile`
- `addHabit`, `completeHabit`, `deleteHabit`
- `fetchWeightLogs`, `fetchGoalWeight`, `checkExistingLog`, `addWeightLog`, `deleteWeightLog`, `updateWeightLog`

### Task 2: ConfirmDialog Component (QUAL-03)

`src/components/ui/ConfirmDialog.tsx` wraps `@radix-ui/react-alert-dialog` (already in package.json). Provides full ARIA support, focus trapping, keyboard navigation (Tab cycles Cancel/Confirm, Escape dismisses). Semi-transparent overlay (`bg-black/50 z-40`), centered modal (`max-w-md`), destructive variant via className override.

`workouts/page.tsx` updated: `pendingDeleteId` state controls dialog visibility. `handleDelete` sets `pendingDeleteId`, `confirmDelete` executes the mutation. Dialog shows "Delete Workout" title, explains permanent deletion consequences, offers "Keep Workout" (cancel) and red "Delete Workout" (confirm).

### Task 3: Skeleton Loading States (QUAL-04)

`src/components/ui/Skeleton.tsx` — minimal `animate-pulse rounded bg-muted` primitive with `aria-hidden="true"` and `cn()` for className merging.

Three pages updated:
- **Workouts:** 3 skeleton cards in 2-column grid matching loaded layout (header/body/3 footer buttons)
- **Weight:** 3 skeleton rows with `flex justify-between` matching log list layout (date left, weight right)
- **Habits:** inline animate-pulse refactored to shared Skeleton (same structure: h-4 w-32, h-4 w-12, h-5 w-5 rounded-full)

All skeleton containers use `aria-label` for accessibility.

## Verification Results

- `grep -rn "console.error" src/app/dashboard src/components src/hooks` — 0 matches
- `grep -rn "window.confirm" src/` — 0 matches
- `grep '"Loading' src/app/dashboard/workouts/page.tsx src/app/dashboard/weight/page.tsx` — 0 matches
- `npx vitest run` — 31 tests pass across 5 test files

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
