# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Codebase Audit & Hardening

**Shipped:** 2026-03-19
**Phases:** 4 | **Plans:** 9 | **Tasks:** 21

### What Was Built
- Complete RLS data isolation on all 9 Supabase tables (including child tables via EXISTS subquery)
- Middleware auth guard with cookie bridge, session expiry detection, and safe redirect flow
- Zod safeParse validation at every Supabase data boundary — all unsafe `as` casts eliminated
- React Query migration for useHabits and useMacros (consistency across all hooks except useWeightLogs)
- Vitest 4 test suite (31 tests) with MSW infrastructure and React Query test helpers
- Structured logError utility, accessible ConfirmDialog, skeleton loading components

### What Worked
- Dependency-ordered phases (safety → types → tests → polish) meant each phase could build on the previous without rework
- Zod safeParse pattern established in Phase 2 Plan 01 was immediately reusable across all subsequent plans
- Human verification checkpoints caught real bugs (login cookie race condition, RLS child table policy)
- Gap closure audit after Phase 3 caught the SAFE-04 cookie clear miss before milestone completion
- Phase 4 as a dedicated hygiene phase kept documentation debt from accumulating

### What Was Inefficient
- useWeightLogs was not migrated to React Query (left as tech debt) — should have been in Phase 2 scope
- 12 human verification items accumulated across phases — could have been tracked as a running checklist
- Phase 2 had a 20-day gap between Phase 1 completion (2026-02-27) and Phase 2 start (2026-03-18)

### Patterns Established
- Zod safeParse at Supabase boundaries: `Schema.safeParse(data)` → throw in queryFn, toast+log in useEffect
- Cookie bridge pattern: client JS sets routing cookie that Edge middleware reads
- vi.mock pattern for Supabase hook tests (workaround for @supabase/node-fetch bypassing MSW)
- logError structured logging with Supabase error code detection
- createWrapper() per-test pattern for React Query test isolation

### Key Lessons
1. Human verification checkpoints are essential — they caught 2 critical bugs (cookie race, RLS child tables) that automated checks missed
2. Audit-before-feature-work pays off — building new features on an unsafe foundation compounds tech debt
3. Dedicated hygiene phases prevent "last 5%" from being forgotten
4. @supabase/node-fetch bypasses MSW entirely — always verify test infrastructure actually intercepts requests before writing tests

### Cost Observations
- Model mix: primarily opus for planning/execution, sonnet for agents
- Sessions: ~5 sessions across 22-day milestone
- Notable: Phase 2 Plan 01 completed in 7 minutes (most efficient); Phase 1 Plan 02 (RLS) took longest at ~20 minutes due to child table discovery

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~5 | 4 | Established audit-first approach, gap closure phase pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | New Dependencies |
|-----------|-------|----------|-----------------|
| v1.0 | 31 | baseline | date-fns, vitest, msw, @testing-library, @radix-ui/react-alert-dialog |

### Top Lessons (Verified Across Milestones)

1. Human verification checkpoints catch bugs automated checks miss — keep them
2. Audit milestones should include a gap closure phase at the end
