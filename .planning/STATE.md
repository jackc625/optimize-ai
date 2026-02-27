# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Every user sees only their own data and can trust that data to be correct — security and correctness are non-negotiable for a public production app.
**Current focus:** Phase 1 — Critical Safety

## Current Position

Phase: 1 of 3 (Critical Safety)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-27 — Completed Plan 01-01: critical safety fixes (dependency, env validation, SSR QueryClient)

Progress: [█░░░░░░░░░] 11%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 8 min
- Total execution time: 8 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-critical-safety | 1 | 8 min | 8 min |

**Recent Trend:**
- Last 5 plans: 8 min
- Trend: baseline

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Audit-first milestone before new features — code quality and security must be resolved before building on top of them
- [Init]: Vitest for test framework — recommended for Next.js; fast, Jest-compatible, works with TypeScript
- [Init]: react-hook-form for ProfileForm — deferred to v2; Phase 2 fixes only the enum cast ordering
- [01-01]: Presence-only validation for env vars — no URL format check (per CONTEXT.md guidance; format validation out of scope)
- [01-01]: React.ReactNode inline rather than importing ReactNode named export — cleaner with updated import structure

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: RLS policy completeness on child tables (`workout_exercises`, `habit_logs`, `workout_log_exercises`) is unknown — treat as a discovery task; audit in Supabase dashboard, do not assume coverage
- [Phase 2]: `supabase gen types typescript` output shape is unknown until run — nullable fields or join shapes may require Zod schema adjustments after type generation
- [Phase 2]: `useMacros` migration scope — derived calculations (calculateBMR, calculateTDEE) must remain in the query function or as selectors, not split into separate derived state

## Session Continuity

Last session: 2026-02-27
Stopped at: Completed 01-01-PLAN.md — runtime dep fix, env validation, SSR QueryClient fix
Resume file: None
