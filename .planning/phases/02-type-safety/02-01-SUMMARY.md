---
phase: 02-type-safety
plan: 01
subsystem: api
tags: [zod, typescript, date-fns, validation, supabase]

# Dependency graph
requires:
  - phase: 01-critical-safety
    provides: working Supabase RLS, auth routing, env validation foundation

provides:
  - MacroRecordSchema, MacroRecordArraySchema, MacroRecord type (src/schemas/macroSchema.ts)
  - UserProfileSchema and UserProfile type added to src/schemas/profileSchema.ts
  - getLocalDate() and formatLocalDate() date utilities using date-fns (src/utils/dates/localDate.ts)
  - safeParse at all Supabase data boundaries in useWorkouts, useWorkoutLogs, macros/history, profile/edit
  - ProfileForm enum fields validated via ProfileSchema.parse() return value — no as-casts
  - MacroSummary fmt() early-return narrowing — no as number cast

affects: [02-02-PLAN.md, useMacros migration, any future Supabase hooks]

# Tech tracking
tech-stack:
  added: [date-fns@4.1.0]
  patterns:
    - "Zod safeParse at every Supabase data boundary — throw structured error in queryFn, toast+log in useEffect"
    - "Intermediate as WorkoutRow[] / as LogRow[] shaping casts acceptable before safeParse validation"
    - "UserProfile type sourced from Zod inference (profileSchema.ts), not manual interface in database.ts"

key-files:
  created:
    - src/schemas/macroSchema.ts
    - src/utils/dates/localDate.ts
  modified:
    - src/schemas/profileSchema.ts
    - src/hooks/workouts/useWorkouts.ts
    - src/hooks/workouts/useWorkoutLogs.ts
    - src/components/profile/ProfileForm.tsx
    - src/components/macros/MacroSummary.tsx
    - src/app/dashboard/macros/history/page.tsx
    - src/app/dashboard/profile/edit/page.tsx

key-decisions:
  - "safeParse failure in queryFn throws (React Query catches and surfaces as error state); failure in useEffect logs + toasts (no unhandled rejection)"
  - "as WorkoutRow[] and as LogRow[] intermediate shaping casts retained — they shape raw Supabase any before Zod validates the structure"
  - "UserProfile type switched from manual interface in database.ts to z.infer<typeof UserProfileSchema> — single source of truth"
  - "ProfileForm payload uses validated (parse() return value) instead of parsedInput — enum types narrowed by Zod, no as-casts needed"
  - "date-fns format uses lowercase yyyy-MM-dd (NOT YYYY which is ISO week year)"

patterns-established:
  - "Zod safeParse pattern: const result = Schema.safeParse(data); if (!result.success) { throw new Error(`Zod validation failed in [hook]: ${JSON.stringify(result.error.issues)}`); } return result.data;"
  - "useEffect safeParse pattern: log error + toast + set empty/null state on failure instead of throwing"

requirements-completed: [TYPE-01, TYPE-03]

# Metrics
duration: 7min
completed: 2026-03-18
---

# Phase 2 Plan 01: Type Safety Foundation Summary

**Zod safeParse at all Supabase data boundaries: MacroRecordSchema, UserProfileSchema, date-fns localDate utility, and enum cast elimination across workout hooks, macros/history page, profile/edit page, ProfileForm, and MacroSummary**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T01:34:56Z
- **Completed:** 2026-03-19T01:41:56Z
- **Tasks:** 3
- **Files modified:** 9 (3 created, 6 modified + package.json/package-lock.json)

## Accomplishments
- Created MacroRecordSchema / MacroRecordArraySchema / MacroRecord type in new macroSchema.ts — field names match actual user_macros table columns (bmr, maintenance_calories, target_calories), not the mismatched database.ts UserMacro interface
- Appended UserProfileSchema and UserProfile (z.infer) to profileSchema.ts — ProfileForm and profile/edit page now import UserProfile from schemas, not types/database.ts
- Installed date-fns and created localDate.ts with getLocalDate() and formatLocalDate() for timezone-correct date formatting
- Converted all 4 .parse() calls in useWorkouts.ts and 2 in useWorkoutLogs.ts to safeParse() with structured error messages
- Removed all unsafe as ExerciseTemplate[], as WorkoutLogExercise[], as MacroRecord[], as UserProfile casts
- Eliminated ProfileForm enum casts (as "male"|"female", as "fat_loss"|..., as "sedentary"|...) — parse() return value provides narrowed types
- Fixed MacroSummary fmt() to use early-return narrowing instead of n as number

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zod schemas and date utility foundation** - `5596361` (feat)
2. **Task 2: Convert workout hooks to safeParse, fix ProfileForm and MacroSummary** - `ca54c48` (feat)
3. **Task 3: Apply safeParse to macros history and profile edit pages** - `ece433f` (feat)

## Files Created/Modified
- `src/schemas/macroSchema.ts` - MacroRecordSchema, MacroRecordArraySchema, MacroRecord type
- `src/utils/dates/localDate.ts` - getLocalDate() and formatLocalDate() using date-fns
- `src/schemas/profileSchema.ts` - Added UserProfileSchema and UserProfile type (existing ProfileSchema unchanged)
- `src/hooks/workouts/useWorkouts.ts` - All .parse() calls converted to safeParse() with error messages; ExerciseTemplate import removed
- `src/hooks/workouts/useWorkoutLogs.ts` - All .parse() calls converted to safeParse() with error messages; WorkoutLogExercise import removed
- `src/components/profile/ProfileForm.tsx` - Enum as-casts removed; uses validated (parse return value) for payload; UserProfile from schemas
- `src/components/macros/MacroSummary.tsx` - fmt() uses early-return narrowing instead of n as number
- `src/app/dashboard/macros/history/page.tsx` - Local MacroRecord type removed; imports from macroSchema; safeParse with toast/log on failure
- `src/app/dashboard/profile/edit/page.tsx` - as UserProfile cast removed; UserProfileSchema.safeParse; UserProfile from schemas

## Decisions Made
- safeParse failure in queryFn throws (React Query catches); failure in useEffect logs + toasts (no unhandled rejection)
- Intermediate as WorkoutRow[] and as LogRow[] shaping casts retained — acceptable per plan spec, data flows immediately into safeParse validation
- UserProfile type switched to z.infer<typeof UserProfileSchema> — single source of truth, eliminates drift between interface and schema
- ProfileForm payload built from validated (ProfileSchema.parse() return value) — enum types correctly narrowed, no as-casts needed
- date-fns format uses lowercase yyyy-MM-dd (NOT YYYY which is ISO week year in date-fns)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- Schema foundation complete for Plan 02 (useMacros migration)
- MacroRecordArraySchema ready to be used in useMacros hook
- UserProfileSchema ready for any future profile-fetching hooks
- localDate.ts available for timezone-correct date handling throughout the app
- One remaining concern: database.ts UserMacro interface still has wrong field names (calories instead of bmr/maintenance_calories/target_calories) — future cleanup candidate but out of scope for this plan

---
*Phase: 02-type-safety*
*Completed: 2026-03-18*
