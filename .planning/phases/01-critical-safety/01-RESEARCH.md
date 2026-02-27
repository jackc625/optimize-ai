# Phase 1: Critical Safety - Research

**Researched:** 2026-02-26
**Domain:** Next.js 15 security hardening — dependency management, env var validation, Supabase RLS, auth guard middleware, React Query SSR safety
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth redirect behavior**
- Instant redirect with no flash — protected page content must never render for unauthenticated users
- Auth guard lives in **Next.js middleware** (not in the layout component)
- After successful login, redirect user to the originally requested URL (preserve destination in redirect state)
- Login page shows a subtle contextual message ("Please sign in to continue") when arriving via auth redirect, but not when navigating directly to /login

**Env var validation**
- Validation triggers at **module load** — the process should crash before serving any requests
- Validation runs at both **build time and runtime** (catches missing vars in CI/CD before deploying a broken build)
- Check **presence only** — just verify vars are not undefined or empty strings; no URL format or length validation
- Error message format: just the missing var name (e.g., `Missing required env var: NEXT_PUBLIC_SUPABASE_URL`) — no setup instructions in the message

**RLS policy audit scope**
- Scope: **all tables equally** — same standard for every table including child tables (`workout_exercises`, `habit_logs`, `workout_log_exercises`)
- Standard: verify RLS is **enabled** on each table AND that policies enforce `auth.uid() = user_id` on SELECT, INSERT, UPDATE, DELETE
- Action on gaps: **fix immediately** — audit and remediate in the same pass; don't flag and defer
- Deliverable format: Claude's discretion (SQL migration file is preferred if it fits the project's migration pattern)

**Error visibility**
- Env var errors: **developer-only** — crash the server and log to console; users should never see this
- Session expiry (auth error mid-use): show a **toast notification** ("Your session expired. Please sign in again."), then redirect to login
- Toast implementation: use an existing toast/notification component if one exists in the codebase; add a minimal toast component if none exists
- **No new error utility or pattern** in this phase — just fix the specific listed issues; Phase 3 handles structured logging

### Claude's Discretion
- SQL migration file format and naming convention for RLS fixes
- Exact toast component design and placement if a new one is needed
- QueryClient instantiation fix approach (inside useState for SSR safety)
- Workout URL double-slash fix implementation

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SAFE-01 | `@supabase/supabase-js` moved from `devDependencies` to `dependencies` | Standard npm dependency management — move entry in package.json |
| SAFE-02 | App throws clear startup error if env vars missing | Module-load validation pattern with `throw new Error()` in supabaseClient.ts |
| SAFE-03 | All Supabase tables have RLS policies enforcing `auth.uid() = user_id` on all operations | SQL ALTER TABLE + CREATE POLICY pattern documented with correct USING/WITH CHECK clauses |
| SAFE-04 | Auth redirect eliminates race condition where unauthenticated users briefly see protected content | Next.js middleware + cookie-based session signal; critical constraint documented below |
| BUG-02 | Double-slash URL in workouts/page.tsx corrected | String literal fix: `/dashboard//workouts/${id}/log` → `/dashboard/workouts/${id}/log` |
| BUG-03 | QueryClient in providers.tsx instantiated inside useState to prevent SSR cache leaks | TanStack Query docs: `const [queryClient] = useState(() => new QueryClient())` pattern |
</phase_requirements>

---

## Summary

This phase addresses six concrete defects in a Next.js 15 / Supabase app: one missing production dependency, one silent env var failure mode, one incomplete RLS audit, one auth race condition, one broken URL string, and one SSR cache sharing bug.

Five of the six fixes are straightforward and low-risk. SAFE-01 is a package.json edit. SAFE-02 adds presence checks in `supabaseClient.ts` before `createClient` is called. BUG-02 is a one-character string fix. BUG-03 changes `const queryClient = new QueryClient()` (module scope) to `const [queryClient] = useState(() => new QueryClient())` inside the component. SAFE-03 requires running a SQL audit and applying RLS policies through the Supabase dashboard or migration files.

