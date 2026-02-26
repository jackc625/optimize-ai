# Feature Research

**Domain:** Next.js + Supabase production app audit and hardening
**Researched:** 2026-02-26
**Confidence:** HIGH (codebase directly inspected; patterns verified against official docs and current community practice)

---

## Context: Framing "Features" for an Audit Milestone

This is not a greenfield feature list. The "features" here are **fixes and hardening improvements** to an existing app. The categories map directly to what the codebase audit surfaced in `.planning/codebase/CONCERNS.md`. Each item is classified as:

- **Table Stakes** — missing or broken = the app is unsafe or unusable in production
- **Differentiators** — quality improvements that make the app maintainable and professional
- **Anti-Features** — things that look like improvements but add complexity without proportional value

---

## Feature Landscape

### Table Stakes (Must Fix — App Is Unsafe or Unreliable Without These)

These are non-negotiable for a public production app. Users' data is at risk, or core flows are broken.

| Fix | Why It's Table Stakes | Complexity | Notes |
|-----|----------------------|------------|-------|
| Env var validation at startup | `supabaseClient.ts` uses `!` operator; missing vars cause silent `undefined` errors that only surface at runtime | LOW | Add `if (!url \|\| !key) throw new Error(...)` before `createClient()` |
| Move `@supabase/supabase-js` to `dependencies` | Currently in `devDependencies` — production builds may exclude it, causing crashes | LOW | One-line `package.json` change; critical for deployment |
| Auth guard via Next.js middleware | `dashboard/layout.tsx` does `router.push('/auth/login')` during render — race condition window where protected content flashes | MEDIUM | Use `@supabase/ssr` + `middleware.ts` to enforce auth server-side before page renders; `getUser()` is safer than `getSession()` per Supabase docs |
| Fix `router.push()` during render in layout | Calling `router.push` in layout render body (not in `useEffect`) is a React anti-pattern that can cause double-render issues | LOW | Move redirect logic into `useEffect` or, better, handle in middleware |
| Fix double-slash URL bug | `router.push(/dashboard//workouts/${w.id}/log)` is malformed | LOW | Remove extra slash; straightforward string fix |
| RLS audit on all mutation hooks | CONCERNS.md flags that RLS relies on `auth.uid()` but no audit has been performed; 83% of exposed Supabase databases involve RLS misconfigurations (per 2025 security research) | MEDIUM | Verify every table has RLS enabled + correct `WITH CHECK` policies for inserts/updates |
| Fix `useHabits` — not integrated with React Query | `useHabits` uses manual `useState`/`useEffect` with raw Supabase calls, no caching, no deduplication. A different pattern from every other hook (workouts, macros use React Query) | HIGH | Rewrite to `useQuery`/`useMutation` pattern for consistency; also fixes the missing dependency array issue |
| Fix `useMacros` empty dependency array | `useEffect(() => { refresh(); }, [])` — `refresh` is defined inside the component, so if user changes, macros won't re-fetch | LOW | Add `useCallback` wrapper + correct deps, or migrate to `useQuery` |
| Fix stale data in `dashboard/page.tsx` | `loadProfileName` effect only re-runs on `[user]` change, but profile name can change without user changing | LOW | Add profile-fetch invalidation on mutation; or fetch via React Query `queryKey: ['profile', user.id]` |

### Differentiators (Quality Improvements — Expected in a Professional App)

These don't cause immediate breakage but distinguish a production-quality app from a hobby project.

