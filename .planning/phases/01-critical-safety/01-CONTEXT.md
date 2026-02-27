# Phase 1: Critical Safety - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the existing production app to a safe baseline — no missing runtime dependencies, no silent env var failures, no unauthenticated data exposure, no auth race conditions, and no broken routing. This phase is infrastructure and security hardening only. No new features. Creating posts, interactions, and UI improvements belong in separate phases.

</domain>

<decisions>
## Implementation Decisions

### Auth redirect behavior
- Instant redirect with no flash — protected page content must never render for unauthenticated users
- Auth guard lives in **Next.js middleware** (not in the layout component)
- After successful login, redirect user to the originally requested URL (preserve destination in redirect state)
- Login page shows a subtle contextual message ("Please sign in to continue") when arriving via auth redirect, but not when navigating directly to /login

### Env var validation
- Validation triggers at **module load** — the process should crash before serving any requests
- Validation runs at both **build time and runtime** (catches missing vars in CI/CD before deploying a broken build)
- Check **presence only** — just verify vars are not undefined or empty strings; no URL format or length validation
- Error message format: just the missing var name (e.g., `Missing required env var: NEXT_PUBLIC_SUPABASE_URL`) — no setup instructions in the message

### RLS policy audit scope
- Scope: **all tables equally** — same standard for every table including child tables (`workout_exercises`, `habit_logs`, `workout_log_exercises`)
- Standard: verify RLS is **enabled** on each table AND that policies enforce `auth.uid() = user_id` on SELECT, INSERT, UPDATE, DELETE
- Action on gaps: **fix immediately** — audit and remediate in the same pass; don't flag and defer
- Deliverable format: Claude's discretion (SQL migration file is preferred if it fits the project's migration pattern)

### Error visibility
- Env var errors: **developer-only** — crash the server and log to console; users should never see this
- Session expiry (auth error mid-use): show a **toast notification** ("Your session expired. Please sign in again."), then redirect to login
- Toast implementation: use an existing toast/notification component if one exists in the codebase; add a minimal toast component if none exists
- **No new error utility or pattern** in this phase — just fix the specific listed issues; Phase 3 handles structured logging

### Claude's Discretion
- SQL migration file format and naming convention for RLS fixes
- Exact toast component design and placement if a new one is needed
- QueryClient instantiation fix approach (inside useState for SSR safety)
- Workout URL double-slash fix implementation

</decisions>

<specifics>
## Specific Ideas

- The auth guard approach must satisfy "never render protected page content" — not just "redirect eventually"
- Session expiry toast should feel like a non-alarming notification, not an error state

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-critical-safety*
*Context gathered: 2026-02-26*
