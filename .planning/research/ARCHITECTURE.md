# Architecture Research

**Domain:** Next.js 15 App Router + React Query + Supabase — production audit and hardening
**Researched:** 2026-02-26
**Confidence:** HIGH (primary sources: Next.js official docs, Supabase official docs, TkDodo React Query blog, verified patterns)

---

## Standard Architecture

### System Overview

The existing system is a layered client-rendered SPA with direct Supabase access from hooks. The audit introduces hardening at the boundaries between layers without restructuring the layers themselves.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS MIDDLEWARE (NEW)                        │
│  middleware.ts — token refresh, unauthenticated redirect            │
│  Runs before every non-static request                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                       PAGES / LAYOUTS                               │
│  src/app/dashboard/layout.tsx  — secondary profile check (guard)    │
│  src/app/dashboard/**/*.tsx    — page-level data orchestration      │
│  src/app/auth/**/*.tsx         — login / signup flows               │
│  Error boundaries via error.tsx files at route segments             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         COMPONENTS                                  │
│  UI primitives: Button, Card, Dialog, Skeleton                      │
│  Domain components: MacroSummary, WeightChart, ProfileForm          │
│  Error boundaries wrapped around data-heavy domain components       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                      HOOKS (BOUNDARY LAYER)                         │
│  React Query hooks: useWorkouts, useWorkoutLogs, useWeightLogs      │
│  Non-RQ hooks: useHabits, useMacros, useUser                        │
│  ZOD PARSE HAPPENS HERE — before data reaches components            │
│  Structured error logging happens here                              │
│  Pagination (range/cursor) applied to list queries here             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                           UTILS                                     │
│  Pure functions: calculateBMR, calculateTDEE, getMacroSplit         │
│  Date utilities: formatLocalDate (replacing toISOString().split)    │
│  Error utilities: createLogger(context) → structured console.error  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    INFRASTRUCTURE / LIB                             │
│  src/lib/supabaseClient.ts — validated env vars, single client      │
│  src/lib/supabaseServer.ts  — SSR client for middleware (new)       │
│  src/schemas/              — Zod schemas for all DB shapes           │
│  src/types/database.ts     — TypeScript interfaces (unchanged)      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  SUPABASE (remote)  │
                    │  Auth, PostgREST    │
                    │  RLS enforced       │
                    └─────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Fix Integration Point |
|-----------|----------------|-------------------|----------------------|
| `middleware.ts` | Token refresh, unauthenticated redirect | Supabase SSR client, Next.js request/response | NEW — primary auth gate |
| `DashboardLayout` | Secondary auth check, profile existence check, nav | `useUser()`, Supabase client, router | Keep useEffect guard as fallback only |
| Page components | Route-level data orchestration, loading states | Hooks, child components | Add Suspense + error.tsx boundaries |
| Domain components | Render data, handle user interactions | Hooks (via props or direct call) | Zod errors surface via React Query error state |
| Hooks (React Query) | Data fetching, caching, Zod parse, structured log | Supabase client, Zod schemas | PRIMARY validation + logging boundary |
| Hooks (non-RQ: useMacros, useHabits) | Data fetching with useState/useEffect | Supabase client | Migrate to React Query to gain consistent error/loading |
| Utils | Pure calculations, date formatting, logging | Nothing (pure) | Add `formatLocalDate()`, `createLogger()` here |
| `src/lib/supabaseClient.ts` | Single Supabase instance | Supabase JS | Add env var validation with early throw |
| Zod schemas | Runtime validation of all DB responses | Used by hooks | Expand coverage to all tables (not just workouts) |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — global providers, toast
│   ├── providers.tsx               # QueryClient with staleTime/gcTime config
│   ├── error.tsx                   # Root error boundary (global-error.tsx for layout errors)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── dashboard/
│       ├── layout.tsx              # Auth guard (fallback) + nav
│       ├── error.tsx               # Dashboard-segment error boundary (NEW)
│       ├── page.tsx
│       ├── habits/
│       │   ├── page.tsx
│       │   └── error.tsx           # Habits segment error boundary (NEW)
│       ├── workouts/
│       │   ├── page.tsx
│       │   └── error.tsx           # Workouts segment error boundary (NEW)
│       ├── weight/page.tsx
│       └── macros/
│           └── history/page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx              # NEW — replaces window.confirm()
│   │   └── Skeleton.tsx            # NEW — loading placeholder components
│   └── [domain]/                   # domain-scoped components unchanged
├── hooks/
│   ├── profile/useUser.ts
│   ├── macros/useMacros.ts         # Migrate to React Query
│   ├── habits/useHabits.ts         # Migrate to React Query
│   ├── weight/useWeightLogs.ts
│   └── workouts/
│       ├── useWorkouts.ts          # Add pagination (range), Zod on all results
│       └── useWorkoutLogs.ts       # Add pagination, Zod on all results
├── schemas/
│   ├── workoutSchema.ts            # Existing — keep
│   ├── habitSchema.ts              # NEW — Zod for habit + habit_log
│   ├── weightSchema.ts             # NEW — Zod for weight_log
│   ├── macroSchema.ts              # NEW — Zod for user_macros
│   └── profileSchema.ts            # Existing (already present)
├── types/database.ts               # TypeScript interfaces — unchanged
├── utils/
│   ├── macros/                     # Existing calculations — unchanged
│   ├── dates.ts                    # NEW — formatLocalDate(), localToday()
│   └── logger.ts                   # NEW — createLogger(context) structured logging
└── lib/
    ├── supabaseClient.ts           # Add env var validation
    └── supabaseServer.ts           # NEW — @supabase/ssr server client for middleware
