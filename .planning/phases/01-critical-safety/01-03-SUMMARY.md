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
duration: 15min
completed: 2026-02-27
---

# Phase 1 Plan 03: Middleware Auth Guard and Auth Flow Summary

**Next.js middleware auth guard (sb-authed cookie) preventing unauthenticated dashboard access, with session expiry toast, login redirect flow, and workout URL double-slash fix**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-27T00:38:39Z
- **Completed:** 2026-02-27T00:53:00Z
- **Tasks:** 2 of 2 automated tasks complete (1 human-verify checkpoint pending)
- **Files modified:** 5

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

## Files Created/Modified
- `src/middleware.ts` - NEW: Edge middleware that reads sb-authed cookie, redirects unauthenticated /dashboard/* to /auth/login with ?redirect param
- `src/hooks/profile/useUser.ts` - Added cookie management, session expiry toast, useRef for previous-value tracking
- `src/app/dashboard/layout.tsx` - Removed render-body redirect; handleLogout now clears sb-authed cookie
- `src/app/auth/login/page.tsx` - Added redirect flow, Suspense boundary, contextual "Please sign in to continue" message
- `src/app/dashboard/workouts/page.tsx` - Fixed double-slash URL bug in workout log navigation

## Decisions Made
- **Cookie bridge for middleware auth:** Supabase stores sessions in localStorage, inaccessible to the Edge runtime. The `sb-authed=true` cookie written by client JS is a routing signal only (not a cryptographic guarantee). Proper SSR-based auth is deferred to v2 AUTH-01 per the research phase guidance.
- **useRef for session expiry detection:** `onAuthStateChange` is a closure — using state for `hadUser` would read stale values. A `useRef` updated synchronously via `setUserBoth` ensures the callback sees the current value.
- **Suspense wrapper for login page:** Next.js 15 requires a Suspense boundary around any component that calls `useSearchParams`. The `LoginForm` inner component holds all logic; the `Login` export wraps it.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Middleware auth guard is live; all `/dashboard/*` routes are protected before render
- Login redirect flow is complete — users return to their original destination after login
- Cookie pattern is established as the Supabase-to-middleware bridge
- Human verification (Task 3 checkpoint) is pending — start dev server and run the 6 manual test cases

---
*Phase: 01-critical-safety*
*Completed: 2026-02-27*