SAFE-04 (auth guard) requires careful implementation. The CONTEXT.md decision is that the guard lives in **Next.js middleware**, not in the layout render body. However, the existing app uses `@supabase/supabase-js` which stores sessions in `localStorage`, not cookies — meaning middleware cannot read the Supabase session natively. The recommended approach is to set a lightweight `sb-session-exists` cookie (true/false) on login/logout using a client-side effect, and have middleware redirect based on that cookie's presence. This is a routing-layer signal only — it does not replace server-side session verification but prevents the render flash. Full server-side session verification with `@supabase/ssr` is deferred to v2 (AUTH-01).

**Primary recommendation:** Implement the cookie signal approach for SAFE-04, apply all other fixes directly in the identified files, and ship RLS policies as a SQL file named `supabase/migrations/YYYYMMDD_rls_all_tables.sql`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.50.0 | Supabase client — auth, database | Already installed; move to `dependencies` |
| `next` | ^15.3.2 | App framework — middleware, routing | Already installed |
| `@tanstack/react-query` | ^5.80.6 | Server state management | Already installed; fix providers.tsx |
| `react-hot-toast` | ^2.5.2 | Toast notifications | Already installed; use for session expiry toast |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^3.25.56 | Schema validation | Already in use; not needed for phase 1 env validation (simple presence check) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cookie signal for middleware | `@supabase/ssr` full SSR auth | SSR auth is correct long-term (AUTH-01, v2) but requires adding the package and migrating the Supabase client — out of scope for this phase |
| `react-hot-toast` for session expiry | Custom toast component | `react-hot-toast` is already in dependencies; no new component needed |

**Installation:** No new packages required. Package.json edit only for SAFE-01.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── middleware.ts          # NEW: auth guard (SAFE-04)
│   ├── providers.tsx          # FIX: useState QueryClient (BUG-03)
│   ├── auth/login/page.tsx    # FIX: read ?redirect param, show contextual message
│   └── dashboard/
│       ├── layout.tsx         # FIX: remove render-body redirect, keep useEffect for profile check
│       └── workouts/
│           └── page.tsx       # FIX: double-slash URL (BUG-02)
├── lib/
│   └── supabaseClient.ts      # FIX: env var validation at module load (SAFE-02)
supabase/
└── migrations/
    └── YYYYMMDD_rls_all_tables.sql  # NEW: RLS policies (SAFE-03)
```

### Pattern 1: Module-Load Env Var Validation (SAFE-02)

**What:** Validate required env vars before `createClient` is called, throwing synchronously so the process crashes at startup rather than at first database request.

**When to use:** Any time an env var is required for the module to function at all.

**Example:**
```typescript
// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Note: Removing the non-null assertion `!` after validating is correct TypeScript — the type narrows from `string | undefined` to `string`.

### Pattern 2: Next.js Middleware Auth Guard with Cookie Signal (SAFE-04)

**What:** Middleware intercepts all `/dashboard/*` requests before rendering and redirects unauthenticated requests to `/auth/login?redirect=<original-path>`.

**When to use:** Any app that needs to prevent protected page content from rendering for unauthenticated users.

**The constraint:** `@supabase/supabase-js` stores sessions in `localStorage` — not cookies. Next.js middleware runs server-side and cannot access `localStorage`. The solution is a lightweight boolean cookie (`sb-authed`) written by a client-side `useEffect` in the root layout or auth components, read by middleware as a routing signal only.

**Example middleware:**
```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthed = request.cookies.get("sb-authed")?.value === "true";

  if (!isAuthed) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set(
      "redirect",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**Cookie management (in auth flow):**
```typescript
// Set on successful login (in login page handler or root layout useEffect)
document.cookie = "sb-authed=true; path=/; SameSite=Lax";