middleware.ts                       # NEW — Supabase token refresh + auth redirect
```

### Structure Rationale

- **schemas/ expanded:** Zod schemas exist only for workouts today. Expanding to all tables gives consistent runtime validation at every hook boundary. Co-locating schemas with domain logic (not types) reflects their role as parsing code, not just type definitions.
- **utils/dates.ts:** Centralizes all date handling in one place. Every file doing `.toISOString().split('T')[0]` imports from here, eliminating drift.
- **utils/logger.ts:** A single `createLogger(context)` factory means all structured error logs flow through one place — easy to swap to a real logging service later.
- **middleware.ts at root:** The official Supabase + Next.js SSR pattern puts auth token refresh here. This eliminates the primary auth race condition (useEffect fires after render; middleware fires before the request reaches the page).

---

## Architectural Patterns

### Pattern 1: Zod Parse at Hook Boundary (Anti-Corruption Layer)

**What:** Every Supabase query result is parsed with `.parse()` or `.safeParse()` inside the `queryFn`, before the data is returned to components. Components receive typed, validated data or nothing.

**When to use:** All hooks that call Supabase and return data to components. No exceptions.

**Trade-offs:** Adds schema definitions upfront; crashes fast on schema mismatch rather than silently producing wrong UI. Worth it — the alternative is silent data corruption.

**Example:**
```typescript
// src/hooks/habits/useHabits.ts (after hardening)
import { HabitSchema } from "@/schemas/habitSchema";

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id, title, created_at")
        .order("created_at")
        .range(0, 49); // Pagination added here
      if (error) throw error;
      // Parse replaces unsafe `as` cast — throws with clear message if shape wrong
      return z.array(HabitSchema).parse(data ?? []);
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

### Pattern 2: Middleware-First Auth, Layout as Fallback

**What:** `middleware.ts` handles the primary auth check using `@supabase/ssr` and `supabase.auth.getUser()`. `DashboardLayout` retains its `useEffect` check as a client-side fallback only (defense in depth). The layout guard should NOT be the primary protection.

**When to use:** All `/dashboard/*` routes.

**Trade-offs:** Requires adding `@supabase/ssr` and a server-side Supabase client. Token refresh happens in middleware, not client. The complexity cost is low — the official Supabase template is a direct copy.

**Example:**
```typescript
// middleware.ts (new file at project root)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  // MUST use getUser(), not getSession() — getSession() does not re-validate JWT
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg)$).*)"],
};
```

**Critical note (MEDIUM confidence, from official Supabase docs):** `getSession()` must NOT be trusted in middleware — it reads from the cookie without revalidating the JWT. Only `getUser()` sends a server-side validation request and is safe for auth gating.

### Pattern 3: Offset Pagination via `.range()` on List Hooks

**What:** Add `.range(offset, offset + pageSize - 1)` to all unbounded Supabase list queries. For the current scale (personal fitness app, likely <1000 records per user), offset pagination is correct. Cursor pagination is warranted only when records exceed 100K or order is time-sensitive with real-time inserts.

