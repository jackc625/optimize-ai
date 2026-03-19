---
phase: 01-critical-safety
plan: 01
subsystem: infra
tags: [supabase, react-query, ssr, env-vars, typescript, next]

# Dependency graph
requires: []
provides:
  - "@supabase/supabase-js in runtime dependencies (not devDependencies)"
  - "Module-load env var validation with explicit throw on missing SUPABASE vars"
  - "SSR-safe QueryClient using useState lazy initializer (no shared cache)"
affects: [02-critical-safety, 03-critical-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Env var validation: explicit throw guards before use, no ! assertions"
    - "SSR-safe QueryClient: useState(() => new QueryClient()) per-request isolation"

key-files:
  created: []
  modified:
    - package.json
    - src/lib/supabaseClient.ts
    - src/app/providers.tsx

key-decisions:
  - "Presence-only validation for env vars — no URL format check (per CONTEXT.md guidance)"
  - "ReactNode replaced inline with React.ReactNode to remove unused import in providers.tsx"

patterns-established:
  - "Throw pattern: if (!envVar) { throw new Error('Missing required env var: VAR_NAME'); }"
  - "SSR QueryClient: const [queryClient] = useState(() => new QueryClient());"

requirements-completed: [SAFE-01, SAFE-02, BUG-03]

# Metrics
duration: 8min
completed: 2026-02-27
---

# Phase 1 Plan 1: Critical Safety Fixes Summary

**Runtime dependency fix, module-load env var validation with explicit throws, and SSR-safe QueryClient isolation via useState lazy initializer**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-27T00:29:31Z
- **Completed:** 2026-02-27T00:37:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Moved `@supabase/supabase-js` from `devDependencies` to `dependencies` so `npm ci --omit=dev` in production includes it
- Replaced `!` non-null assertions in `supabaseClient.ts` with explicit guards that throw `"Missing required env var: ..."` at module load time — build fails fast instead of silently passing undefined to createClient
- Fixed SSR cache leak in `providers.tsx` by moving `new QueryClient()` inside a `useState` lazy initializer, ensuring each server-side request gets its own isolated cache

## Task Commits

Each task was committed atomically:

1. **Task 1: Move @supabase/supabase-js to dependencies** - `2d7335b` (fix)
2. **Task 2: Add env var validation and fix SSR QueryClient** - `4299527` (fix)

**Plan metadata:** _(docs commit — see final commit hash)_

## Files Created/Modified

- `package.json` - Moved `@supabase/supabase-js ^2.50.0` from devDependencies to dependencies; regenerated package-lock.json
- `src/lib/supabaseClient.ts` - Replaced `!` assertions with explicit throw guards for both SUPABASE env vars
- `src/app/providers.tsx` - Moved QueryClient instantiation to `useState(() => new QueryClient())` inside component body

## Decisions Made

- Presence-only validation (no URL format check) — matches CONTEXT.md spec; format validation is out of scope for this plan
- Used `React.ReactNode` inline rather than importing `ReactNode` separately — cleaner with the existing import structure after removing the `ReactNode` named import

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript narrowing worked as expected after the throw guards; `tsc --noEmit` passed with zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three production-safety defects resolved: dependency classification, env var validation, SSR cache isolation
- Codebase ready for Phase 1 Plan 2 (RLS policy audit)
- No blockers introduced

## Self-Check: PASSED

- FOUND: src/lib/supabaseClient.ts
- FOUND: src/app/providers.tsx
- FOUND: package.json
- FOUND: .planning/phases/01-critical-safety/01-01-SUMMARY.md
- FOUND commit 2d7335b (Task 1)
- FOUND commit 4299527 (Task 2)

---
*Phase: 01-critical-safety*
*Completed: 2026-02-27*