// Clear on logout (in DashboardLayout handleLogout)
document.cookie = "sb-authed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
```

**Redirect preservation in login page:**
```typescript
// src/app/auth/login/page.tsx
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const redirectTo = searchParams.get("redirect");
const fromRedirect = !!redirectTo;

// After successful login:
router.push(redirectTo || "/dashboard");

// Contextual message:
{fromRedirect && (
  <p className="text-sm text-muted-foreground">Please sign in to continue</p>
)}
```

### Pattern 3: QueryClient SSR-Safe Initialization (BUG-03)

**What:** Create `QueryClient` inside `useState` with a lazy initializer so each SSR request gets its own isolated client instance.

**Source:** TanStack Query official docs — https://tanstack.com/query/latest/docs/framework/react/guides/ssr

```typescript
// src/app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**Why `useState` not module scope:** Module-scope `new QueryClient()` creates a single instance shared across all SSR requests on the server, leaking cached data between users. `useState` with a lazy initializer creates a new instance per component mount, which in SSR is once per request.

### Pattern 4: Supabase RLS Policies (SAFE-03)

**What:** SQL migration that enables RLS and creates four policies per table (SELECT, INSERT, UPDATE, DELETE).

**SQL syntax for each table:**
```sql
-- Enable RLS (idempotent)
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own rows
CREATE POLICY "table_name: users can select own rows"
ON public.table_name FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- INSERT: users can only insert rows with their own user_id
CREATE POLICY "table_name: users can insert own rows"
ON public.table_name FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: users can only update their own rows
CREATE POLICY "table_name: users can update own rows"
ON public.table_name FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: users can only delete their own rows
CREATE POLICY "table_name: users can delete own rows"
ON public.table_name FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

**Note on `(SELECT auth.uid())` vs `auth.uid()`:** Wrapping in SELECT is the Supabase-recommended pattern — it tells Postgres to evaluate `auth.uid()` once per query rather than once per row, improving performance on large tables. Source: https://supabase.com/docs/guides/database/postgres/row-level-security

**Tables requiring policies** (from REQUIREMENTS.md SAFE-03):
- `user_profiles`
- `habits`
- `habit_logs`
- `weight_logs`
- `user_macros`
- `workouts`
- `workout_exercises`
- `workout_logs`
- `workout_log_exercises`

Note: `workout_exercises` and `habit_logs` are explicitly called out in SAFE-03 as known risk areas.

**Special case — `user_profiles`:** The `user_id` column IS the primary key (not a separate FK). Policy USING clause remains `(SELECT auth.uid()) = user_id`.

**Special case — child tables with `habit_id`/`workout_id` FKs:** Tables like `habit_logs` have `user_id` directly. No join needed — the pattern above applies directly to all tables.

### Anti-Patterns to Avoid

- **Render-body auth redirect (existing bug):** The current `dashboard/layout.tsx` calls `router.push("/auth/login")` and returns null directly in the render body. In React, `router.push` during render is a side effect that can execute multiple times and race with hydration. The DashboardLayout render body redirect must be **removed entirely** — middleware handles the redirect instead.
- **Module-scope QueryClient:** `const queryClient = new QueryClient()` at module scope is shared across all server requests. Always inside `useState`.
- **TypeScript non-null assertions on env vars without validation:** `process.env.NEXT_PUBLIC_X!` silences TypeScript but doesn't validate at runtime. Remove `!` and add explicit checks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast component | `react-hot-toast` (already installed) | Already in use app-wide; session expiry toast fits naturally |
| Auth session validation in middleware | Parse JWT manually | Cookie signal (simple bool) now; `@supabase/ssr` later (AUTH-01) | JWT parsing in Edge middleware adds complexity; cookie signal is sufficient for flash prevention |
| RLS audit tooling | Custom SQL query runner | Supabase SQL editor or psql migration files | Supabase provides the SQL editor; output as a migration file is the standard pattern |

**Key insight:** Every problem in this phase has an existing solution — either already in the codebase (`react-hot-toast`) or in the standard toolchain (SQL migrations, package.json edits). Nothing new needs to be invented.

---

## Common Pitfalls

### Pitfall 1: Middleware Cannot Read Supabase localStorage Session
**What goes wrong:** Developer writes `middleware.ts` to call Supabase to verify auth — but `@supabase/supabase-js` stores sessions in `localStorage`, which is not accessible in middleware (Edge runtime has no DOM). The middleware always sees the user as unauthenticated and redirects everyone.
**Why it happens:** Middleware runs server-side; `localStorage` is browser-only. `@supabase/ssr` solves this by using cookies instead, but it's not installed.
**How to avoid:** Use the cookie signal pattern (`sb-authed=true` cookie set by client JS on login). Middleware reads a cookie, not a Supabase session.
**Warning signs:** Every `/dashboard` request redirects to login even after successful auth.

### Pitfall 2: Cookie Signal Desync
**What goes wrong:** The `sb-authed` cookie is set on login but not cleared on logout or session expiry, leaving stale "authenticated" signals.
**Why it happens:** Developers remember to set the cookie on login but forget to clear it everywhere auth ends (logout handler, session expiry handler).
**How to avoid:** Clear `sb-authed` cookie in: (1) `handleLogout` in DashboardLayout, (2) the Supabase `onAuthStateChange` listener in `useUser` when event is `SIGNED_OUT`.
**Warning signs:** Unauthenticated users can navigate to `/dashboard` routes without being redirected (cookie exists but session is gone).

### Pitfall 3: Open Redirect Vulnerability from ?redirect Param
**What goes wrong:** Login page reads `?redirect=https://evil.com` and calls `router.push(redirectUrl)` — sending users to an attacker-controlled URL.
**Why it happens:** Blindly trusting the redirect param without validation.
**How to avoid:** Validate the redirect URL starts with `/` (relative path only) before using it. Reject any value starting with `//` or `http`.
**Warning signs:** Redirect param accepts absolute URLs without error.

