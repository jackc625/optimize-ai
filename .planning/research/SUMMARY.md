# Project Research Summary

**Project:** optimize-ai — Next.js 15 + Supabase production app audit and hardening
**Domain:** Single-user health tracking dashboard (workouts, habits, macros, weight)
**Researched:** 2026-02-26
**Confidence:** HIGH

## Executive Summary

This project is an existing production Next.js 15 App Router application backed by Supabase, with React Query for server state and Tailwind CSS for styling. The audit milestone is not a greenfield build — it is a targeted hardening exercise that closes safety gaps, standardizes inconsistent patterns, and installs the test infrastructure needed to refactor with confidence. The codebase has a solid foundation (correct schema definitions, mostly correct React Query patterns, auth state subscription), but carries five categories of risk: missing server-side auth enforcement, unsafe type assertions on Supabase responses, two hooks using a non-React-Query pattern that can't be reliably tested, an off-thread date bug that corrupts habit streaks, and zero test coverage.

The recommended approach is to work in three phases ordered by dependency. Phase 1 fixes non-negotiable safety issues (env var validation, supabase-js dependency classification, auth redirect anti-pattern, RLS audit, double-slash routing bug, stale useEffect deps). Phase 2 hardens type safety across every Supabase response boundary (replacing `as` casts with Zod `.safeParse()`, standardizing hook patterns, adding ESLint exhaustive-deps). Phase 3 installs the test infrastructure and applies quality improvements that assume the hardened hooks exist (Vitest + RTL + msw, hook tests, useHabits/useMacros migration to React Query, accessible ConfirmDialog, structured logging). A small set of improvements — ProfileForm to react-hook-form, pagination, middleware-based auth, loading skeletons — are deliberately deferred to avoid scope creep during an audit milestone.

The primary risk during implementation is the middleware auth addition. CVE-2025-29927 (CVSS 9.1) allows middleware bypass via a crafted request header on Next.js < 15.2.3. The project already runs 15.3.2, so the vulnerability is patched, but this must be verified before middleware is deployed. The secondary risk is that adding pagination changes query key shapes, breaking existing mutation invalidation logic if not handled as a full vertical slice. RLS misconfiguration is the biggest data-security risk — 83% of exposed Supabase databases involve incomplete RLS policies, particularly on child tables (`workout_exercises`, `habit_logs`).

---

## Key Findings

### Recommended Stack

The existing stack is correct and should not change. Next.js 15 + React 19 + Supabase v2 + TanStack Query v5 + Zod v3 + Tailwind CSS v3 is a well-tested combination with high community confidence. The primary dependency fix is moving `@supabase/supabase-js` from `devDependencies` to `dependencies` — as written, production builds may exclude it, causing crashes. Additionally, the project uses v2.50.0, which should be updated to v2.50.5+ to avoid a known type regression in v2.50.4.

