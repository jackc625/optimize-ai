---
phase: 01-critical-safety
plan: "03"
subsystem: auth
tags: [next.js, middleware, supabase, cookies, auth-guard, session-expiry]

# Dependency graph
requires:
  - phase: 01-critical-safety
    provides: Supabase client, useUser hook baseline
provides:
  - Next.js middleware auth guard for /dashboard/* routes using sb-authed cookie
  - sb-authed cookie managed by useUser (set on login, cleared on logout/expiry)
  - Session expiry toast + redirect via onAuthStateChange in useUser
  - Login page redirect flow with ?redirect param and contextual message
  - Workout log URL double-slash bug fix
affects:
  - Any future feature using dashboard routes (middleware protection is automatic)
  - Auth flow (useUser cookie pattern is the bridge for middleware)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cookie bridge pattern: client JS sets sb-authed=true cookie that middleware Edge runtime reads for routing"
    - "Suspense boundary for useSearchParams in Next.js 15 (required pattern)"
    - "useRef for prev-value tracking in auth state change to avoid stale closures"

key-files:
  created:
    - src/middleware.ts
  modified:
    - src/hooks/profile/useUser.ts
    - src/app/dashboard/layout.tsx
    - src/app/auth/login/page.tsx
    - src/app/dashboard/workouts/page.tsx

key-decisions:
  - "Cookie bridge (sb-authed) chosen over SSR session check: Supabase stores sessions in localStorage (inaccessible to Edge middleware); cookie is a routing signal only, not a security guarantee — proper SSR auth deferred to v2 AUTH-01"
  - "useRef for previous user tracking in onAuthStateChange: avoids stale closure issue where state update in the callback would not be visible to hadUser check"
  - "Suspense wrapper for Login page: Next.js 15 requires Suspense boundary around useSearchParams — inner LoginForm component holds all logic, outer Login export wraps it"

patterns-established:
  - "sb-authed cookie pattern: all auth state changes in useUser must update the cookie; any new logout path must clear it"
  - "Safe redirect validation: redirectTo.startsWith('/') && !redirectTo.startsWith('//') — prevents open redirect attacks"

requirements-completed:
  - SAFE-04
  - BUG-02

# Metrics
duration: 20min
completed: 2026-02-27
---

# Phase 1 Plan 03: Middleware Auth Guard and Auth Flow Summary

**Next.js middleware auth guard (sb-authed cookie) preventing unauthenticated dashboard access, with session expiry toast, login redirect flow, and workout URL double-slash fix**

## Performance

- **Duration:** ~20 min (includes post-checkpoint fix)
- **Started:** 2026-02-27T00:38:39Z
- **Completed:** 2026-02-27T00:58:00Z
- **Tasks:** 3 of 3 complete (2 automated + 1 human-verified)
- **Files modified:** 6

## Accomplishments
- Created `src/middleware.ts` — Edge-runtime auth guard redirecting unauthenticated `/dashboard/*` requests to `/auth/login?redirect=<path>` before any page renders
- Updated `useUser.ts` — sets `sb-authed=true` cookie on login/session mount, clears on logout/expiry, shows toast and redirects on mid-session expiry
- Removed render-body redirect from `dashboard/layout.tsx` (race condition bug eliminated; middleware handles it) and added cookie clearing to `handleLogout`
- Updated `login/page.tsx` — reads `?redirect` param, validates as safe relative path, shows "Please sign in to continue" only when arriving via redirect, navigates to original destination after login
- Fixed `workouts/page.tsx` — removed double-slash from `/dashboard//workouts/{id}/log`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create middleware and update useUser cookie management** - `1da09f4` (feat)
2. **Task 2: Update layout redirect, login redirect flow, and fix workout URL** - `af6f8fc` (fix)
3. **Task 3: Human verification checkpoint** - approved (all 6 manual tests passed)
   - Post-checkpoint fix: `7545538` (fix) — login cookie race condition resolved

## Files Created/Modified
- `src/middleware.ts` - NEW: Edge middleware that reads sb-authed cookie, redirects unauthenticated /dashboard/* to /auth/login with ?redirect param
- `src/hooks/profile/useUser.ts` - Added cookie management, session expiry toast, useRef for previous-value tracking
- `src/app/dashboard/layout.tsx` - Removed render-body redirect; handleLogout now clears sb-authed cookie
- `src/app/auth/login/page.tsx` - Added redirect flow, Suspense boundary, contextual "Please sign in to continue" message; post-checkpoint: sets sb-authed cookie synchronously before router.push
- `src/app/dashboard/workouts/page.tsx` - Fixed double-slash URL bug in workout log navigation
- `supabase/migrations/20260226_rls_all_tables.sql` - (post-checkpoint) Fixed RLS child table policies using EXISTS subqueries for tables without direct user_id column

## Decisions Made
- **Cookie bridge for middleware auth:** Supabase stores sessions in localStorage, inaccessible to the Edge runtime. The `sb-authed=true` cookie written by client JS is a routing signal only (not a cryptographic guarantee). Proper SSR-based auth is deferred to v2 AUTH-01 per the research phase guidance.
- **useRef for session expiry detection:** `onAuthStateChange` is a closure — using state for `hadUser` would read stale values. A `useRef` updated synchronously via `setUserBoth` ensures the callback sees the current value.
- **Suspense wrapper for login page:** Next.js 15 requires a Suspense boundary around any component that calls `useSearchParams`. The `LoginForm` inner component holds all logic; the `Login` export wraps it.

## Deviations from Plan

### Auto-fixed Issues (applied during human verification)

**1. [Rule 1 - Bug] Login cookie race condition causing redirect loop**
- **Found during:** Task 3 (human-verify checkpoint) — detected during Test 2 (redirect preservation)
- **Issue:** After login, `useUser`'s `onAuthStateChange` sets the `sb-authed` cookie, but it does not run on the login page itself. When `router.push(safeRedirect)` fires, the middleware checks the cookie before the auth state change fires in the new route, causing the middleware to redirect back to login — a redirect loop.
- **Fix:** Set `document.cookie = "sb-authed=true; path=/; SameSite=Lax"` synchronously in `handleLogin` (in `login/page.tsx`) immediately before `router.push(safeRedirect)`, ensuring the cookie is present when the middleware evaluates the next request.
- **Files modified:** `src/app/auth/login/page.tsx`
- **Verification:** Human-verified: all 6 manual tests passed after fix
- **Committed in:** `7545538` (fix commit after checkpoint)

**2. [Rule 1 - Bug] RLS child table policies using wrong column reference**
- **Found during:** Task 3 (human-verify checkpoint) — discovered alongside login cookie fix during verification
- **Issue:** The RLS migration for `workout_exercises` and `workout_log_exercises` used `user_id = auth.uid()` directly, but neither table has a `user_id` column (they join via `workouts.user_id` and `workout_logs.user_id` respectively).
- **Fix:** Replaced direct `user_id` comparisons with `EXISTS` subqueries that traverse the parent table join to reach `auth.uid()`.
- **Files modified:** `supabase/migrations/20260226_rls_all_tables.sql`
- **Verification:** Part of the verified fix commit
- **Committed in:** `7545538` (fix commit after checkpoint)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bugs)
**Impact on plan:** Both fixes were essential for correctness. The cookie race fix was required for the redirect flow to work at all. The RLS fix was required for child table policies to apply correctly. No scope creep.

## Issues Encountered

None — both bugs discovered during human verification were resolved immediately and verified by the user confirming all 6 tests passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Middleware auth guard is live and human-verified; all `/dashboard/*` routes are protected before render
- Login redirect flow is complete and verified — users return to their original destination after login, no redirect loops
- Cookie pattern is established as the Supabase-to-middleware bridge; login page must set the cookie synchronously before push
- RLS policies on child tables (`workout_exercises`, `workout_log_exercises`) are now correct using EXISTS subqueries
- Phase 1 (Critical Safety) is fully complete — all 3 plans executed and verified
- Ready for Phase 2 (Data Integrity) — see ROADMAP.md for next steps

---
*Phase: 01-critical-safety*
*Completed: 2026-02-27*