| Fix | Value Proposition | Complexity | Notes |
|-----|-------------------|------------|-------|
| Zod validation on all Supabase response boundaries | `useWorkouts.ts` does `(data ?? []) as WorkoutRow[]` before `.parse()` — the cast bypasses the protection the parse is supposed to provide. Zod `.parse()` should receive the raw `data`, not a pre-cast value | MEDIUM | Remove `as WorkoutRow[]` assertions; pass raw `data` to `WorkoutTemplateSchema.parse()`; the schema IS the type guard |
| Validate `ProfileForm` enum casts before use | `form.sex as "male" \| "female"` is cast before Zod validation; if form is tampered, the cast type is wrong when the error fires | LOW | `ProfileSchema.parse(parsedInput)` already covers this — the issue is the cast happens before parse; reorder so parse result drives the payload, not the pre-cast |
| Migrate `ProfileForm` to `react-hook-form` + `zodResolver` | 8 `useState` fields with manual change handler; no dirty tracking, no per-field errors | MEDIUM | `react-hook-form` + `@hookform/resolvers/zod` is the 2025 standard pattern; reduces boilerplate by ~60%, adds per-field validation feedback |
| Add `eslint-plugin-react-hooks` with `exhaustive-deps` rule | No linting catches the `useEffect` dependency errors; this would have prevented the `useMacros` and `useHabits` bugs | LOW | `npm install -D eslint-plugin-react-hooks`; one config line |
| Configure `QueryClient` with explicit options | `new QueryClient()` with no options uses defaults that are too aggressive for re-fetching on focus/network reconnect for a health-tracking app | LOW | Set `staleTime: 1000 * 60 * 5`, `gcTime: 1000 * 60 * 10`, `retry: 1`, `refetchOnWindowFocus: false` in `providers.tsx` |
| Add loading skeleton components | Generic spinner text for list pages (workouts, habits, weight); users unsure if page is hung | MEDIUM | One skeleton component per data-heavy page; use Tailwind `animate-pulse` divs mirroring final layout; also supported natively by Next.js 15 `loading.tsx` files |
| Replace `window.confirm()` with accessible modal | Non-dismissible browser dialog is poor UX and inaccessible to screen readers | MEDIUM | Custom `<ConfirmDialog>` component using Radix UI `Dialog` or headless equivalent; also fixes keyboard navigation for delete flows |
| Structured error logging utility | All hooks log with `console.error("message:", err)` — missing operation context, user ID, stack trace correlation | LOW | Single `logError(context, err)` utility function that serializes error + context to JSON; no external service needed initially |
| Add `.env.example` file | Developers have no reference for required env vars without reading source code | LOW | Create `.env.example` with `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=` documented |
| Fix `supabase` singleton pattern for SSR | Current `supabaseClient.ts` creates a single browser client — incompatible with SSR/middleware if those are added | MEDIUM | Not urgent now (app is client-only), but document the risk; note when middleware is added, `@supabase/ssr`'s `createBrowserClient`/`createServerClient` pattern is required |

### Differentiators (Performance — Important as Data Grows)

| Fix | Value Proposition | Complexity | Notes |
|-----|-------------------|------------|-------|
| Add pagination to `useWorkoutLogs` | Unbounded query fetches all historical logs; at 100+ sessions this becomes slow and memory-heavy | MEDIUM | Use Supabase `.range(from, to)` + React Query `useInfiniteQuery` for cursor-based pagination; `getNextPageParam` tracks offset |
| Add pagination to `useWorkouts` and `useHabits` | Same unbounded issue; workouts grow slowly but habit_logs grow daily | MEDIUM | Same pattern as workout logs; `useHabits` is lower priority since streaks require all-time data |
| Move streak calculation to database | In-memory O(n*m) streak calculation runs on every habits fetch | HIGH | Add a `streak` column updated by Postgres trigger or computed on the server; defer to a later milestone — only matters at scale |

### Test Infrastructure

