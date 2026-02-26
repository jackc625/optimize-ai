# Stack Research

**Domain:** Next.js 15 + Supabase production app audit and hardening
**Researched:** 2026-02-26
**Confidence:** HIGH (all major recommendations verified via official docs and multiple sources)

---

## Recommended Stack

### Core Technologies (Keep — No Changes)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.3.2 (current) | Full-stack framework | Already in use; App Router is the correct architecture for SSR + RLS-protected Supabase |
| React | 19.0.0 (current) | UI library | Latest stable; no reason to downgrade |
| @supabase/supabase-js | 2.50.x → pin to 2.50.5+ | Supabase client | v2.50.4 had a breaking type regression; v2.50.5+ reverts it. **Must move from devDependencies to dependencies** — it is a runtime dependency |
| @tanstack/react-query | 5.80.6 (current) | Server state + cache | Correct choice for Supabase integration; no change needed |
| Zod | 3.25.56 (current) | Schema validation | Stay on v3 — v4 was released July 2025 but breaks `.email()` chaining, `z.string().email()` becomes `z.email()`. Migrate to v4 in a separate milestone |
| TypeScript | 5.x (current) | Type safety | Strict mode already on; keep |
| Tailwind CSS | 3.4.1 (current) | Styling | Keep; v4 is available but migration is disruptive and not required for this audit |

### New Dependencies to Add

#### Test Infrastructure

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| vitest | ^4.0 | Test runner | Official Next.js recommendation (nextjs.org/docs). Vitest 4 is latest stable (released Oct 2025); 4.0.18 is the current release. Faster than Jest, native ESM, Vite-compatible |
| @vitejs/plugin-react | ^4.x | Vitest React transform | Required for JSX in tests; pairs with vitest |
| jsdom | ^25.x | Browser environment simulation | Required for vitest `environment: 'jsdom'` to render React components |
| @testing-library/react | ^16.x | Component rendering in tests | Official React test utility; v16 supports React 19 (install @testing-library/dom alongside it) |
| @testing-library/dom | ^10.x | DOM queries for RTL v16 | Required peer dep for @testing-library/react v16 |
| @testing-library/user-event | ^14.x | User interaction simulation | Realistic user event simulation (click, type, etc.) |
| vite-tsconfig-paths | ^5.x | Path alias resolution in vitest | Needed so `@/*` alias works in test files |
| msw | ^2.x | Network request mocking | Intercepts Supabase fetch calls at network level; better than mocking supabase client directly |

#### Form Management

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-hook-form | ^7.71 | Form state management | Replaces 8+ useState fields in ProfileForm; built-in dirty tracking, validation, and TypeScript inference. v7.71.2 is current stable (Feb 2026); v8 is in beta, don't use yet |
| @hookform/resolvers | ^5.2 | Zod resolver bridge | Connects Zod schemas to react-hook-form; v5.2.2 is current; supports Zod v3 and v4 with automatic detection |

#### Date Handling

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| date-fns | ^4.1 | Date manipulation | v4.1.0 is current stable; replaces `.toISOString().split('T')[0]` pattern with explicit, timezone-safe utilities (`format`, `parseISO`, `startOfDay`). Tree-shaken, framework-agnostic |
| @date-fns/tz | ^1.x | Timezone-aware dates | date-fns v4 first-class timezone support package; use `TZDate` to represent dates in user's local timezone rather than UTC. Minimal bundle: 761B gzipped |

#### Accessible UI Components

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @radix-ui/react-dialog | ^1.1.15 | Accessible modal/dialog | Replaces `window.confirm()`. Follows WAI-ARIA Dialog pattern; focus trap, Esc key, screen reader announcements built in. shadcn/ui migrated to unified `radix-ui` package (Feb 2026), but installing individual `@radix-ui/react-dialog` is still valid and avoids migration risk |
| @radix-ui/react-alert-dialog | ^1.x | Destructive action confirm | Semantic alternative to `window.confirm()` for delete confirmations; distinct ARIA role from Dialog |

#### Type-Safe Supabase

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| supabase CLI (dev tool) | latest | Generate database.types.ts | `npx supabase gen types typescript --project-id <ID> > src/lib/database.types.ts`; enables typed `createClient<Database>()`. This is the official Supabase pattern — no third-party needed for basic type safety |

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| supabase CLI | Type generation, local dev, migrations | Run `npx supabase gen types typescript` after schema changes; automate in CI with GitHub Actions |
| ESLint `eslint-plugin-react-hooks` | Enforce exhaustive-deps rule | Already have ESLint; add `"react-hooks/exhaustive-deps": "error"` to catch the stale useEffect dependencies documented in CONCERNS.md |

---

## Installation