### Pitfall 4: RLS Policies Missing on Child Tables
**What goes wrong:** Parent table (`habits`, `workouts`) has RLS but child tables (`habit_logs`, `workout_exercises`, `workout_log_exercises`) do not — a user can query child tables by guessing IDs.
**Why it happens:** RLS must be enabled and policies created per table; it does not cascade automatically.
**How to avoid:** Treat all nine tables equally. Do not assume child tables inherit parent policies.
**Warning signs:** RLS is enabled on `habits` but Supabase dashboard shows no policies on `habit_logs`.

### Pitfall 5: `SAFE-04` Old Layout Redirect Still Present After Middleware Added
**What goes wrong:** Middleware correctly redirects to login, but the old `if (!user) { router.push("/auth/login"); return null; }` in DashboardLayout is still there — it now creates a redirect loop or double-redirect.
**Why it happens:** Developer adds middleware without removing the existing layout guard.
**How to avoid:** When middleware is added, simultaneously remove the `if (!user) { router.push(...); return null; }` block from `dashboard/layout.tsx`. The middleware handles the unauthenticated case; the layout only needs to handle the profile-setup redirect (via `useEffect`).
**Warning signs:** Browser shows infinite redirect or login page flashes briefly before dashboard.

### Pitfall 6: Env Var Validation Fails Build-Time in Next.js Server Components
**What goes wrong:** The `throw` in `supabaseClient.ts` fires during the Next.js build when the CI environment doesn't have `NEXT_PUBLIC_SUPABASE_URL` set.
**Why it happens:** Next.js statically analyzes and potentially executes module imports during `next build`. `NEXT_PUBLIC_` vars are embedded at build time.
**How to avoid:** This is intentional — CONTEXT.md says validation runs at both build time and runtime. Ensure CI/CD environment has these vars set. This is the correct behavior (failing fast rather than deploying broken).
**Warning signs:** `next build` succeeds without env vars set (means validation was missed).