**When to use:** `useWorkouts`, `useWorkoutLogs`, `useHabits`, `useWeightLogs`. All list queries without a natural hard limit.

**Trade-offs:** Offset pagination has a known issue at scale (page N shifts when rows are inserted before it), but for a single-user dataset this is irrelevant. `useInfiniteQuery` adds complexity; prefer simple page-based pagination in UI unless infinite scroll is explicitly required.

**Example (offset pagination with React Query):**
```typescript
export function useWorkouts(page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ["workouts", page],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("workouts")
        .select("id, user_id, name, created_at, workout_exercises(*)")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return z.array(WorkoutTemplateSchema).parse(
        (data ?? []).map((row) => ({
          ...row,
          exercises: row.workout_exercises,
        }))
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

### Pattern 4: Segment-Level Error Boundaries via error.tsx

**What:** Place `error.tsx` files at the `/dashboard` segment and at high-risk feature segments (`/dashboard/workouts/error.tsx`, `/dashboard/habits/error.tsx`). Use React Query's `throwOnError` for server-side errors (5xx) to escalate to these boundaries. Client validation errors (form input) stay local to components via toast.

**When to use:** Any route segment where a data fetch failure should not bring down the whole dashboard.

**Trade-offs:** `error.tsx` boundaries cannot catch layout errors — those require a parent segment's `error.tsx` or `global-error.tsx`. The layout.tsx auth guard sits above all `error.tsx` files; auth errors are handled by the middleware/layout guard, not error boundaries.

**Example:**
```typescript
// src/app/dashboard/workouts/error.tsx
"use client";
import { useEffect } from "react";

