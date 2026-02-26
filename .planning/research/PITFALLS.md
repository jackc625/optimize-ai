# Pitfalls Research

**Domain:** Next.js 15 + Supabase production app hardening (audit milestone)
**Researched:** 2026-02-26
**Confidence:** HIGH (primary findings from official docs and direct codebase analysis; supplemented by verified community sources)

---

## Critical Pitfalls

### Pitfall 1: Zod `.parse()` Throws on Schema Mismatch — Crashing Hooks Silently

**What goes wrong:**
`WorkoutTemplateSchema.parse()` and similar calls currently use the throwing variant of Zod validation inside React Query `queryFn` handlers. When the Supabase response shape doesn't match the schema (e.g., a null field where a string is expected, or a new DB column not yet in the schema), `parse()` throws a `ZodError` that propagates up as a query error. The UI enters error state with no actionable message. The `useWorkoutLogs.ts` and `useWorkouts.ts` hooks also cast inner arrays using `as ExerciseTemplate[]` *before* Zod validates them, meaning nested type violations go silently unchecked.

**Why it happens:**
The `as WorkoutRow[]` and `as ExerciseTemplate[]` casts bypass TypeScript's type system at runtime. Developers use `.parse()` for the final object but pre-cast the nested arrays, defeating the purpose. The assumption is that Supabase always returns the shape defined in `.select()` — which is true for column names but not for value types, nullability, or relational joins.

**How to avoid:**
- Replace `.parse()` with `.safeParse()` at all Supabase fetch boundaries. On failure, log the full `ZodError` with operation context and throw a human-readable `Error`.
- Remove all `as Type` casts inside `queryFn` bodies. Let Zod parse the raw `data` object; derive TypeScript types from `z.infer<typeof Schema>`.
- For nested arrays (e.g., `workout_exercises`), parse the full object including the nested array in one `.safeParse()` call — do not cast sub-arrays separately before the outer parse.

**Warning signs:**
- Any `as` cast appearing *before* a `.parse()` call in the same function
- Query error states that show a generic error instead of a validation message
- TypeScript compiling but runtime throwing `ZodError: Expected string, received undefined`

**Phase to address:** Type Safety phase (first priority — gating item for all other hooks)

---

### Pitfall 2: `router.push()` Called During Render (Not in Effect) — Flicker and Race Conditions

**What goes wrong:**
In `dashboard/layout.tsx` (line 53), `router.push("/auth/login")` is called synchronously during the render function body (`if (!user) { router.push("/auth/login"); return null; }`). In Next.js 15's App Router, calling `router.push()` during render is undefined behavior — it fires on every render cycle until React commits, potentially double-firing and conflicting with the concurrent renderer.

**Why it happens:**
This pattern was common in Pages Router where the render cycle was simpler. In App Router with React 19's concurrent features, renders can be interrupted and retried. Developers port the old pattern without realizing it breaks the concurrency model.

**How to avoid:**
- Move all `router.push()` calls into `useEffect()` with explicit dependency arrays.
- The canonical App Router pattern for auth guards is: `useEffect(() => { if (!userLoading && !user) router.push('/auth/login'); }, [user, userLoading, router])`.
- Do NOT return `null` while calling `router.push()` in the same branch — return a loading spinner instead, let the effect handle navigation.

**Warning signs:**
- Navigation fires twice or flickers briefly showing the protected page before redirecting
- Browser console warning about state updates during render
- The guarded component momentarily renders with null/empty data before redirect completes

**Phase to address:** Authentication hardening phase

---

### Pitfall 3: Middleware Auth Guard Without Excluding Public Routes — Infinite Redirect Loop

**What goes wrong:**
When migrating from `useEffect`-based auth guards to Next.js middleware, developers commonly forget to exclude the login page and auth callback routes from the middleware matcher. The result: unauthenticated user hits `/auth/login` → middleware sees no session → redirects to `/auth/login` → repeat. This causes a browser "too many redirects" error.

A secondary issue specific to this codebase: if middleware is added without excluding `/dashboard/profile/setup`, users without a profile who are already authenticated will loop between the auth middleware (passes them through as authenticated) and the layout's profile check (redirects to setup), and then setup might trigger auth middleware in an unexpected order.