```bash
# Move supabase-js from devDependencies to dependencies
npm install @supabase/supabase-js

# Form management
npm install react-hook-form @hookform/resolvers

# Date handling
npm install date-fns @date-fns/tz

# Accessible UI (modal replacement for window.confirm)
npm install @radix-ui/react-dialog @radix-ui/react-alert-dialog

# Dev dependencies — test infrastructure
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event vite-tsconfig-paths msw
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| vitest | Jest | Jest is acceptable but requires more config for Next.js App Router; Vitest is the official Next.js recommendation and runs faster |
| @testing-library/react | Enzyme | Never: Enzyme does not support React 17+ hooks and is unmaintained |
| react-hook-form | Formik | Formik is mature but re-renders more; react-hook-form uses uncontrolled inputs, less re-render surface |
| date-fns | Day.js | Day.js is smaller (6KB gzip vs 18KB) but needs plugins for timezone; date-fns v4 has first-class timezone support without plugins. Day.js fine if bundle size is critical |
| date-fns | Luxon | Luxon has excellent timezone support but is 23KB; overkill for local date formatting fixes needed here |
| @radix-ui/react-dialog | Headless UI | Headless UI requires Tailwind; Radix is framework-agnostic and already aligned with the project's existing component approach |
| @radix-ui/react-dialog | unified `radix-ui` package | The unified `radix-ui` package (shadcn migration Feb 2026) is cleaner but the migration adds scope. Use individual packages for this audit milestone |
| supabase CLI types | supazod | supazod generates Zod schemas from Supabase types (fork of supabase-to-zod). Valuable for validating Supabase responses at runtime. Optional — add if Zod validation at data-fetch boundaries is a priority |
| Zod v3 (current) | Zod v4 | Zod v4 (July 2025) is 14x faster and 57% smaller core, but breaks `.string().email()` chaining and requires migration. Upgrade in a later milestone, not this audit |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `window.confirm()` for delete confirmation | Synchronous, inaccessible, cannot be styled, blocked by some browsers | `@radix-ui/react-alert-dialog` with explicit Cancel/Confirm buttons |
| `.toISOString().split('T')[0]` for local dates | Returns UTC date, which differs from user's local date near midnight (CONCERNS.md documents this bug) | `date-fns` `format(new Date(), 'yyyy-MM-dd')` or `format(new TZDate(new Date(), userTz), 'yyyy-MM-dd')` |
| `as Type` casts on Supabase query results | Silent failures if schema changes; CONCERNS.md documents this in multiple hooks | Zod `.parse()` / `.safeParse()` after generating typed DB client via `createClient<Database>()` |
| `getSession()` in server components | Does not revalidate token against Supabase Auth server; can return stale session data | `getUser()` for security-critical server-side checks; `getClaims()` (JWT-local validation) in middleware for performance |
| Jest | Slower, requires babel config for ESM, does not benefit from Vite transforms | vitest |
| Enzyme | Unmaintained, incompatible with React 17+ hooks | @testing-library/react |
| @supabase/auth-helpers-nextjs | Deprecated; superseded by @supabase/ssr | @supabase/ssr (if adding SSR auth middleware in a future milestone) |
| Formik | More re-renders than react-hook-form; less TypeScript inference out of the box | react-hook-form + Zod resolver |
| Moment.js | ~67KB, deprecated, mutable API | date-fns or Day.js |

---

## Stack Patterns by Use Case

**Fixing type-unsafe `as` casts in hooks (CONCERNS.md):**
- Generate `database.types.ts` via `supabase gen types`
- Pass `Database` generic to `createClient<Database>()`
- The typed client's `.select()` results are already typed; `as Type` becomes unnecessary for simple queries
- For complex/nested selects: keep Zod schemas (already present) and call `.parse()` at the hook boundary
- Pattern: `const result = WorkoutSchema.array().parse(data)` replaces `data as WorkoutRow[]`

**Replacing ProfileForm `useState` fields with react-hook-form:**
- Define `ProfileFormSchema = z.object({...})` using existing Zod patterns
- Use `useForm({ resolver: zodResolver(ProfileFormSchema), defaultValues: {...} })`
- Eliminates lines 22-31 of ProfileForm.tsx (8 useState calls) and the unsafe string-to-enum casts on lines 50-55

**Safe date handling for habit streak and workout logs:**
- Replace `.toISOString().split('T')[0]` with `format(new Date(), 'yyyy-MM-dd')` from date-fns
- For timezone-aware comparison: `format(new TZDate(date, 'UTC'), 'yyyy-MM-dd')`
- date-fns `isSameDay()`, `differenceInCalendarDays()` replace manual date string comparisons

**Testing React Query hooks:**
- Create a `createTestQueryClient()` factory: `new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } }, gcTime: 0 })`
- Wrap test renders with `QueryClientProvider`
- Use `msw` handlers to intercept Supabase REST calls at network level
- Don't mock the Supabase client object directly — brittle; msw is more realistic

**Accessible delete confirmation (replace `window.confirm()` in workouts/page.tsx):**
- Use `@radix-ui/react-alert-dialog` (semantic for destructive actions, not `Dialog`)
- State: `const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)`
- Trigger opens dialog; confirm button calls `deleteWorkout.mutate(pendingDeleteId)`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| vitest ^4.0 | @vitejs/plugin-react ^4.x, vite ^6.x | Vitest 4 requires Vite 6; `@vitejs/plugin-react` v4+ is Vite 6 compatible |
| @testing-library/react ^16 | React 19, @testing-library/dom ^10 | v16 added React 19 support; must also install `@testing-library/dom` as it became a required peer |
| @hookform/resolvers ^5.2 | react-hook-form ^7.x, Zod v3 + v4 | Auto-detects Zod version at runtime |
| date-fns ^4.1 | @date-fns/tz ^1.x | Both must be used together for timezone-aware operations; they are separate packages by design |
| @radix-ui/react-dialog ^1.1.15 | React 18 + 19 | Radix v1.x supports both React versions |
| @supabase/supabase-js 2.50.5+ | TypeScript strict mode | v2.50.4 broke generic types; v2.50.5 reverts; current project uses 2.50.0 — update to latest 2.50.x |
| Zod 3.25.56 | @hookform/resolvers ^5.2 | Stay on v3; resolvers v5.2.2 handles both v3 and v4 when/if you upgrade |

---

## Sources

- [Next.js Vitest docs (nextjs.org)](https://nextjs.org/docs/app/guides/testing/vitest) — Official install command and vitest.config.mts pattern; updated 2026-02-24 (HIGH confidence)
- [Vitest 4.0 announcement (vitest.dev)](https://vitest.dev/blog/vitest-4) — Confirmed Vitest 4.0 stable release; Browser Mode stable; latest 4.0.18 (HIGH confidence)
- [Supabase TypeScript support (supabase.com)](https://supabase.com/docs/reference/javascript/typescript-support) — `createClient<Database>()` pattern and type generation (HIGH confidence)
- [Supabase gen types CLI reference (supabase.com)](https://supabase.com/docs/reference/cli/supabase-gen-types) — CLI command for type generation (HIGH confidence)
- [supabase-js v2.50.4 type regression issue](https://github.com/supabase/supabase-js/issues/1483) — Confirmed regression and v2.50.5 fix (HIGH confidence)
- [@hookform/resolvers npm (npmjs.com)](https://www.npmjs.com/package/@hookform/resolvers) — v5.2.2 current, Zod v3+v4 support (HIGH confidence)
- [react-hook-form releases (github.com)](https://github.com/react-hook-form/react-hook-form/releases) — v7.71.2 current stable; v8 in beta (HIGH confidence)
- [date-fns v4.0 timezone release (blog.date-fns.org)](https://blog.date-fns.org/v40-with-time-zone-support/) — TZDate and @date-fns/tz first-class timezone (HIGH confidence)
- [date-fns npm](https://www.npmjs.com/package/date-fns) — v4.1.0 current stable (MEDIUM confidence — npm page, no direct Context7 verification)
- [Radix UI Dialog (radix-ui.com)](https://www.radix-ui.com/primitives/docs/components/dialog) — WAI-ARIA Dialog, @radix-ui/react-dialog v1.1.15 (HIGH confidence)
- [shadcn/ui radix-ui migration (ui.shadcn.com)](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui) — Unified `radix-ui` package migration path (MEDIUM confidence — shadcn docs, not Radix official)
- [Supabase SSR Next.js auth guide (supabase.com)](https://supabase.com/docs/guides/auth/server-side/nextjs) — getClaims() vs getSession() security distinction (HIGH confidence)
- [Zod v4 migration guide (zod.dev)](https://zod.dev/v4/changelog) — Breaking changes to .email() chaining and error API (HIGH confidence)
- [Testing React Query (tkdodo.eu)](https://tkdodo.eu/blog/testing-react-query) — QueryClient test wrapper pattern, retry: false, gcTime: 0 (MEDIUM confidence — community blog, widely cited)
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) — v0.8.0 stable, v0.9.0-rc.6 pre-release (MEDIUM confidence — npm registry)
- [supazod vs supabase-to-zod comparison](https://github.com/dohooo/supazod) — supazod is the maintained fork preferred by original author (MEDIUM confidence — GitHub)

---

*Stack research for: Next.js 15 + Supabase production app audit*
*Researched: 2026-02-26*