export default function WorkoutsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to structured logger
    console.error("[workouts] segment error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="p-6 text-center">
      <p className="text-destructive">Failed to load workouts.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Pattern 5: Structured Error Logging via Logger Utility

**What:** A `createLogger(context: string)` factory in `src/utils/logger.ts` returns a structured logger bound to a domain context. All hooks and pages use this instead of bare `console.error(err.message)`.

**When to use:** Replace every `console.error("...", err.message)` in hooks and layouts with `logger.error("operation failed", { error, userId })`.

**Trade-offs:** Negligible — this is a pure additive change. Structured logs are indexable when a real logging service is added later (Sentry, Datadog, etc.).

**Example:**
```typescript
// src/utils/logger.ts
export function createLogger(context: string) {
  return {
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(`[${context}] ${message}`, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(`[${context}] ${message}`, data);
    },
  };
}

// Usage in a hook:
const logger = createLogger("useHabits");
// ...
logger.error("fetchAll failed", { error: err, userId: user?.id });
```

### Pattern 6: Test File Co-location

**What:** Place test files adjacent to the file they test — `useWorkouts.test.ts` next to `useWorkouts.ts`. Use `__tests__/` only for integration tests that span multiple files. This is the pattern Next.js official docs allow, and it keeps tests discoverable.

**When to use:** Unit tests for hooks and utils. Integration tests in `__tests__/` at the relevant route level.

**Trade-offs:** Slightly more noisy directory listing; compensated by immediate discoverability.

**Hook test structure:**
```typescript
// src/hooks/workouts/useWorkouts.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWorkouts } from "./useWorkouts";

// Mock supabase — vi.mock must be at module level
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // CRITICAL: disable retry in tests
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

test("useWorkouts returns empty array when no workouts exist", async () => {
  const { result } = renderHook(() => useWorkouts(), { wrapper: createWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual([]);
});
```

---

## Data Flow

### Request Flow (Hardened)

```
[User navigates to /dashboard/workouts]
    ↓
[middleware.ts]
    → getUser() validates JWT with Supabase Auth server
    → If no user: redirect to /auth/login
    → If user: refresh cookie, pass to page
    ↓
[DashboardLayout (client)]
    → useUser() subscribes to auth state (fallback guard)
    → If loading: show spinner
    → If no user: router.push("/auth/login")
    → If no profile: router.push("/dashboard/profile/setup")
    ↓
[WorkoutsPage]
    → Renders inside error.tsx boundary
    → Calls useWorkouts(page, pageSize)
    ↓
[useWorkouts hook]
    → supabase.from("workouts").select(...).range(from, to)
    → Supabase applies RLS: filters to auth.uid() rows only
    → z.array(WorkoutTemplateSchema).parse(data) — throws if shape wrong
    → React Query caches result under ["workouts", page]
    ↓
[WorkoutsPage re-renders with validated data]
    → isLoading: show <WorkoutsSkeleton />
    → isError: escalates to error.tsx boundary (if throwOnError)
    → data: render workout list
```

### State Management (Existing + Hardened)

```
[Supabase Auth]
    → onAuthStateChange subscription in useUser()
    → user state propagated to all components via hook

[React Query Cache]
    → Server state: workouts, weightLogs, habits, macros
    → Invalidated on mutation success
    → staleTime: 5 min (workouts), adjust per domain

[Component State (useState)]
    → Form fields, modal open/close, editing flags
    → NOT for server data — that lives in React Query

[URL State]
    → Page number for pagination (query param)
    → Workout ID from URL params (already done)
```

### Key Data Flows After Hardening

1. **Auth flow:** Middleware validates JWT on every request → DashboardLayout is a secondary client-side guard, not primary protection.

2. **Validation flow:** Supabase returns raw data → hook's `queryFn` runs Zod `.parse()` → typed data OR error state reaches component → component never handles raw/untyped Supabase response.

3. **Error escalation flow:** Hook throws on parse failure or Supabase error → React Query puts query in error state → `throwOnError: true` for server errors re-throws into React's error boundary tree → nearest `error.tsx` catches and renders fallback.

4. **Pagination flow:** Page component holds current page in state or URL param → passes to hook → hook computes `.range(from, to)` → React Query caches per-page under `["workouts", page]`.

5. **Logging flow:** Error in hook → `logger.error(message, { error, userId })` → structured JSON object to console → future: replace console with external service.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1K users | Current architecture is fine — no shared state, full RLS isolation |
| 1K-10K users | Supabase connection pooling via pgBouncer (already provided); add React Query staleTime tuning to reduce refetch frequency |
| 10K-100K users | Introduce API route layer (Next.js route handlers) to batch requests; consider Supabase Edge Functions for streak calculation |
| 100K+ users | Move streak calculation server-side (DB trigger or materialized column); implement cursor pagination instead of offset |

### Scaling Priorities

1. **First bottleneck:** Unbounded list queries. Solved in this audit with `.range()` pagination.
2. **Second bottleneck:** In-memory streak calculation runs on every fetch for every habit. At scale, move to a DB-computed column updated by trigger.

---

## Anti-Patterns

### Anti-Pattern 1: Auth Guard in useEffect Only

**What people do:** Check `if (!user) router.push("/login")` inside a `useEffect` in the layout or page component.

**Why it's wrong:** `useEffect` fires after the component mounts and renders. There is a frame — sometimes several frames — where the protected page renders with no user, potentially flashing protected content or making unauthorized Supabase calls before the redirect fires. This is the current state of `DashboardLayout`.

**Do this instead:** Add `middleware.ts` using `@supabase/ssr` to reject unauthenticated requests before they reach the page. Keep the layout `useEffect` guard as defense-in-depth, but it is not primary protection.

### Anti-Pattern 2: `as Type` Casts on Supabase Responses

**What people do:** Write `const rows = data as WorkoutRow[]` after a Supabase query.

**Why it's wrong:** TypeScript's `as` cast is a compile-time assertion — it does not validate at runtime. If the Supabase schema changes (column renamed, type changed, nullable field added), the cast silently produces an object with undefined fields that will crash deep in the rendering tree with a confusing error.

**Do this instead:** `z.array(WorkoutTemplateSchema).parse(data ?? [])` at the hook boundary. Crashes immediately with a Zod error that names the mismatched field.

### Anti-Pattern 3: Single Global QueryClient Instance in Module Scope

**What people do:** `const queryClient = new QueryClient()` at module level in `providers.tsx` (this is the current code).

**Why it's wrong:** In Next.js App Router with SSR, module-level singletons can be shared across requests, leaking one user's cached data to another user's request. Even in pure client rendering, a module-level `QueryClient` persists between test runs if not reset.

**Do this instead:** Instantiate `QueryClient` inside a `useState` or `useRef` inside the Providers component so each render tree (and each test) gets a fresh client.

```typescript
// src/app/providers.tsx (corrected)
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes default
            gcTime: 1000 * 60 * 10,
            retry: 1,
          },
        },
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### Anti-Pattern 4: `.toISOString().split('T')[0]` for Local Dates

**What people do:** Use `new Date().toISOString().split('T')[0]` to get today's date string for habit log comparisons.

**Why it's wrong:** `toISOString()` always returns UTC. A user in UTC-8 at 11pm on Monday gets `"Tuesday"` from this call. Habit streak comparisons break because the "today" stored in the DB (from the client's local time) does not match the "today" computed during streak calculation.

**Do this instead:** Use a `formatLocalDate(date: Date): string` utility that uses `date.getFullYear()`, `date.getMonth() + 1`, and `date.getDate()` to produce a local-timezone YYYY-MM-DD string.

### Anti-Pattern 5: Error Logging Without Context

**What people do:** `console.error("Error:", error.message)` — string message only, no stack, no user context, no operation name.

**Why it's wrong:** When debugging a production issue, you cannot correlate the log to a specific user, operation, or component. `error.message` alone drops the stack trace.

**Do this instead:** `logger.error("fetchAll failed", { error, userId: user?.id })` — passing the full error object preserves stack traces; the structured shape allows future log aggregation.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` in middleware; `@supabase/supabase-js` in hooks | Use `getUser()` in middleware, never `getSession()` |
| Supabase Database | Direct PostgREST via `supabase.from()` in hooks | RLS enforces user isolation; no backend API layer needed at current scale |
| Supabase Database | `.range(from, to)` for all list queries | Prevents unbounded fetches as data grows |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| middleware ↔ DashboardLayout | Cookie-based session (transparent) | Middleware refreshes token; layout reads stale-proof user state via `useUser()` |
| Hooks ↔ Components | React Query state objects (`data`, `isLoading`, `isError`) | Components never call Supabase directly — all data comes through hooks |
| Hooks ↔ Schemas | Import Zod schema, call `.parse()` in `queryFn` | Schema is the contract; hooks enforce it |
| Components ↔ Error Boundaries | React error propagation (throw) | `throwOnError` in React Query; `error.tsx` files at segment level |
| Utils ↔ Hooks | Pure function import | No side effects in utils; hooks call utils for calculation and formatting |

---

## Build Order Implications

The concerns in CONCERNS.md have architectural dependencies that determine phase order:

**Must come first (unblocks everything else):**
1. **Env var validation + supabase client hardening** — every hook depends on `supabaseClient.ts`. Fix this first so subsequent fixes have a reliable client.
2. **Logger utility** — every subsequent fix should use it; create it early so it can be adopted incrementally.

**Foundation for type safety work:**
3. **Zod schema expansion** — create schemas for all tables (habits, weight, macros). Type safety fixes in hooks require these schemas to exist.
4. **Zod parse at hook boundaries** — replaces `as` casts; depends on schemas being complete.

**Auth hardening (depends on infrastructure being stable):**
5. **middleware.ts + @supabase/ssr** — replaces useEffect-only guards. Install `@supabase/ssr`, add middleware, keep layout guard as fallback.

**Testing (depends on hooks being stable):**
6. **Vitest setup** — install and configure. Start with utils (pure functions, easiest), then hooks (mock supabase), then components.

**Performance (depends on hooks being stable + validated):**
7. **Pagination** — add `.range()` to hooks after Zod parse is in place (parse must work before adding the complexity of paginated results).

**UX polish (independent, lowest risk):**
8. **Error boundaries, skeleton components, Dialog modal** — these are purely additive UI changes; no interdependency with the above.

---

## Sources

- [Supabase Server-Side Auth for Next.js — Official Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence (official, updated 2026-02-25)
- [Next.js Vitest Setup — Official Docs](https://nextjs.org/docs/app/guides/testing/vitest) — HIGH confidence (official, updated 2026-02-24)
- [Testing React Query — TkDodo](https://tkdodo.eu/blog/testing-react-query) — HIGH confidence (TanStack core team member, widely referenced)
- [React Query Error Handling — TkDodo](https://tkdodo.eu/blog/react-query-error-handling) — HIGH confidence (same source)
- [Zod + React Query DTO Pattern — Josh Karamuth](https://joshkaramuth.com/blog/tanstack-zod-dto/) — MEDIUM confidence (verified against official Zod and React Query docs)
- [Next.js Error Handling — Official Docs](https://nextjs.org/docs/app/getting-started/error-handling) — HIGH confidence (official)

---

*Architecture research for: Next.js 15 + Supabase production audit hardening*
*Researched: 2026-02-26*
