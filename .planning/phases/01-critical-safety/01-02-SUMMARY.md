---
phase: 01-critical-safety
plan: 02
subsystem: database
tags: [supabase, rls, row-level-security, postgres, sql, migration]

# Dependency graph
requires: []
provides:
  - "RLS enabled on all 9 Supabase tables (user_profiles, habits, habit_logs, weight_logs, user_macros, workouts, workout_exercises, workout_logs, workout_log_exercises)"
  - "4 access policies per table: SELECT, INSERT, UPDATE, DELETE"
  - "Child table ownership enforced via EXISTS subquery joins to parent tables"
  - "Idempotent migration — safe to re-run (DROP POLICY IF EXISTS before each CREATE)"
affects:
  - "All phases — RLS is the database-level data isolation boundary"
  - "02-code-quality — type generation relies on RLS-secured tables"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS pattern: (SELECT auth.uid()) = user_id subquery form (evaluates once per query, not per row)"
    - "Child table RLS: EXISTS subquery to parent table for tables without direct user_id column"
    - "Idempotent migration: DROP POLICY IF EXISTS before every CREATE POLICY"

key-files:
  created:
    - "supabase/migrations/20260226_rls_all_tables.sql"
  modified: []

key-decisions:
  - "EXISTS subquery for child tables (workout_exercises, workout_log_exercises) — these tables lack a direct user_id column; ownership is proved by joining to parent table"
  - "Subquery form (SELECT auth.uid()) preferred over bare auth.uid() — evaluates once per query, Supabase-recommended pattern"
  - "Migration applied via Supabase SQL editor (not supabase CLI db push) — project uses managed Supabase, not local CLI"

patterns-established:
  - "RLS-first: database enforces data isolation as the authoritative boundary; middleware/app checks are defense-in-depth"
  - "Child table ownership: use EXISTS join to parent rather than adding redundant user_id columns"

requirements-completed: [SAFE-03]

# Metrics
duration: ~20min
completed: 2026-02-26
---

# Phase 1 Plan 02: RLS All Tables Summary

**Idempotent SQL migration enabling Row Level Security on all 9 Supabase tables with 4 CRUD policies each, using EXISTS subqueries for child tables lacking direct user_id columns**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-02-26
- **Completed:** 2026-02-26
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- All 9 Supabase tables now have RLS enabled — no user can read or write another user's rows at the database level
- Child tables (`workout_exercises`, `workout_log_exercises`) secured via EXISTS subquery joins to parent tables (`workouts`, `workout_logs`) since they lack direct `user_id` columns
- `habit_logs` secured directly via its own `user_id` column
- Migration is idempotent (DROP POLICY IF EXISTS before each CREATE POLICY) — safe to re-run without errors
- Migration applied to production Supabase database and verified by user; own data loads correctly after RLS activation

## Task Commits

Each task was committed atomically:

1. **Task 1: Write RLS migration SQL for all 9 tables** - `4d729dd` (feat)
2. **Task 2: Apply and verify RLS migration in Supabase** - human-verify checkpoint (approved by user — no code commit)

**Note:** An additional fix commit `7545538` corrected the child table policies (workout_exercises, workout_log_exercises) after the initial migration revealed those tables lack a direct `user_id` column — the fix switched to EXISTS subquery pattern. See Deviations section.

## Files Created/Modified

- `supabase/migrations/20260226_rls_all_tables.sql` - Idempotent SQL migration: ENABLE ROW LEVEL SECURITY + 4 policies (SELECT/INSERT/UPDATE/DELETE) for all 9 tables; child tables use EXISTS subquery ownership check

## Decisions Made

- **EXISTS subquery for child tables:** `workout_exercises` and `workout_log_exercises` have no direct `user_id` column. Rather than adding redundant columns, RLS is enforced by checking ownership of the parent row (`workouts` and `workout_logs` respectively).
- **Subquery form `(SELECT auth.uid())`:** Used throughout instead of bare `auth.uid()`. Evaluates once per query rather than per row — Supabase-recommended for performance.
- **SQL editor deployment:** Migration applied via Supabase Dashboard SQL Editor rather than `supabase db push` (project uses managed Supabase without CLI configured).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Child table RLS policies corrected to use EXISTS subquery**
- **Found during:** Task 2 (applying migration to database)
- **Issue:** Initial migration used `(SELECT auth.uid()) = user_id` for `workout_exercises` and `workout_log_exercises`, but these tables do not have a `user_id` column — ownership is via parent table FK
- **Fix:** Rewrote child table policies to use EXISTS subqueries joining to parent tables (`workouts` and `workout_logs`)
- **Files modified:** `supabase/migrations/20260226_rls_all_tables.sql`
- **Verification:** Migration applied successfully to Supabase; user confirmed all 9 tables show RLS enabled and own data loads correctly
- **Committed in:** `7545538` (fix(01-02/01-03))

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in child table policy pattern)
**Impact on plan:** Required fix — initial pattern was incorrect for tables without direct user_id. EXISTS subquery is the correct approach. No scope creep.

## Issues Encountered

- Child table schema discovery: `workout_exercises` and `workout_log_exercises` do not have a `user_id` column — the plan's context listed `user_id FK` for all tables but this was inaccurate for child tables. The EXISTS subquery fix was applied before the database application was complete.

## User Setup Required

None - migration was applied directly to Supabase database via SQL editor during the human-verify checkpoint. No additional configuration required.

## Next Phase Readiness

- RLS is live on all 9 tables — data isolation is enforced at the database level
- All subsequent phases can rely on RLS as the authoritative security boundary
- Phase 2 (code quality / type generation) can proceed with confidence that the database schema is security-hardened
- No blockers introduced by this plan

---
*Phase: 01-critical-safety*
*Completed: 2026-02-26*
