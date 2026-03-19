# Optimize AI

## What This Is

A public self-optimization dashboard for health tracking. Users can track habit streaks, log weight with editable history, calculate macros (BMR, maintenance calories, macro targets), and manage workout routines. Built on Next.js + Tailwind with Supabase as the backend, including row-level security for multi-tenant data isolation.

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

### Active

- [ ] Fix all critical/high-priority concerns identified in codebase audit
- [x] Resolve type safety issues (unsafe `as` casts, unvalidated form enums) — Validated in Phase 02: type-safety
- [ ] Fix authentication race conditions and missing env var validation
- [x] Fix useEffect dependency arrays causing stale data — Validated in Phase 02: type-safety (React Query migration)
- [ ] Resolve URL routing bug (double-slash path)
- [x] Fix date handling timezone edge cases — Validated in Phase 02: type-safety (localDate utility)
- [ ] Add pagination to unbounded list queries
- [ ] Set up test infrastructure and baseline tests for critical paths
- [ ] Replace window.confirm() with accessible modal dialog
- [ ] Improve error logging with structured context
- [ ] Add loading skeleton components
- [ ] Create .env.example and document setup process

### Out of Scope

- Meal planner with macro targets — next milestone after audit
- Workout routine builder — future milestone
- Habit templates (e.g., "Morning Routine") — future milestone
- Calendar view for habit logs — future milestone
- Custom notifications/reminders — future milestone
- Dark mode — future milestone
- Native iOS app — long-term roadmap

## Context

The codebase map (`.planning/codebase/`) surfaced a comprehensive set of concerns across 8 categories: URL routing, type safety, testing, data persistence/race conditions, error handling, security, performance, and fragile date handling. All concerns are documented in `.planning/codebase/CONCERNS.md`.

Key technical context:
- Stack: Next.js 15.3.2, React 19, TanStack React Query 5, Supabase JS 2.50, Zod, Tailwind
- Architecture: Pages → Components → Hooks → Utils (no backend API layer; direct Supabase calls from hooks)
- Supabase SDK is in devDependencies (should be in dependencies)
- No test infrastructure currently exists
- Date handling uses `.toISOString().split('T')[0]` which has timezone edge cases near midnight

## Constraints

- **Security**: RLS must validate `auth.uid()` on every mutation — public app, data isolation is critical
- **Tech stack**: Next.js + Supabase + React Query — no architecture changes in audit milestone
- **Compatibility**: Must not break existing validated features while fixing concerns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit-first milestone before new features | Code quality and security issues should be resolved before building on top of them | — Pending |
| Vitest for test framework | Recommended for Next.js; fast, Jest-compatible, works with TypeScript | — Pending |
| react-hook-form for ProfileForm | Replaces 8+ useState fields; built-in validation and dirty tracking | — Pending |

---
*Last updated: 2026-03-18 after Phase 02 completion*