---

## Code Examples

Verified patterns from official sources:

### Fix SAFE-01: Move Supabase to Dependencies
```bash
# In package.json: move "@supabase/supabase-js": "^2.50.0" from devDependencies to dependencies
# Then run:
npm install
```

### Fix SAFE-02: Env Var Validation at Module Load
```typescript
// src/lib/supabaseClient.ts
// Source: CONTEXT.md decision + standard pattern
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing required env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Fix BUG-02: URL Double-Slash
```typescript
// src/app/dashboard/workouts/page.tsx — line 104
// Before (bug):
router.push(`/dashboard//workouts/${w.id}/log`)
// After (fix):
router.push(`/dashboard/workouts/${w.id}/log`)
```

### Fix BUG-03: QueryClient SSR Safety
```typescript
// src/app/providers.tsx
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/ssr
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Fix SAFE-04: Middleware Auth Guard
```typescript
// src/middleware.ts (new file)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthed = request.cookies.get("sb-authed")?.value === "true";

  if (!isAuthed) {
    const loginUrl = new URL("/auth/login", request.url);
    // Validate redirect is a relative path before setting
    const destination = request.nextUrl.pathname + request.nextUrl.search;
    if (destination.startsWith("/")) {
      loginUrl.searchParams.set("redirect", destination);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### Fix SAFE-04: Cookie Management in useUser.ts
```typescript
// In useUser.ts onAuthStateChange handler — set/clear cookie
const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  if (session?.user) {
    document.cookie = "sb-authed=true; path=/; SameSite=Lax";
  } else {
    document.cookie = "sb-authed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
});
```

### Fix SAFE-04: Login Page Redirect Handling
```typescript
// src/app/auth/login/page.tsx — add redirect param support
import { useSearchParams } from "next/navigation";

// Inside component:
const searchParams = useSearchParams();
const redirectTo = searchParams.get("redirect");
const cameFromRedirect = !!redirectTo;