| Fix | Value Proposition | Complexity | Notes |
|-----|-------------------|------------|-------|
| Set up Vitest + React Testing Library | Zero test coverage = any refactoring can silently break production features | MEDIUM | `vitest`, `@testing-library/react`, `@testing-library/user-event`, `msw` for API mocking; official Next.js docs updated Feb 2026 cover this stack |
| Tests for `useWorkouts` / `useWorkoutLogs` hooks | These hooks are the most complex and have the unsafe `as` casts — highest regression risk | MEDIUM | `renderHook` from RTL + `msw` to mock Supabase responses; test error paths, not just happy paths |
| Tests for auth redirect logic | The layout auth guard is the security boundary; it must be tested | MEDIUM | Mock `useUser` hook; assert redirect behavior when `user === null` |
| Tests for `calculateMacros` utility | Pure function, no side effects — should be tested first as lowest-effort, highest-confidence win | LOW | Plain Vitest unit tests; no DOM or mocking needed |

---

## Anti-Features (Deliberately Avoid These)

| Anti-Feature | Why Requested | Why Problematic | What to Do Instead |
|--------------|---------------|-----------------|-------------------|
| Global error boundary as the only error handling | Seems like a quick fix for all unhandled errors | Hides per-hook errors; users see a full-page crash instead of graceful degradation in one section | Keep per-query `onError` handlers; add React `error.tsx` route boundary only as last-resort fallback |
| Migrate `useHabits` to React Server Components | RSC is modern and feels like the right move | This hook has complex interactive state (streak display, real-time toggle) — RSC is for static/slow data; forcing it here creates a hybrid client/server split that's harder to test and reason about | Keep as client hook; migrate to `useQuery` pattern instead |
| Real-time subscriptions (Supabase Realtime) | Seems like a natural Supabase feature to use | This is a single-user health dashboard — users don't need to see their own habit checked in another tab. Realtime adds connection overhead, reconnect complexity, and test surface area | Use `invalidateQueries` after mutations for instant cache refresh; no WebSocket needed |
| Adding Sentry or Datadog in this milestone | Professional apps have observability | Correct, but integrating external logging services adds config complexity and is out of scope for a hardening audit. The structured logging utility built here provides the foundation for a future service integration | Build `logError()` utility in this milestone; add external transport (Sentry, Datadog) in a future milestone |
| Migrating all hooks to RSC + Server Actions at once | Next.js 15 server actions are the "right" pattern | Would be a complete architecture rewrite during an audit milestone, violating the constraint of "no architecture changes." Also, current RLS + client SDK pattern is simpler and well-understood | Fix the existing client-hook pattern first; document server-action migration as a future milestone option |
| E2E tests with Playwright in this milestone | Full coverage seems better | E2E tests require a running Supabase instance, test seeding, and CI setup — that's a separate milestone. Unit + integration tests with `msw` mocks give 80% of the value for 20% of the setup cost | Unit tests with Vitest + msw now; Playwright in a later milestone |
| `window.confirm` fix via `useConfirm` hook with `Promise` | Clever hook pattern exists in the ecosystem | Adds unnecessary abstraction over what is a simple modal component need | Build a straightforward `<ConfirmDialog>` component with `isOpen`/`onConfirm`/`onCancel` props |

---

## Feature Dependencies

```
[RLS Audit]
    └──must precede──> [Env Var Validation] (validates infra is safe before hardening app layer)

[Auth Middleware]
    └──must precede──> [Auth Tests] (can't test what doesn't exist)

[Vitest Setup]
    └──enables──> [Hook Tests]
    └──enables──> [Auth Redirect Tests]
    └──enables──> [Macro Calculation Tests]

[useHabits React Query Migration]
    └──enables──> [Pagination for Habits] (React Query's useInfiniteQuery can't wrap a manual useState pattern)

[QueryClient Configuration]
    └──enhances──> [All hooks] (staleTime and gcTime affect all useQuery behavior)

[react-hook-form migration]
    └──conflicts with──> [Current useState ProfileForm] (can't partially migrate; must replace entirely)

[Structured logError utility]
    └──enables──> [Future Sentry/Datadog integration] (provides structured context format)

[Loading Skeletons]
    └──requires──> [Knowing what final layout looks like] (skeleton must mirror final UI)
```

### Dependency Notes