Six targeted additions are recommended, each solving a specific documented gap in the codebase: `react-hook-form` + `@hookform/resolvers` (eliminate 8 useState fields and string-to-enum casts in ProfileForm), `date-fns` + `@date-fns/tz` (fix UTC-vs-local date bug in habit streak calculation), `@radix-ui/react-dialog` + `@radix-ui/react-alert-dialog` (replace inaccessible `window.confirm()` calls), and a full Vitest 4 test stack (`vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `vite-tsconfig-paths`, `msw`). Zod v3 should stay — v4 is 14x faster and 57% smaller but breaks `.string().email()` chaining; migrate in a later milestone.

**Core technologies:**
- Next.js 15.3.2: Full-stack framework — keep, already correct; App Router required for SSR + Supabase RLS
- @supabase/supabase-js 2.50.5+: Supabase client — move to `dependencies`; pin to avoid v2.50.4 regression
- @tanstack/react-query 5.x: Server state cache — correct choice; configure with explicit staleTime/gcTime/retry
- Zod 3.x: Schema validation — stay on v3; schemas already exist, just not applied consistently
- vitest 4.x: Test runner — official Next.js recommendation; faster than Jest, native ESM
- react-hook-form 7.x: Form state — eliminates 8 useState fields in ProfileForm; uncontrolled inputs
- date-fns 4.x + @date-fns/tz: Date utilities — fixes UTC-vs-local date bug, timezone-safe formatting
- @radix-ui/react-alert-dialog: Accessible destructive confirm — replaces `window.confirm()`

### Expected Features

This is an audit milestone, so "features" are fixes and hardening improvements mapped from CONCERNS.md. The prioritization matrix from research has clear tiers.

**Must have (table stakes — app is unsafe without these):**
- Move @supabase/supabase-js to dependencies — production builds may exclude it currently
- Add env var startup validation in supabaseClient.ts — missing vars produce silent undefined errors
- Fix double-slash URL bug in workout routing — malformed route string
- RLS audit on all tables including child tables (workout_exercises, habit_logs) — misconfigured RLS is the #1 Supabase security risk
- Fix auth redirect: move router.push() out of layout render body — React anti-pattern causing race conditions
- Fix useMacros stale useEffect dependency array — wrong data displayed when user context changes
- Remove `as Type` casts before Zod .parse() in workout hooks — casts defeat the runtime type protection
- Fix useHabits — only hook not on React Query; causes inconsistency and makes it untestable

**Should have (production quality):**
- Configure QueryClient with explicit staleTime, gcTime, retry options
- Add eslint-plugin-react-hooks with exhaustive-deps rule — would have prevented useMacros and useHabits bugs
- Expand Zod schemas to all tables (habitSchema, weightSchema, macroSchema) — only workouts have schemas today
- Set up Vitest + RTL + msw test infrastructure
- Unit tests for calculateMacros (pure function, zero mocking needed)
- Integration tests for useWorkouts hook
- Replace window.confirm() with accessible ConfirmDialog component
- Structured logError() utility — enables future Sentry/Datadog integration
- Add .env.example file

**Defer to v1.x after audit:**
- ProfileForm migration to react-hook-form — trigger: form bugs or complexity increase
- Loading skeleton components — trigger: perceived performance complaints
- Pagination for useWorkoutLogs — trigger: user has 50+ logged sessions
- Auth tests (redirect, guard behavior) — trigger: auth bug in production

**Defer to v2+:**
- Next.js middleware auth guard via @supabase/ssr — correct long-term pattern but requires architecture restructuring
- Streak calculation moved to database — only matters at scale (100+ habits)
- E2E Playwright tests — requires CI + Supabase test project setup
- Sentry/Datadog integration — logError() utility provides the foundation; add later
- Zod v4 migration — 14x faster, 57% smaller, but breaks .string().email(); separate milestone

**Deliberate non-features (explicitly avoid):**
- Global error boundary as sole error handling — hides per-hook graceful degradation
- Supabase Realtime subscriptions — single-user dashboard; invalidateQueries after mutations is sufficient
- useInfiniteQuery for pagination — adds component-level API change; useQuery with .range() is correct for this scale
- Server Actions + RSC migration in this milestone — would be a complete architecture rewrite, not an audit fix

### Architecture Approach

The existing layered architecture (Middleware → Layouts → Pages → Components → Hooks → Utils → Lib → Supabase) is correct and should not be restructured. Hardening is applied at boundaries: env var validation at the lib layer, Zod parse at every hook boundary (anti-corruption layer pattern), structured logging at every error handler, and optional middleware for server-side auth enforcement. Two hooks (`useHabits`, `useMacros`) use a non-React-Query pattern inconsistent with all other hooks; both should be migrated to `useQuery`/`useMutation` as part of the type safety phase.

The single most important architectural principle from research: Zod `.parse()` or `.safeParse()` must receive the raw Supabase `data` object — not a pre-cast value. Currently, workout hooks do `(data ?? []) as WorkoutRow[]` before calling `.parse()`, which defeats the runtime protection. The cast happens before the parse, so TypeScript types are wrong when the parse fires. The fix is removing the `as` cast and letting Zod derive the type from `z.infer<typeof Schema>`.

**Major components and responsibilities:**
1. `middleware.ts` (new) — primary auth gate using @supabase/ssr getUser(); fires before page render; token refresh
2. `DashboardLayout` — secondary client-side auth guard (useEffect pattern, defense-in-depth only); profile existence check
3. React Query hooks — data fetching, caching, Zod validation, structured error logging; single integration boundary with Supabase
4. `src/schemas/` — expanded to cover all tables (habit, weight, macro); schemas are the runtime type system
5. `src/utils/logger.ts` (new) — createLogger(context) factory for structured JSON error logs; enables future external transport
6. `src/utils/dates.ts` (new) — formatLocalDate() replacing all .toISOString().split('T')[0] calls; timezone-safe

### Critical Pitfalls

1. **Zod .parse() crashes on schema mismatch** — Replace all bare `.parse()` calls with `.safeParse()` at Supabase boundaries; remove `as Type` casts that appear before a `.parse()` call in the same function; parse nested arrays (e.g., `workout_exercises`) as part of the outer object, not separately.

2. **router.push() called during render, not in useEffect** — Move auth redirect into `useEffect(() => { if (!loading && !user) router.push('/auth/login') }, [user, loading, router])`; return a loading spinner (not null) while auth resolves; confirm no protected content is in the initial HTML payload.

3. **Middleware infinite redirect loop** — The middleware matcher must explicitly exclude `/auth/login`, `/auth/signup`, `/auth/callback`, `/_next/static`, `/_next/image`, `favicon.ico`; use `getUser()` (not `getSession()`) in middleware — getSession() reads from cookie cache and can be bypassed; keep profile-check redirect logic in layout, not middleware.

4. **CVE-2025-29927 — Next.js middleware auth bypass** — Verify `package.json` shows `next >= 15.2.3` before deploying middleware (project already runs 15.3.2, which is patched); never rely solely on middleware for authorization — RLS must back up every access-controlled table; consider stripping `x-middleware-subrequest` header at the reverse proxy level.

5. **Pagination changes query key shape, breaks mutation invalidation** — Plan pagination as a full vertical slice (hook + query key factory + all `invalidateQueries` callers + component); use a query key factory pattern (`workoutKeys.all`, `workoutKeys.list(page)`) so mutations can invalidate all paginated variants; prefer `useQuery` with `.range()` over `useInfiniteQuery` for simple list views — avoids the data shape change at the component layer.

---

## Implications for Roadmap

Based on the combined dependency map from FEATURES.md and ARCHITECTURE.md, the work naturally falls into four phases. The ordering is driven by: (a) infrastructure must be stable before type safety work, (b) hooks must be consistent before tests can be written, and (c) UX polish is independent and low-risk.

### Phase 1: Foundation — Critical Safety Fixes

**Rationale:** Every other fix is undermined if the database is accessible due to RLS gaps, the runtime crashes due to missing env vars, or the build fails because supabase-js is missing from production dependencies. These are one-line-to-small fixes with outsized production risk. Do these first so the baseline is safe.

**Delivers:** A production-safe baseline with no silent crashes, no auth race condition, no malformed URLs, and audited database access policies.

**Addresses (from FEATURES.md table stakes):**
- Move @supabase/supabase-js to dependencies
- Add env var startup validation in supabaseClient.ts
- Fix double-slash URL routing bug (`/dashboard//workouts/`)
- RLS policy audit on all tables including child tables
- Fix router.push() called during render in dashboard/layout.tsx
- Fix useMacros stale useEffect dependency array

**Avoids (from PITFALLS.md):**
- Pitfall 2 (router.push during render)
- CVE-2025-29927 pre-flight check (verify Next.js version before Phase 2 middleware work)
- Security mistake: non-null assertion on env vars

**Research flag:** Standard patterns, no research-phase needed.

---

### Phase 2: Type Safety — Harden Data Boundaries

**Rationale:** Once the infrastructure is stable, eliminate the class of bugs where Supabase schema drift produces silent wrong data or confusing crashes. This phase standardizes the hook pattern (all hooks on React Query) and ensures Zod validates every database response. It also installs the ESLint rule that would have caught the useMacros bug automatically going forward.

**Delivers:** Every Supabase response is validated at the hook boundary. All hooks use React Query. TypeScript types derive from Zod inferences, not `as` casts. ESLint enforces correct useEffect dependencies going forward.

**Addresses (from FEATURES.md differentiators + table stakes):**
- Remove unsafe `as WorkoutRow[]` pre-casts before Zod .parse() in workout hooks
- Expand Zod schemas to all tables (create habitSchema, weightSchema, macroSchema)
- Migrate useHabits to React Query (useQuery + useMutation)
- Migrate useMacros to React Query
- Configure QueryClient with explicit staleTime, gcTime, retry in providers.tsx (useState pattern, not module scope)
- Fix ProfileForm enum cast ordering (parse first, extract typed values from parse result)
- Add eslint-plugin-react-hooks with exhaustive-deps rule
- Add .env.example file

**Uses (from STACK.md):**
- supabase CLI type generation (`npx supabase gen types typescript`) for typed createClient<Database>()
- @hookform/resolvers for zodResolver bridge (needed for ProfileForm later; install now)

**Avoids (from PITFALLS.md):**
- Pitfall 1 (Zod .parse() crash on schema mismatch — .safeParse() everywhere)
- Anti-pattern 3 (module-scope QueryClient — must use useState inside Providers)
- Anti-pattern 2 (as Type casts on Supabase responses)

**Research flag:** Standard patterns. The Zod .safeParse() at hook boundary pattern is well-documented. No research-phase needed.

---

### Phase 3: Test Infrastructure + Quality

**Rationale:** Now that hooks are consistent (all React Query) and types are safe, tests can be written without fighting the inconsistencies. Vitest setup must precede test authorship. Migrate hooks first (Phase 2), then write tests — not the other way around. The UX fixes (ConfirmDialog, logError) are included here because they're additive with no upstream dependencies.

**Delivers:** Working test suite covering pure utilities and critical hooks. Structured logging in place as the foundation for future external logging services. Accessible delete confirmation replacing window.confirm(). Test infrastructure that prevents regressions during future refactoring.

**Addresses (from FEATURES.md):**
- Set up Vitest 4 + RTL + msw test infrastructure (vitest.config.mts, vitest.setup.ts, .env.test)
- Unit tests for calculateMacros utility (pure function, no mocking)
- Integration tests for useWorkouts hook (renderHook + mock Supabase client)
- Replace window.confirm() with ConfirmDialog component using @radix-ui/react-alert-dialog
- Add structured logError() / createLogger(context) utility in src/utils/logger.ts
- Add date utility in src/utils/dates.ts replacing all .toISOString().split('T')[0] calls

**Uses (from STACK.md):**
- vitest 4.x, @testing-library/react 16.x, @testing-library/user-event 14.x, msw 2.x
- @radix-ui/react-alert-dialog 1.x for ConfirmDialog
- date-fns 4.x + @date-fns/tz for formatLocalDate() utility

**Avoids (from PITFALLS.md):**
- Pitfall 6 (useHabits untestable — already migrated in Phase 2)
- Anti-pattern 4 (.toISOString().split('T')[0] — replaced with dates.ts utility)
- Anti-pattern 5 (error logging without context — createLogger captures full error + userId)
- Integration gotcha: Vitest + env vars — .env.test with placeholder values must exist

**Research flag:** Standard patterns for Vitest + RTL + msw with Next.js App Router. Next.js official docs were updated 2026-02-24 with current patterns. No research-phase needed.

---

### Phase 4: Deferred — Post-Audit Improvements (v1.x)

**Rationale:** These improvements have real value but require either significant scope (middleware auth restructuring), clear trigger conditions (pagination only matters with volume), or depend on Phase 3 being stable (ProfileForm migration builds on react-hook-form installed in Phase 2). Treat as the first v1.x milestone items.

**Delivers:** Auth protection moved to server-side middleware (eliminates client-side flash), paginated list views (handles data growth), form UX improvement with per-field validation feedback, loading skeletons for perceived performance.

**Items:**
- Next.js middleware auth guard via @supabase/ssr (middleware.ts + supabaseServer.ts)
- Pagination for useWorkoutLogs and useWorkouts (query key factory + .range() + UI page controls)
- ProfileForm migration to react-hook-form + zodResolver (replaces 8 useState fields)
- Loading skeleton components (Tailwind animate-pulse, mirroring final layout)
- Auth redirect tests (mock useUser; assert redirect when user === null)

**Avoids (from PITFALLS.md):**
- Pitfall 3 (middleware infinite redirect loop — matcher must exclude /auth/* routes)
- Pitfall 4 (pagination changes query key — full vertical slice, query key factory pattern)
- CVE-2025-29927 — verify Next.js >= 15.2.3 before deploying middleware (already at 15.3.2)

**Research flag:** Phase 4 middleware work benefits from a brief research-phase confirmation on @supabase/ssr middleware patterns — the official Supabase Next.js template is the reference but version-specific options have changed. Pagination is standard; no research needed.

---

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Infrastructure reliability (env vars, supabase-js in dependencies, RLS) must be confirmed before investing time in type safety improvements that all depend on the Supabase client and policies being correct.
- **Phase 2 before Phase 3:** Tests written against inconsistent hooks (useHabits as useState, useMacros as useState) require deep Supabase client mocking that is brittle and often wrong. Migrating hooks to React Query first means tests use renderHook + QueryClientWrapper — standard, resilient pattern.
- **Phase 3 before Phase 4:** The middleware auth work in Phase 4 adds a new server-side Supabase client. If the hook-level patterns are inconsistent, debugging auth middleware issues is harder. Stable hooks + tests = confidence that middleware changes don't break data flows.
- **UX polish (logError, ConfirmDialog, dates.ts) in Phase 3:** These are additive and independent. Grouping them with test infrastructure avoids a separate phase just for small changes.
- **Pagination deferred to Phase 4:** Pagination is a cross-cutting change (query key + invalidation + UI). The risk of doing it during an audit milestone — when the goal is stabilization, not feature expansion — outweighs the benefit of getting it done now.

### Research Flags

Phases needing deeper research during planning:
- **Phase 4 (middleware auth):** The @supabase/ssr middleware pattern has version-specific nuances (createServerClient cookie handling, matcher config). A brief research-phase confirmation against the current Supabase Next.js SSR docs is recommended before planning Phase 4 tasks.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1:** All fixes are direct code changes; patterns are documented in CONCERNS.md and official Supabase/Next.js docs.
- **Phase 2:** Zod .safeParse() at hook boundaries is a textbook anti-corruption layer pattern.
- **Phase 3:** Vitest 4 + RTL + msw stack for Next.js App Router has official documentation updated as recently as 2026-02-24.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core recommendations verified against official docs; supabase-js version regression confirmed via GitHub issue tracker; Vitest 4.0 confirmed via vitest.dev release blog |
| Features | HIGH | Derived from direct codebase inspection of CONCERNS.md and source files; no inference required for priority ordering |
| Architecture | HIGH | Patterns verified against Next.js official docs, Supabase official docs, and TkDodo (TanStack core team); build order follows dependency graph in CONCERNS.md |
| Pitfalls | HIGH | CVE-2025-29927 verified across multiple security sources (Datadog Security Labs, ProjectDiscovery); middleware redirect loop via official Next.js GitHub issue; other pitfalls from direct codebase analysis |

**Overall confidence:** HIGH

### Gaps to Address

- **RLS policy completeness (Phase 1):** Research confirms that child tables (workout_exercises, habit_logs, workout_log_exercises) are frequently missed in RLS audits. The current app's specific RLS configuration is unknown and must be manually audited in Supabase dashboard. Treat as a discovery task in Phase 1, not an assumption.

- **supabase gen types output shape (Phase 2):** The exact output of `npx supabase gen types typescript` for this project's schema is unknown until run. The type generation is standard, but there may be nullable fields or join shapes that require updating existing Zod schemas (particularly for `workout_exercises` nested selects). Expect some schema adjustments after type generation.

- **ProfileForm complexity (Phase 2 / Phase 4):** The enum cast ordering fix in Phase 2 is a small change. The full react-hook-form migration (deferred to Phase 4) is atomic — the form either uses useState or react-hook-form, partial migration creates more bugs. Confirm in planning whether Phase 2 only fixes the cast ordering or also pulls the full form migration forward.

- **useMacros React Query migration scope (Phase 2):** useMacros has a macro calculation dependency (calculateBMR, calculateTDEE) that runs inside the hook. When migrating to useQuery, the derived calculation should remain in the query function or be applied as a selector — confirm the migration scope doesn't split macro calculation into a separate derived state concern.

---

## Sources

### Primary (HIGH confidence)
- [Next.js Vitest setup guide (nextjs.org)](https://nextjs.org/docs/app/guides/testing/vitest) — Vitest 4 install pattern, vitest.config.mts, updated 2026-02-24
- [Supabase TypeScript support (supabase.com)](https://supabase.com/docs/reference/javascript/typescript-support) — createClient<Database>() pattern and type generation
- [Supabase gen types CLI (supabase.com)](https://supabase.com/docs/reference/cli/supabase-gen-types) — CLI command for type generation
- [Supabase Server-Side Auth for Next.js (supabase.com)](https://supabase.com/docs/guides/auth/server-side/nextjs) — getUser() vs getSession(), middleware pattern, updated 2026-02-25
- [CVE-2025-29927 — Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/) — Middleware bypass via x-middleware-subrequest header, CVSS 9.1
- [CVE-2025-29927 — ProjectDiscovery analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — Technical breakdown, affected versions
- [Vitest 4.0 release (vitest.dev)](https://vitest.dev/blog/vitest-4) — Confirmed stable release, version 4.0.18 current
- [supabase-js v2.50.4 type regression (github.com)](https://github.com/supabase/supabase-js/issues/1483) — Regression confirmed, v2.50.5 fix
- [react-hook-form releases (github.com)](https://github.com/react-hook-form/react-hook-form/releases) — v7.71.2 current stable; v8 in beta
- [TanStack Query v5 pagination docs](https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries) — .range() + useQuery pattern
- [TanStack Query v5 query invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation) — prefix matching behavior for paginated keys
- [Next.js Error Handling (nextjs.org)](https://nextjs.org/docs/app/getting-started/error-handling) — error.tsx segment boundaries
- [Zod v4 migration guide (zod.dev)](https://zod.dev/v4/changelog) — Breaking changes to .email() chaining; rationale for staying on v3
- [Radix UI Dialog (radix-ui.com)](https://www.radix-ui.com/primitives/docs/components/dialog) — WAI-ARIA Dialog, @radix-ui/react-dialog v1.1.15
- Direct codebase inspection: `/src/hooks/`, `/src/components/`, `/src/schemas/`, `/src/app/`, `.planning/codebase/CONCERNS.md`

### Secondary (MEDIUM confidence)
- [Testing React Query — TkDodo (tkdodo.eu)](https://tkdodo.eu/blog/testing-react-query) — QueryClient test wrapper pattern, retry: false, gcTime: 0
- [date-fns v4.0 timezone release (blog.date-fns.org)](https://blog.date-fns.org/v40-with-time-zone-support/) — TZDate and @date-fns/tz first-class timezone
- [Supabase RLS misconfigurations (designrevision.com)](https://designrevision.com/blog/supabase-row-level-security) — 83% of exposed databases involve RLS misconfiguration; cites Lovable incident
- [Makerkit production patterns (catjam.fi)](https://catjam.fi/articles/next-supabase-what-do-differently) — Production retrospective on Next.js + Supabase
- [Testing Supabase with RTL and MSW (nygaard.dev)](https://nygaard.dev/blog/testing-supabase-rtl-msw) — MSW interception pattern for Supabase REST calls
- [Zod + React Query DTO pattern (joshkaramuth.com)](https://joshkaramuth.com/blog/tanstack-zod-dto/) — Anti-corruption layer via Zod in queryFn
- [@hookform/resolvers npm](https://www.npmjs.com/package/@hookform/resolvers) — v5.2.2 current, Zod v3+v4 auto-detection

---

*Research completed: 2026-02-26*
*Ready for roadmap: yes*