// Validate redirect is safe (relative path only):
const safeRedirect = (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//"))
  ? redirectTo
  : "/dashboard";

// After successful login:
router.push(safeRedirect);
```

### Fix SAFE-03: RLS SQL Template (per table)
```sql
-- supabase/migrations/YYYYMMDD_rls_all_tables.sql
-- Apply to all 9 tables

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- Repeat for: habits, habit_logs, weight_logs, user_macros,
--             workouts, workout_exercises, workout_logs, workout_log_exercises

CREATE POLICY "user_profiles: users can select own rows"
ON public.user_profiles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles: users can insert own rows"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles: users can update own rows"
ON public.user_profiles FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles: users can delete own rows"
ON public.user_profiles FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Repeat policy block for each remaining table...
```

### Session Expiry Toast (using existing react-hot-toast)
```typescript
// In useUser.ts onAuthStateChange — detect session expiry
import toast from "react-hot-toast";

const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  const prevUser = user; // capture before state update
  setUser(session?.user ?? null);

  if (!session?.user && prevUser) {
    // User was logged in, now isn't — session expired
    toast("Your session expired. Please sign in again.", { icon: "🔒" });
    // Router push handled by middleware on next navigation, or:
    router.push("/auth/login");
  }

  if (session?.user) {
    document.cookie = "sb-authed=true; path=/; SameSite=Lax";
  } else {
    document.cookie = "sb-authed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side render guard `if (!user) return null; router.push(...)` | Middleware auth redirect before render | Next.js middleware stable in v12.2 | Eliminates flash of protected content entirely |
| `const queryClient = new QueryClient()` at module scope | `useState(() => new QueryClient())` inside component | TanStack Query v4+ SSR guide | Prevents cross-request cache leaks in SSR |
| `process.env.NEXT_PUBLIC_X!` TypeScript assertion | Explicit presence check + `throw` before use | Standard TS/Node practice | Crashes fast with clear message instead of silent undefined |
| Auth middleware with `@supabase/ssr` (full SSR auth) | Cookie signal for routing only (deferred to AUTH-01) | v2 roadmap | Lightweight now, proper implementation later |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated; replaced by `@supabase/ssr`. Not installed here; not relevant to this phase.
- Next.js 16 renames `middleware.ts` to `proxy.ts` — this is a Next.js 16 change. The project uses v15.3.2. Use `middleware.ts`.

---

## Open Questions

1. **RLS policy existence — unknown until audit**
   - What we know: SAFE-03 requires all 9 tables to have RLS with `auth.uid() = user_id` policies
   - What's unclear: Current state of RLS on each table (may be partially configured or entirely missing)
   - Recommendation: Treat the SQL migration as additive — use `DROP POLICY IF EXISTS` before `CREATE POLICY` to make the migration idempotent

2. **Cookie signal and Supabase token refresh**
   - What we know: Supabase auto-refreshes access tokens silently; the `sb-authed` cookie is a routing signal, not a security guarantee
   - What's unclear: Whether the cookie ever falls out of sync after a token refresh fails silently (network error)
   - Recommendation: The `onAuthStateChange` listener in `useUser` fires on token refresh failures with `TOKEN_REFRESHED` or `SIGNED_OUT` events — clearing the cookie in the SIGNED_OUT handler covers this case

3. **`user_profiles` table: INSERT policy for new signups**
   - What we know: New users need to create their profile on first login
   - What's unclear: Whether the insert policy allowing `auth.uid() = user_id` (new row) works correctly for the initial profile creation flow
   - Recommendation: Test with a new account after applying RLS. The `WITH CHECK ((SELECT auth.uid()) = user_id)` policy on INSERT is correct — users can only insert rows where user_id equals their own uid.

---

## Sources

### Primary (HIGH confidence)
- TanStack Query official docs — https://tanstack.com/query/latest/docs/framework/react/guides/ssr — QueryClient useState pattern
- Supabase RLS docs — https://supabase.com/docs/guides/database/postgres/row-level-security — SQL syntax for USING/WITH CHECK and `(SELECT auth.uid())` performance optimization
- Next.js middleware docs — https://nextjs.org/docs/app/building-your-application/routing/middleware — matcher config, NextResponse.redirect, cookie API
- Project source code — direct inspection of `providers.tsx`, `dashboard/layout.tsx`, `supabaseClient.ts`, `workouts/page.tsx`, `package.json`

### Secondary (MEDIUM confidence)
- DEV Community (Aug 2025) — https://dev.to/dalenguyen/fixing-nextjs-authentication-redirects-preserving-deep-links-after-login-pkk — searchParams redirect preservation pattern (verified against Next.js docs)
- WebSearch synthesis — Supabase localStorage vs cookie storage behavior (multiple sources agree; confirmed by official Supabase SSR migration docs)

### Tertiary (LOW confidence)
- Session expiry toast pattern — synthesized from project's existing `react-hot-toast` usage and `onAuthStateChange` event types; not from an authoritative single source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all decisions constrained to existing dependencies
- Architecture patterns (SAFE-01, SAFE-02, BUG-02, BUG-03): HIGH — all verified against official docs or direct code inspection
- Architecture patterns (SAFE-04 cookie signal): MEDIUM — correct approach given the localStorage constraint, but the cookie signal is a deliberate limitation not a best practice (best practice is `@supabase/ssr`)
- Architecture patterns (SAFE-03 SQL): HIGH — verified against Supabase RLS official docs
- Pitfalls: HIGH for documented ones; MEDIUM for session expiry desync edge cases

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable domain; Next.js 15.x and Supabase RLS patterns are stable)