- **RLS audit must come first:** Any other hardening is undermined if the database access control layer has holes.
- **Env var validation is a one-line fix:** Do it first — it unblocks confident local setup for all other work.
- **Vitest setup enables everything in the test category:** Set it up once; don't try to write tests before the framework exists.
- **`useHabits` migration to React Query is a prerequisite for pagination:** You can't use `useInfiniteQuery` on a hook that manages its own state manually.
- **`react-hook-form` migration is atomic:** The form either uses `useState` or `react-hook-form`; partial migration creates more bugs than it solves.

---

## MVP Definition (for Audit Milestone)

### Phase 1: Fix — Non-Negotiable Safety Issues

Critical fixes that cannot be deferred on a public app.

- [x] Move `@supabase/supabase-js` to `dependencies`
- [x] Add env var startup validation in `supabaseClient.ts`
- [x] Fix double-slash URL routing bug
- [x] RLS policy audit on all tables
- [x] Fix auth redirect from layout render body to `useEffect` or middleware
- [x] Fix `useMacros` stale `useEffect` dependency

### Phase 2: Harden — Type Safety and Data Integrity

- [x] Remove unsafe pre-cast `as` assertions before Zod `.parse()` in workout hooks
- [x] Fix `ProfileForm` enum cast ordering (parse first, then extract typed values)
- [x] Add `eslint-plugin-react-hooks` with `exhaustive-deps` to catch future dependency bugs
- [x] Configure `QueryClient` with explicit `staleTime`, `gcTime`, `retry` options
- [x] Add `.env.example` file

### Phase 3: Quality — Test Infrastructure and UX

- [x] Set up Vitest + RTL + msw
- [x] Unit tests for `calculateMacros` utility (no mocking needed)
- [x] Integration tests for `useWorkouts` hook
- [x] Migrate `useHabits` to React Query
- [x] Replace `window.confirm()` with `<ConfirmDialog>` component
- [x] Add structured `logError()` utility

### Add After Phase 3 (v1.x)

- [ ] `ProfileForm` migration to `react-hook-form` + `zodResolver` — trigger: ProfileForm bugs reported or form complexity increases
- [ ] Loading skeleton components — trigger: perceived performance complaints
- [ ] Pagination for `useWorkoutLogs` — trigger: user has 50+ logged sessions
- [ ] Auth tests (redirect, guard behavior) — trigger: any auth bug in production

### Defer to Future Milestones (v2+)

- [ ] Next.js middleware auth guard via `@supabase/ssr` — correct long-term pattern but requires restructuring client creation; do when adding server-side features
- [ ] Streak calculation moved to database — only matters at scale (100+ habits)
- [ ] E2E Playwright tests — requires CI + Supabase test project setup
- [ ] Sentry/Datadog integration — logError utility provides the foundation; add when production issues need correlation

---

## Feature Prioritization Matrix

| Fix Category | User Value | Implementation Cost | Priority |
|--------------|------------|---------------------|----------|
| Move supabase-js to dependencies | HIGH | LOW | P1 |
| Env var validation | HIGH | LOW | P1 |
| Fix double-slash URL | MEDIUM | LOW | P1 |
| RLS audit | HIGH | MEDIUM | P1 |
| Fix auth redirect anti-pattern | HIGH | LOW | P1 |
| Fix useMacros dependency array | MEDIUM | LOW | P1 |
| Remove pre-cast `as` before Zod parse | HIGH | MEDIUM | P1 |
| eslint exhaustive-deps rule | MEDIUM | LOW | P1 |
| QueryClient explicit config | MEDIUM | LOW | P2 |
| .env.example | MEDIUM | LOW | P2 |
| Vitest setup | HIGH | MEDIUM | P1 |
| calculateMacros unit tests | MEDIUM | LOW | P1 |
| useWorkouts hook tests | HIGH | MEDIUM | P2 |
| useHabits React Query migration | HIGH | HIGH | P2 |
| ConfirmDialog component | MEDIUM | MEDIUM | P2 |
| logError utility | MEDIUM | LOW | P2 |
| ProfileForm react-hook-form | MEDIUM | MEDIUM | P3 |
| Loading skeleton components | MEDIUM | MEDIUM | P3 |
| Pagination (workout logs) | HIGH | MEDIUM | P3 |
| Auth middleware via @supabase/ssr | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, include in milestone if scope allows
- P3: Defer to next milestone