**Why it happens:**
The middleware `matcher` config requires explicit exclusion patterns. Developers copy the basic pattern from docs without thinking through all public paths. The Supabase-recommended middleware also has a critical security distinction: `getSession()` must never be used in server middleware — only `getClaims()` (or `getUser()` for older SDK versions) performs actual JWT cryptographic verification. Using `getSession()` in middleware means auth can be spoofed.

**How to avoid:**
- Matcher must explicitly allow: `/auth/login`, `/auth/signup`, `/auth/callback`, `/_next/static`, `/_next/image`, `/favicon.ico`.
- Use the pattern: `matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/).*)']`
- Use `supabase.auth.getClaims()` (Supabase SSR) or `supabase.auth.getUser()` (client SDK) in middleware — never `getSession()` which reads from cache and can be bypassed.
- Separately track the profile-check redirect logic — it belongs in the layout effect, not middleware.

**Warning signs:**
- Browser showing "ERR_TOO_MANY_REDIRECTS"
- Network tab showing alternating 302 responses to the same URL
- Users unable to reach the login page at all

**Phase to address:** Authentication hardening phase

---

### Pitfall 4: Adding Pagination Changes the Query Key — Breaks Existing Cache and Invalidation Logic

**What goes wrong:**
Currently all list hooks use flat query keys: `["workouts"]`, `["habits"]`. Adding pagination requires including the page number or cursor in the key: `["workouts", { page: 1 }]`. This is a **breaking change** to all `invalidateQueries` calls in mutation hooks. The existing `qc.invalidateQueries({ queryKey: ["workouts"] })` in `useCreateWorkout`, `useUpdateWorkout`, and `useDeleteWorkout` will still work with prefix matching (TanStack Query's default), but only if `exact: false` (which is the default). However, if `exact: true` is passed anywhere, or if pages accumulate as separate cache entries, mutations won't clear stale paginated data properly.

The secondary failure: switching from `useQuery` to `useInfiniteQuery` for cursor-based pagination is a hook API change — they are not interchangeable. Components consuming the hook receive a different data shape (`data.pages[]` array vs. flat `data` array), requiring UI changes. Developers underestimate this scope.

**Why it happens:**
Pagination looks like a "hook-only" change when it's actually a cross-cutting change: query key structure, invalidation logic, and component data consumption all change simultaneously.

**How to avoid:**
- Plan pagination migration as a full vertical slice: hook + query key + all mutation `invalidateQueries` calls + component.
- Prefer offset pagination with `useQuery` (not `useInfiniteQuery`) for this app's simple list views — it avoids the data shape change at the component layer.
- Use a query key factory pattern: `workoutKeys = { all: ['workouts'], list: (page: number) => ['workouts', 'list', page] }` so mutations can invalidate `workoutKeys.all` and all paginated variants are swept.
- Verify invalidation works after adding pagination with a manual test: create a workout, confirm page 1 refetches.

**Warning signs:**
- After adding a new record, the list doesn't show it until manual page refresh
- Deleting a record shows it as still present on the current page
- TypeScript errors in components after switching hook implementations

**Phase to address:** Performance phase (pagination)

---

### Pitfall 5: CVE-2025-29927 — Next.js Middleware Auth Bypass

**What goes wrong:**
If middleware-based auth is added without upgrading Next.js to a patched version, the app is vulnerable to CVE-2025-29927. An attacker sends any request with the header `x-middleware-subrequest` set to a specific value. Next.js interprets this as an internal subrequest and skips middleware entirely, bypassing all auth protection. CVSS score 9.1 (critical). Affected versions: all Next.js before 15.2.3.

**Why it happens:**
The header `x-middleware-subrequest` was designed to prevent infinite middleware recursion. The vulnerability is that Next.js didn't validate that this header could only come from internal requests — it accepted it from any HTTP client.

**How to avoid:**
- Upgrade Next.js to 15.2.3 or later before deploying middleware-based auth.
- Current version in this project (15.3.2) is patched — verify this before implementing middleware.
- As defense-in-depth: configure reverse proxy (Cloudflare, nginx, load balancer) to strip the `x-middleware-subrequest` header from all incoming requests.
- Never rely solely on middleware for authorization — enforce Supabase RLS policies on every table as the true security layer.

**Warning signs:**
- Running Next.js 15.2.2 or earlier with middleware-based auth protection
- No RLS policies backing up the middleware checks

**Phase to address:** Authentication hardening phase (verify version before adding middleware)

---

### Pitfall 6: `useHabits` Uses `useEffect` + Manual State — Cannot Be Tested with Vitest

**What goes wrong:**
`useHabits.ts` uses manual `useState` + `useEffect` + direct Supabase calls instead of React Query. This pattern requires mocking the Supabase client module directly in tests. The Supabase client is a complex object with chained builder methods (`.from().select().in().eq()`), and mocking it requires either: (a) `vi.mock('@/lib/supabaseClient')` with a deep mock of the query builder chain, or (b) spinning up a local Supabase instance. Option (a) is brittle and often wrong; option (b) requires significant infrastructure setup.

**Why it happens:**
Manual `useEffect` data-fetching was written before React Query was adopted for the workouts hooks. The inconsistency means two testing patterns are needed.

**How to avoid:**
- Migrate `useHabits` to React Query (`useQuery`) as part of the audit before writing tests.
- Once on React Query, test via `renderHook` with a `QueryClientWrapper` — no need to mock Supabase directly for most unit tests.
- For integration tests that do hit Supabase, use MSW (Mock Service Worker) to intercept `fetch` calls at the network layer — more realistic and less brittle than mocking the client module.

**Warning signs:**
- Test file requires 20+ lines of Supabase mock setup before the test body
- Changing the query in the hook requires updating the mock chain
- Tests pass but don't actually verify the data transformation logic

**Phase to address:** Test infrastructure phase (setup must handle both patterns, but migrating hooks first simplifies testing)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `as WorkoutRow[]` cast instead of Zod parse | Avoids writing parse boilerplate | Runtime crash when DB schema drifts from TypeScript types; silent bugs | Never — Zod schemas already exist; the boilerplate is a one-liner |
| `useEffect` + `useState` for data fetching (useHabits pattern) | Simpler to write initially | Untestable without deep mocks; stale data bugs; no automatic refetch on mount | Never in a React Query codebase — inconsistency means two patterns to maintain |
| Empty `useEffect` dependency array `[]` with data fetching inside | Runs once on mount | Stale data if user switches accounts or component re-mounts; `exhaustive-deps` lint error | Only for truly one-time setup (e.g., global event listeners), not data fetching |
| `window.confirm()` for delete confirmation | Zero implementation cost | Not accessible (violates WCAG); can't be styled; blocking in some browsers | Never in production — replace with modal |
| `process.env.NEXT_PUBLIC_SUPABASE_URL!` non-null assertion | Silences TS error | Runtime crash with `createClient(undefined, undefined)` produces confusing Supabase errors, not an `env var missing` error | Never — add validation that gives a clear error message at startup |
| Streak calculation in JavaScript (useHabits) | No DB changes needed | O(n×m) — slows with growth; re-runs on every render of hooks consumers | Acceptable now (<100 habits); revisit if habits per user exceeds 50 |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase nested select | Assuming `workout_exercises` is always an array — it can be `null` if the join returns nothing | Cast to `ExerciseRow[] \| null` and default to `[]` before passing to Zod |
| Supabase + Zod | Using `z.string().uuid()` for IDs from Supabase — Supabase generates UUIDs v4, which pass; but if a row is created with a non-UUID id in tests, Zod throws | Use `z.string().uuid().optional()` for insert returns where id may not be included in response |
| React Query + Supabase auth | Calling Supabase in `queryFn` when user is not yet loaded — query fires before auth session is established | Always include `enabled: !!user` in queries that require authentication |
| Vitest + Next.js App Router | Importing from `next/headers` or `next/navigation` in tests causes module resolution errors — these are server-only | Mock `next/navigation` with `vi.mock('next/navigation', ...)` in `vitest.setup.ts`; never import server-only modules in client component tests |
| Vitest + Supabase env vars | Tests fail with "supabaseUrl is required" because `.env.local` is not loaded by Vitest | Create `.env.test` with test-safe placeholder values; Vitest loads `.env.test` automatically |
| Supabase `getSession()` in middleware | Returns cached session — does not perform JWT verification | Use `getUser()` (client SDK) or `getClaims()` (@supabase/ssr) which verify the JWT signature every call |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded `.select()` on `workout_logs` | Page load slows; browser memory climbs; Supabase returns 1000+ rows | Add `.range(0, 49)` and paginate; filter by date range | ~200+ log entries per user |
| Habit streak calculated in JS across all logs | Dashboard sluggish; streak occasionally shows wrong value | Store streak in DB or cache in React Query; calculate incrementally not from full history | ~50+ habits with 365+ logs each |
| `QueryClient` with default `staleTime: 0` | Every navigation triggers a refetch; Supabase gets hammered with duplicate reads | Set explicit `staleTime: 5 * 60 * 1000` for user data that changes rarely | Noticeable immediately on page transitions |
| No `enabled` guard on authenticated queries | Queries fire before session loads, causing 401/403 errors that React Query retries 3 times | `enabled: !!user` on all user-scoped queries | Every page load |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Middleware-only auth (no RLS) | CVE-2025-29927 lets attackers bypass middleware entirely; any table data is accessible via Supabase client | Treat RLS as the security layer; middleware is a UX layer only |
| RLS policy on reads only | Writes bypass per-row ownership check; one user can mutate another's data | Add `auth.uid() = user_id` to INSERT/UPDATE/DELETE policies on every user-owned table |
| `!` non-null assertion on env vars | App starts with `undefined` Supabase URL; produces misleading "network error" instead of "missing config" | Validate at module load time: `if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')` |
| Relying solely on client-side `useUser()` for auth guard | Component renders briefly before redirect fires; SSR returns unprotected HTML | Supplement with middleware session check; SSR-render a loading state instead of real data until auth confirmed |
| `supabase` client created once in module scope | Fine for client components; dangerous if imported in server components — cookies not wired up | Never use the simple `createClient(url, key)` in server components; use `@supabase/ssr` with cookie handling |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Auth redirect during render (no loading state) | Flash of protected content before redirect; confusing on slow connections | Show spinner while auth loading; redirect only after `userLoading === false && !user` |
| `window.confirm()` for delete | Blocks the browser UI thread; no ability to undo; users accidentally click confirm | Modal dialog with "Delete" and "Cancel" buttons; consider soft-delete with undo toast |
| Profile name falls back to "User" silently | User doesn't know their profile failed to load; thinks their name is wrong | Show explicit "Profile not found" state with a link to setup |
| Entire list refetches on any mutation | After marking a habit complete, all habits re-render with loading state | Use React Query optimistic updates to update cache before the server confirms |
| No skeleton loaders | Page shows blank white space or generic "Loading..." text | Use Tailwind `animate-pulse` skeleton components matching the final layout dimensions |

---

## "Looks Done But Isn't" Checklist

- [ ] **Zod validation:** Schemas defined in `/schemas/` — but only `workoutSchema.ts` is applied at fetch time. `profileSchema.ts`, macro schema, and weight schema have no parse calls in their respective hooks — verify each hook applies `.safeParse()` to query results, not just form inputs.
- [ ] **Auth guard:** `dashboard/layout.tsx` checks `!user` — but only after client hydration. Server-rendered HTML has no auth check. Verify no sensitive data appears in the initial HTML payload before auth resolves.
- [ ] **RLS policies:** Supabase dashboard shows RLS enabled — but "enabled" doesn't mean policies are correct. Verify each table has `auth.uid() = user_id` on SELECT, INSERT, UPDATE, DELETE separately. Check `workout_exercises` and `habit_logs` (child tables) also have RLS — they're often missed.
- [ ] **Pagination:** Adding `.range(0, 49)` to a query — but also verify the UI shows a "load more" or page control. Silently truncating at 50 with no indication confuses users with more data.
- [ ] **Vitest setup:** Test file created and passes — but verify the QueryClient wrapper is configured with `retry: false` in tests (default 3 retries makes failures slow to surface).
- [ ] **Environment validation:** `.env.example` created — but verify the actual startup validation throws a clear error, not just a TypeScript type error that's silenced at runtime.
- [ ] **Middleware version:** Next.js middleware added — but verify `package.json` shows `next >= 15.2.3` before the middleware is deployed (CVE-2025-29927).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Zod `.parse()` crash in production | MEDIUM | Add `.safeParse()` wrapper to affected hook; deploy hotfix; check Supabase logs for shape mismatch |
| Infinite redirect loop from middleware | HIGH | Revert middleware matcher to exclude login path; redeploy; add explicit public path list to matcher |
| Pagination breaks mutation invalidation | LOW | Add `exact: false` to all `invalidateQueries` calls (it's the default, confirm it wasn't overridden); switch to query key factory |
| Tests fail because Supabase client not mocked | LOW | Add `vi.mock('@/lib/supabaseClient', ...)` to vitest setup; or migrate hook to React Query so mock isn't needed |
| Stale data after auth change | MEDIUM | Call `queryClient.clear()` on logout to purge all cached data; this is a one-line fix but easy to miss |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Zod `.parse()` crash on schema mismatch | Type Safety phase | All hooks use `.safeParse()`; no bare `as` casts in `queryFn` bodies |
| `router.push()` during render | Auth hardening phase | ESLint no-render-side-effects passes; no `router.push` outside `useEffect` or event handlers |
| Middleware infinite redirect loop | Auth hardening phase | QA test: visit `/auth/login` unauthenticated — no redirect loop; visit `/dashboard` unauthenticated — redirected to login |
| Pagination breaks invalidation | Performance phase | After create/delete mutation, list refreshes to show correct data on current page |
| CVE-2025-29927 middleware bypass | Auth hardening phase (pre-flight) | `package.json` shows `next >= 15.2.3`; confirmed before middleware is deployed |
| `useHabits` untestable due to manual state | Test infrastructure phase | `useHabits` migrated to React Query OR test uses MSW to intercept network calls |
| Supabase env var non-null assertion | Configuration phase | App throws `Error: NEXT_PUBLIC_SUPABASE_URL is not set` on startup with missing vars — not a silent undefined |
| RLS child table gaps | Security audit phase | Manual Supabase dashboard check: `habit_logs`, `workout_exercises`, `workout_log_exercises` all have user-scoped RLS on all operations |

---

## Sources

- [Next.js official Vitest setup guide](https://nextjs.org/docs/app/guides/testing/vitest) — HIGH confidence (official docs, fetched 2026-02-24)
- [CVE-2025-29927 — Next.js Middleware Authorization Bypass (Datadog Security Labs)](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/) — HIGH confidence (verified across multiple security sources)
- [CVE-2025-29927 — ProjectDiscovery technical analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass) — HIGH confidence
- [Next.js Supabase SSR auth setup guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence (official Supabase docs, fetched 2026-02-26)
- [TanStack Query v5 pagination docs](https://tanstack.com/query/v5/docs/framework/react/guides/paginated-queries) — HIGH confidence (official docs)
- [TanStack Query v5 query invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation) — HIGH confidence (official docs)
- [Next.js + Supabase production lessons (catjam.fi)](https://catjam.fi/articles/next-supabase-what-do-differently) — MEDIUM confidence (practitioner post, aligns with official recommendations)
- [Zod safeParse vs parse — official Zod docs](https://zod.dev/basics) — HIGH confidence
- [Testing Supabase with React Testing Library and MSW (nygaard.dev)](https://nygaard.dev/blog/testing-supabase-rtl-msw) — MEDIUM confidence (community, aligns with testing patterns)
- [Next.js GitHub issue #62547 — middleware redirect infinite loop](https://github.com/vercel/next.js/issues/62547) — HIGH confidence (official Next.js issue tracker)
- Codebase direct analysis (useHabits.ts, useWorkouts.ts, dashboard/layout.tsx, supabaseClient.ts) — HIGH confidence (primary source)

---

*Pitfalls research for: Next.js 15 + Supabase app hardening/audit milestone*
*Researched: 2026-02-26*
