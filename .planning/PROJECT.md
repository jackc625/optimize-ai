# Optimize AI

## What This Is

A production-hardened self-optimization dashboard for health tracking. Users can track habit streaks, log weight with editable history, calculate macros (BMR, maintenance calories, macro targets), and manage workout routines. Built on Next.js + Tailwind with Supabase as the backend. v1.0 audit milestone established complete data isolation (RLS on all 9 tables), validated type safety (Zod safeParse at every Supabase boundary), middleware auth protection, and baseline test coverage.

## Core Value

Every user sees only their own data and can trust that data to be correct — security and correctness are non-negotiable for a public production app.

## Requirements

### Validated

- ✓ Habit streak tracking — existing
- ✓ Weight logging with editable history and goal reference lines — existing
- ✓ Macro calculator (BMR, TDEE, macro targets) with saved overrides — existing
- ✓ Workout tracking (templates, exercises, session logs) — existing
- ✓ User profiles with setup flow — existing
- ✓ Authentication via Supabase Auth (sign up, sign in, session persistence) — existing
- ✓ Supabase backend with row-level security — existing
- ✓ Next.js 15 + Tailwind responsive UI — existing
- ✓ Production dependency classification and env var validation — v1.0
- ✓ SSR-safe QueryClient (no cache leak between requests) — v1.0
- ✓ RLS policies on all 9 tables enforcing `auth.uid() = user_id` — v1.0
- ✓ Middleware auth guard for `/dashboard/*` routes — v1.0
- ✓ Session expiry detection with toast and redirect — v1.0
- ✓ Safe login redirect flow with open-redirect prevention — v1.0
- ✓ Cookie bridge (sb-authed) cleared on all logout paths — v1.0
- ✓ Zod safeParse at all Supabase data boundaries (no unsafe `as` casts) — v1.0
- ✓ ESLint exhaustive-deps rule enabled as error — v1.0
- ✓ ProfileForm enum values validated via Zod schemas — v1.0
- ✓ React Query migration for useHabits and useMacros — v1.0
- ✓ Timezone-safe date handling via date-fns localDate utility — v1.0
- ✓ URL routing bug (double-slash) fixed — v1.0
- ✓ Vitest 4 test suite with 31 tests — v1.0
- ✓ Structured logError utility replacing all console.error calls — v1.0
- ✓ Accessible ConfirmDialog replacing window.confirm — v1.0
- ✓ Skeleton loading components for workouts, weight, habits — v1.0

### Active

- [ ] Add pagination to unbounded list queries (PERF-01)
- [ ] Middleware-based auth using `@supabase/ssr` replacing cookie bridge (AUTH-01)
- [ ] Create .env.example and document setup process
- [ ] useWeightLogs migration to React Query (consistency with other hooks)

### Out of Scope

- Meal planner with macro targets — next milestone after audit
- Workout routine builder — future milestone
- Habit templates (e.g., "Morning Routine") — future milestone
- Calendar view for habit logs — future milestone
- Custom notifications/reminders — future milestone
- Dark mode — future milestone
- Native iOS app — long-term roadmap
- Zod v4 migration — breaking API changes, separate effort
- Database migration system — infrastructure concern, separate from feature work

## Context

Shipped v1.0 audit milestone with 4,534 LOC TypeScript across 4 phases (9 plans, 21 tasks).

Key technical context:
- Stack: Next.js 15.3.2, React 19, TanStack React Query 5, Supabase JS 2.50, Zod, date-fns, Tailwind
- Architecture: Pages → Components → Hooks → Utils (no backend API layer; direct Supabase calls from hooks)
- All Supabase data boundaries use Zod safeParse validation
- All hooks except useWeightLogs use React Query
- RLS enforced on all 9 tables (child tables use EXISTS subquery pattern)
- Auth: cookie bridge (sb-authed) for middleware routing; proper SSR auth deferred to AUTH-01
- Test suite: Vitest 4, 31 tests (macro calc, dates, schemas, useWorkouts hook)
- Error handling: structured logError utility with Supabase error code detection

Known tech debt from v1.0 audit:
- 12 human verification items (runtime browser tests — code verified correct)
- useWeightLogs still uses useState/useEffect (not React Query)
- Dual logout button on dashboard page (UX redundancy)
- Inconsistent component-level auth guards (middleware covers all routes)

## Constraints

- **Security**: RLS must validate `auth.uid()` on every mutation — public app, data isolation is critical
- **Tech stack**: Next.js + Supabase + React Query — no architecture changes
- **Compatibility**: Must not break existing validated features while adding new ones
- **Testing**: New features should include tests using established Vitest patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit-first milestone before new features | Code quality and security issues should be resolved before building on top of them | ✓ Good — v1.0 shipped, 15/15 requirements satisfied |
| Vitest for test framework | Recommended for Next.js; fast, Jest-compatible, works with TypeScript | ✓ Good — 31 tests, clean infrastructure |
| Cookie bridge for middleware auth | Supabase uses localStorage (inaccessible to Edge middleware); cookie is routing signal only | ⚠️ Revisit — proper SSR auth via @supabase/ssr deferred to AUTH-01 |
| Zod safeParse over .parse() | safeParse lets queryFn throw structured errors that React Query catches; no unhandled rejections | ✓ Good — consistent pattern across all hooks |
| vi.mock over MSW for Supabase hook tests | @supabase/node-fetch bypasses MSW global fetch interception | ✓ Good — pragmatic workaround, tests pass |
| react-hook-form for ProfileForm | Replaces 8+ useState fields; built-in validation and dirty tracking | — Pending (deferred from v1.0) |

---
*Last updated: 2026-03-19 after v1.0 milestone completion*