---

## Codebase-Specific Observations

These are findings from direct inspection that affect implementation:

**What's already correct (don't change):**
- `useWorkouts` and `useWorkoutLogs` already call `WorkoutTemplateSchema.parse()` / `WorkoutLogSchema.parse()` — the pattern is right; the bug is the pre-cast before parse
- `WorkoutTemplateSchema` and `WorkoutLogSchema` are already defined in `/src/schemas/` — schemas exist, just not consistently applied
- `useWorkout` (single workout) already has `enabled: Boolean(workoutId)` — correct conditional fetch pattern
- `useCreateWorkout`, `useUpdateWorkout`, `useDeleteWorkout` all call `qc.invalidateQueries` on success — correct cache invalidation
- `useUser` subscribes to `onAuthStateChange` and unsubscribes on cleanup — correct Supabase auth listener pattern
- `ProfileForm` does call `ProfileSchema.parse(parsedInput)` before the Supabase call — the validation exists, the cast ordering is the bug

**What's inconsistent and needs standardizing:**
- `useHabits` is the only hook using `useState`/`useEffect` instead of `useQuery`/`useMutation` — creates two patterns in the codebase
- `useMacros` is also `useState`/`useEffect` — same inconsistency
- Some hooks use `staleTime: 1000 * 60 * 5` explicitly; others rely on `QueryClient` defaults (which are 0ms by default)

**The `as` cast pattern that needs fixing** (specific to workout hooks):
```typescript
// Current (wrong): cast happens BEFORE parse, bypassing type safety
const rows = (data ?? []) as WorkoutRow[];
return rows.map((row) => WorkoutTemplateSchema.parse({ ... }))

// Correct: pass raw data to parse; parse IS the type assertion
return (data ?? []).map((row: unknown) => WorkoutTemplateSchema.parse(row))
// Or: use safeParse for graceful error handling per-row
```

---

## Sources

- Direct codebase inspection: `/src/hooks/`, `/src/components/`, `/src/schemas/`, `/src/app/` (HIGH confidence)
- CONCERNS.md: `.planning/codebase/CONCERNS.md` (HIGH confidence — generated from codebase audit)
- Supabase official docs: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) (HIGH confidence)
- Next.js official docs: [Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest) — updated February 24, 2026 (HIGH confidence)
- TanStack Query official docs: [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates), [Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) (HIGH confidence)
- Supabase Auth + Next.js patterns: [Supabase troubleshooting guide](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) — `getUser()` vs `getSession()` recommendation (HIGH confidence)
- Supabase RLS 2025 incident data: [DesignRevision RLS guide](https://designrevision.com/blog/supabase-row-level-security) — 83% of exposed databases involved RLS misconfigurations (MEDIUM confidence — third-party citing Lovable incident)
- react-hook-form + Zod resolver: [GitHub resolvers](https://github.com/react-hook-form/resolvers), [npm](https://www.npmjs.com/package/@hookform/resolvers) (HIGH confidence)
- Structured logging for Next.js: [Arcjet blog](https://blog.arcjet.com/structured-logging-in-json-for-next-js/) (MEDIUM confidence — community source)
- Makerkit production patterns: [Next.js + Supabase in production retrospective](https://catjam.fi/articles/next-supabase-what-do-differently) (MEDIUM confidence — practitioner source)

---

*Feature research for: optimize-ai audit and hardening milestone*
*Researched: 2026-02-26*
