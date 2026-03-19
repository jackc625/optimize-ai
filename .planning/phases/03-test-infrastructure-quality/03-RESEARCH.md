# Phase 3: Test Infrastructure + Quality - Research

**Researched:** 2026-03-19
**Domain:** Vitest 4 + React Testing Library + MSW 2, Radix UI AlertDialog, loading skeletons, structured error logging
**Confidence:** HIGH

## Summary

Phase 3 installs test infrastructure from scratch and adds four quality improvements to an existing Next.js 15 / React 19 / TanStack Query v5 codebase. No test framework, config, or test files exist yet — this is a greenfield test setup. The macro calculation utilities are ideal pure-function unit test targets. The `useWorkouts` hook uses React Query and requires MSW 2 at the Node.js level (`msw/node`) to intercept Supabase's PostgREST HTTP calls without touching real infrastructure.

The three non-test items are straightforward: `logError()` is a thin wrapper around `console.error` with structured fields; `@radix-ui/react-alert-dialog` is the locked choice for the confirm dialog (headless, ARIA alert dialog role, focus-trapped); and loading skeletons use Tailwind's `animate-pulse` with a shared `<Skeleton />` primitive. The habits page already has an inline skeleton pattern that serves as a reference for the skeleton style.

**Primary recommendation:** Configure Vitest 4 with `vite-tsconfig-paths` for `@/` alias resolution, `jsdom` environment, and a global setup file that runs MSW's `setupServer`; test pure utilities with zero mocking; wrap React Query hook tests in a per-test `QueryClientProvider` with retries disabled.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Test scope & infrastructure
- **Framework:** Vitest 4 with React Testing Library for hook/component tests
- **Mocking:** MSW (Mock Service Worker) for Supabase API calls — intercepts at the fetch level, exercises real Supabase client code path
- **MSW handlers:** Centralized handlers in `src/__tests__/mocks/handlers.ts` for common Supabase responses, with per-test overrides for specific scenarios
- **Test file location:** Separate `src/__tests__/` directory mirroring the source tree (NOT co-located)
- **React Query test wrapper:** Custom `renderWithProviders` helper that wraps in QueryClientProvider with test-configured QueryClient — reusable across all hook tests
- **Test scope beyond requirements:**
  - Required: `calculateMacros` unit tests (BMR, TDEE, macro split) + `useWorkouts` integration tests
  - Additional: Date utility tests (`localDate.ts`), Zod schema validation tests, and any other testable utilities
- **Coverage:** No enforced threshold — get tests running first, add reporting without blocking
- **CI scripts:** Add `test:ci` script with `--reporter=verbose` and coverage output, plus `test` and `test:watch` for local dev

#### Confirm dialog
- **Library:** `@radix-ui/react-alert-dialog` — headless, accessible (ARIA alert dialog role), keyboard navigable, focus-trapped
- **Component:** Generic reusable `ConfirmDialog` accepting `title`, `description`, `confirmLabel`, `onConfirm`, `variant` ('destructive' | 'default')
- **Visual style:** Red confirm button + neutral gray cancel button for destructive variant. Title states the action ("Delete Workout"), body explains the consequence
- **Overlay:** Semi-transparent dark backdrop that dims the page behind the dialog
- **Current usage:** Replace `window.confirm()` in `src/app/dashboard/workouts/page.tsx`

#### Loading skeletons
- **Animation:** Pulse (opacity fade) using Tailwind's built-in `animate-pulse` — no custom CSS
- **Primitives:** Shared `<Skeleton />` component in `src/components/ui/Skeleton.tsx` — renders a rounded gray animated div, accepts `className` for sizing
- **Fidelity:** High fidelity — skeletons mirror exact card shapes, row heights, and column layouts of the loaded state. No layout shift when data arrives
- **Item count:** 3 skeleton items in list pages (workouts, habits, weight)
- **Target pages:** Workouts list, weight log, and habits pages — replace all "Loading..." text placeholders

#### Error logging
- **Utility:** `logError(context: string, err: unknown)` in `src/utils/logger.ts`
- **Context captured:** Operation name, full error object, ISO timestamp, and Supabase error codes when available
- **Output:** Console-only (`console.error`) — no external service integration. Easy to swap later
- **Log levels:** Just `logError()` — single function, no logWarn/logInfo
- **Scope:** Replace ALL raw `console.error()` calls in hooks and pages (11 files identified)

### Claude's Discretion
- Exact MSW handler implementations and test data fixtures
- Vitest config details (globals, environment, setup files)
- Skeleton component sizing/spacing to match each page's loaded layout
- ConfirmDialog animation/transition details
- logError() internal formatting and Supabase error code extraction logic

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | Vitest 4 test infrastructure configured; `calculateMacros` unit tests cover BMR, TDEE, macro split; `useWorkouts` integration tests use React Query test utilities | Vitest 4 config pattern, MSW 2 node setup, renderWithProviders wrapper, pure-function test examples |
| QUAL-02 | `logError(context, err)` utility replaces all raw `console.error()` calls in hooks and pages | 11 files identified via grep; logger.ts pattern documented |
| QUAL-03 | `window.confirm()` replaced with accessible `ConfirmDialog` using `@radix-ui/react-alert-dialog` | AlertDialog component anatomy, controlled open pattern, Tailwind styling |
| QUAL-04 | Skeleton components replace "Loading..." text on workouts, weight, and habits pages | Existing `animate-pulse` pattern in habits page, shared Skeleton primitive approach |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.0 | Test runner — fast, ESM-native, Jest-compatible API | Official Next.js recommended; fastest for Vite-adjacent projects |
| @vitejs/plugin-react | 6.0.1 | JSX/TSX transformation in Vitest | Required to process React components in test environment |
| @testing-library/react | 16.3.2 | render, screen, userEvent for component/hook tests | Industry standard for React DOM testing |
| @testing-library/user-event | 14.6.1 | Realistic user interaction simulation | More accurate than fireEvent for accessibility testing |
| @testing-library/jest-dom | 6.9.1 | DOM matchers (`toBeInTheDocument`, etc.) | Improves assertion readability |
| msw | 2.12.13 | Intercepts fetch/XHR at network level for Supabase | Exercises real Supabase client path; no vi.mock needed |
| jsdom | 29.0.0 | Browser DOM environment for Vitest | Required for React component rendering in Node.js |
| vite-tsconfig-paths | (latest ~5.x) | Resolves `@/` path alias from tsconfig | Required — without this, all `@/` imports fail in Vitest |
| @radix-ui/react-alert-dialog | 1.1.15 | Headless accessible confirm dialog | ARIA alert dialog role, focus trapped, keyboard navigable |
| @vitest/coverage-v8 | 4.1.0 | Coverage reporting via V8 | Native V8 instrumentation, no extra overhead |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/dom | (peer dep) | DOM query utilities | Auto-used by @testing-library/react |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| msw/node | vi.mock('@/lib/supabaseClient') | vi.mock is simpler but doesn't exercise the real Supabase client fetch path; MSW tests network behavior |
| vite-tsconfig-paths | Manual resolve.alias in vitest.config | Manual alias is brittle and must be kept in sync; vite-tsconfig-paths auto-reads tsconfig.json |
| @radix-ui/react-alert-dialog | headlessui Dialog | Both are accessible; Radix is already implied by the project's component style and is standalone (no framework lock-in) |

**Installation:**
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom @testing-library/dom msw jsdom vite-tsconfig-paths @vitest/coverage-v8
npm install @radix-ui/react-alert-dialog
```

**Version verification:** Versions confirmed against npm registry on 2026-03-19.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── __tests__/
│   ├── mocks/
│   │   ├── handlers.ts       # centralized MSW handlers for Supabase endpoints
│   │   └── server.ts         # setupServer(...handlers) export
│   ├── utils/
│   │   ├── macros/
│   │   │   └── calculateMacros.test.ts
│   │   └── dates/
│   │       └── localDate.test.ts
│   ├── hooks/
│   │   └── workouts/
│   │       └── useWorkouts.test.ts
│   ├── schemas/
│   │   ├── workoutSchema.test.ts
│   │   └── profileSchema.test.ts
│   └── helpers/
│       └── renderWithProviders.tsx  # QueryClientProvider wrapper
├── components/
│   └── ui/
│       ├── Skeleton.tsx             # new shared skeleton primitive
│       └── ConfirmDialog.tsx        # new reusable confirm dialog
└── utils/
    └── logger.ts                    # new logError() utility
```

### Pattern 1: Vitest Configuration (vitest.config.ts)
**What:** Root-level config that registers jsdom, the React plugin, tsconfig paths, and the setup file.
**When to use:** Required — without this, `@/` aliases break, React JSX fails, and DOM matchers aren't loaded.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/testing/vitest
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Pattern 2: MSW 2 Node Setup
**What:** `setupServer` from `msw/node` intercepts all fetch requests made during tests. Handlers define URL patterns matching Supabase's PostgREST format: `{SUPABASE_URL}/rest/v1/{table}`.
**When to use:** All integration tests that invoke React Query hooks that call Supabase.

The Supabase URL in the project is `https://kmavbjhdieeddxybaccj.supabase.co`. MSW intercepts calls to `https://kmavbjhdieeddxybaccj.supabase.co/rest/v1/workouts`.

```typescript
// Source: https://mswjs.io/docs/quick-start/
// src/__tests__/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://kmavbjhdieeddxybaccj.supabase.co';

export const handlers = [
  http.get(`${SUPABASE_URL}/rest/v1/workouts`, () => {
    return HttpResponse.json([
      {
        id: 'uuid-1',
        user_id: 'user-uuid',
        name: 'Test Workout',
        created_at: '2026-01-01T00:00:00.000Z',
        workout_exercises: [],
      },
    ]);
  }),
];
```

### Pattern 3: renderWithProviders — React Query Test Wrapper
**What:** A helper function that wraps rendered components/hooks in a fresh `QueryClientProvider` per test. Retries must be disabled — default 3 retries with exponential backoff will cause tests to time out.
**When to use:** All tests that render hooks or components using `useQuery` / `useMutation`.

```typescript
// Source: https://tanstack.com/query/v5/docs/react/guides/testing
// src/__tests__/helpers/renderWithProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,       // critical: prevents test timeout on error paths
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...render(ui, { wrapper: Wrapper }), queryClient };
}

// For renderHook usage:
export function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Pattern 4: Pure Function Unit Tests (calculateMacros)
**What:** Direct import and call — no mocking, no wrappers. Verify against known formula outputs.
**When to use:** `calculateBMR`, `calculateTDEE`, `getMacroSplit`, `calculateMacros`, `localDate` utilities.

Mifflin-St Jeor formula for BMR:
- Male: `10 * weightKg + 6.25 * heightCm - 5 * age + 5`
- Female: `10 * weightKg + 6.25 * heightCm - 5 * age - 161`

TDEE = BMR * activityLevel

Goal calorie adjustments:
- `fat_loss`: targetCalories = TDEE - 400
- `muscle_gain`: targetCalories = TDEE + 250
- `recomp`: targetCalories = TDEE (no adjustment)

Macro split ratios:
- `recomp`: protein=35%, fat=27%, carbs=remainder
- `muscle_gain`: protein=30%, fat=25%, carbs=remainder
- `fat_loss`: protein=40%, fat=30%, carbs=remainder
- Grams: protein calories / 4, fat calories / 9, carbs = (remaining kcal) / 4

```typescript
// src/__tests__/utils/macros/calculateMacros.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBMR } from '@/utils/macros/calculateBMR';
import { calculateTDEE } from '@/utils/macros/calculateTDEE';
import { getMacroSplit } from '@/utils/macros/getMacroSplit';
import { calculateMacros } from '@/utils/macros/calculateMacros';

describe('calculateBMR', () => {
  it('male: applies Mifflin-St Jeor +5 constant', () => {
    // 10*80 + 6.25*175 - 5*30 + 5 = 800 + 1093.75 - 150 + 5 = 1748.75
    expect(calculateBMR(80, 175, 30, 'male')).toBe(1748.75);
  });
  it('female: applies Mifflin-St Jeor -161 constant', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345.25);
  });
});
```

### Pattern 5: ConfirmDialog Component (Radix AlertDialog)
**What:** Headless `@radix-ui/react-alert-dialog` wrapped in a reusable component. The dialog is controlled — the parent manages `open` state and passes `onConfirm`. The `Trigger` is NOT used (parent controls opening); use controlled `open` / `onOpenChange` pattern.
**When to use:** Any destructive action that requires user confirmation.

```typescript
// src/components/ui/ConfirmDialog.tsx
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ...">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'primary'}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
```

**workouts/page.tsx usage pattern:** Replace `window.confirm()` with `useState<string | null>(null)` for `pendingDeleteId`, render `<ConfirmDialog>` with `open={pendingDeleteId !== null}`, and `onConfirm` calls `deleteWorkout.mutate(pendingDeleteId)`.

### Pattern 6: Skeleton Primitive + Page Skeletons
**What:** A shared `<Skeleton className="..." />` that renders an `animate-pulse` div. Page-level skeletons compose 3 instances matching the loaded card/row shape.
**Reference:** Habits page already has an inline `animate-pulse` skeleton (lines 83-91) — use identical class names for the primitive.

```typescript
// src/components/ui/Skeleton.tsx
import { cn } from '@/utils/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded bg-muted', className)} />
  );
}
```

The workouts page loading state currently renders `<div className="text-sm text-muted-foreground">Loading workouts…</div>`. Replace with 3 skeleton cards matching the 2-column grid of the loaded state (card with header ~h-6 w-48, body ~h-4 w-32, footer 3 buttons).

The weight page `<p className="text-muted-foreground text-center">Loading…</p>` (line 88) inside the "Weight Logs" card — replace with 3 skeleton rows matching `flex justify-between` with `h-4 w-24` on each side.

The habits page already has an inline skeleton — move it to use the shared `<Skeleton />` primitive but keep the same structure.

### Pattern 7: logError Utility
**What:** Thin wrapper around `console.error` that adds structured context. A Supabase error has a `.code` property (PostgrestError type).

```typescript
// src/utils/logger.ts
interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
}

function isSupabaseError(err: unknown): err is SupabaseError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export function logError(context: string, err: unknown): void {
  const timestamp = new Date().toISOString();
  const supabaseCode = isSupabaseError(err) ? err.code : undefined;

  console.error({
    context,
    timestamp,
    ...(supabaseCode && { supabaseCode }),
    error: err,
  });
}
```

**Call-site replacement pattern:**
```typescript
// Before:
console.error("Failed to delete workout:", err.message);
// After:
logError("deleteWorkout", err);
```

All 11 files with `console.error`:
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/macros/history/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/profile/edit/page.tsx`
- `src/app/dashboard/profile/setup/page.tsx`
- `src/app/dashboard/workouts/new/page.tsx`
- `src/app/dashboard/workouts/page.tsx`
- `src/components/macros/MacroSummary.tsx`
- `src/components/profile/ProfileForm.tsx`
- `src/hooks/habits/useHabits.ts`
- `src/hooks/weight/useWeightLogs.ts`

### Anti-Patterns to Avoid
- **Module-scope QueryClient in tests:** Never `const queryClient = new QueryClient()` outside a test — shared state causes test pollution. Create a new instance per test.
- **vi.mock for Supabase:** The project chose MSW specifically to exercise the real Supabase client fetch path. Do not override with vi.mock.
- **`globals: true` without `@types/vitest` or explicit imports:** Either add `"types": ["vitest/globals"]` to a test tsconfig or import `{ describe, it, expect }` explicitly. Prefer explicit imports for clarity.
- **MSW `onUnhandledRequest: 'warn'` default:** Use `'error'` in tests so missed handler cases are caught immediately, not silently ignored.
- **`window.confirm()` pattern in tests:** It will throw in jsdom — all tests for the workouts page will fail until replaced with ConfirmDialog.
- **Co-located test files:** The project decision is `src/__tests__/` only — do not place `*.test.ts` next to source files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible confirm dialog | Custom focus-trap + ARIA dialog | `@radix-ui/react-alert-dialog` | Focus trapping, Esc key, screen reader announcement, WAI-ARIA pattern compliance — extremely hard to implement correctly |
| HTTP request mocking | vi.mock + manual fetch spy | MSW 2 `setupServer` | MSW intercepts at network level; works for any code path including the Supabase JS client internals |
| QueryClient test wrapper | Custom provider per test | `renderWithProviders` helper | Consistent retry=false, gcTime=0 config; prevents flaky tests from cache bleed-through |
| Path alias resolution | Manual `resolve.alias` in vitest.config | `vite-tsconfig-paths` | Reads tsconfig.json automatically; no duplication |

**Key insight:** The accessibility requirements for a modal dialog (focus trapping, Esc handling, aria-modal, announcements, WAI-ARIA alert dialog pattern) represent hundreds of lines of battle-tested code in Radix. There's no reason to build this.

## Common Pitfalls

### Pitfall 1: `@/` path aliases broken in Vitest
**What goes wrong:** Tests fail with `Cannot find module '@/utils/...'` even though TypeScript compiles fine.
**Why it happens:** Vitest uses Vite's resolver, not TypeScript's — it doesn't read `tsconfig.json` paths automatically.
**How to avoid:** Install `vite-tsconfig-paths` and register it as a plugin in `vitest.config.ts` BEFORE `react()`.
**Warning signs:** First test run fails with module resolution error on any `@/` import.

### Pitfall 2: React Query test timeouts from default retry behavior
**What goes wrong:** Hook tests that simulate errors hang for 15+ seconds then fail with timeout.
**Why it happens:** React Query defaults to 3 retries with exponential backoff (1s, 2s, 4s) — even in test environment.
**How to avoid:** Create every test's `QueryClient` with `defaultOptions: { queries: { retry: false } }`. Never use a shared QueryClient.
**Warning signs:** Tests pass but take unusually long; error tests time out.

### Pitfall 3: MSW handler not matching Supabase URL
**What goes wrong:** MSW logs "no handler found" warnings or `onUnhandledRequest: 'error'` causes test failures.
**Why it happens:** Supabase client constructs URLs from `NEXT_PUBLIC_SUPABASE_URL` env var. In test environment this var must be set (or the supabaseClient.ts validation throws), and the MSW handler URL must match exactly.
**How to avoid:** Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in a test `.env.test` file or in `vitest.config.ts` under `test.env`. Use the exact same URL string in handler definitions.
**Warning signs:** `Error: Missing required env var` thrown from supabaseClient.ts during test setup, or unhandled request warnings.

### Pitfall 4: `supabaseClient.ts` throws during module import in tests
**What goes wrong:** Any test that imports a hook (even indirectly) throws "Missing required env var" at import time.
**Why it happens:** `supabaseClient.ts` validates env vars at module load time — correct production behavior, but test environment needs those vars defined.
**How to avoid:** Add env vars to vitest.config.ts `test.env` block:
```typescript
test: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://kmavbjhdieeddxybaccj.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}
```
**Warning signs:** Import error before any test body runs.

### Pitfall 5: `window.confirm` called in jsdom during workouts page tests
**What goes wrong:** Tests for the workouts page that trigger deletion hang or fail with jsdom complaint.
**Why it happens:** jsdom does not implement `window.confirm` — it returns `false` by default or throws depending on version.
**How to avoid:** The `window.confirm()` replacement with `ConfirmDialog` (QUAL-03) must be done before writing workouts page tests. This is a dependency ordering constraint within Plan 03-02.
**Warning signs:** Delete tests pass unexpectedly (confirm returns false) or fail with jsdom error.

### Pitfall 6: `@radix-ui/react-alert-dialog` version compatibility with `radix-ui` umbrella package
**What goes wrong:** Import `* as AlertDialog from 'radix-ui'` instead of `@radix-ui/react-alert-dialog` directly.
**Why it happens:** Radix has both an umbrella `radix-ui` package and individual `@radix-ui/react-*` packages. The confirmed locked choice is the individual package.
**How to avoid:** Import from `@radix-ui/react-alert-dialog` directly, not from `radix-ui`.

### Pitfall 7: `vite-tsconfig-paths` current version
**What goes wrong:** Older docs reference v4; current is v5.x. Plugin API is the same but the npm package name changed at v5 (`tsconfigPaths` default export).
**How to avoid:** `npm install -D vite-tsconfig-paths` pulls latest; confirm with `npm view vite-tsconfig-paths version`.

## Code Examples

### calculateMacros full test file shape
```typescript
// Source: calculateMacros.ts, getMacroSplit.ts — formulas verified from source
import { describe, it, expect } from 'vitest';
import { calculateMacros, type ProfileInput } from '@/utils/macros/calculateMacros';

const baseInput: ProfileInput = {
  weightKg: 80,
  heightCm: 175,
  age: 30,
  sex: 'male',
  activityLevel: 1.55,  // moderately active
  goal: 'recomp',
};

describe('calculateMacros', () => {
  describe('BMR component', () => {
    it('male: uses +5 constant', () => {
      const result = calculateMacros(baseInput);
      // 10*80 + 6.25*175 - 5*30 + 5 = 1748.75
      expect(result.bmr).toBe(1748.75);
    });
    it('female: uses -161 constant', () => {
      const femaleInput: ProfileInput = { ...baseInput, sex: 'female' };
      const result = calculateMacros(femaleInput);
      expect(result.bmr).toBe(1748.75 - 166); // 1748.75 - 5 - 161 = 1582.75
    });
  });

  describe('TDEE component', () => {
    it('multiplies BMR by activityLevel', () => {
      const result = calculateMacros(baseInput);
      expect(result.maintenanceCalories).toBeCloseTo(1748.75 * 1.55, 1);
    });
  });

  describe('goal calorie adjustment', () => {
    it('recomp: targetCalories equals maintenanceCalories', () => {
      const result = calculateMacros({ ...baseInput, goal: 'recomp' });
      expect(result.targetCalories).toBe(result.maintenanceCalories);
    });
    it('fat_loss: subtracts 400 calories', () => {
      const result = calculateMacros({ ...baseInput, goal: 'fat_loss' });
      expect(result.targetCalories).toBe(result.maintenanceCalories - 400);
    });
    it('muscle_gain: adds 250 calories', () => {
      const result = calculateMacros({ ...baseInput, goal: 'muscle_gain' });
      expect(result.targetCalories).toBe(result.maintenanceCalories + 250);
    });
  });

  describe('macro split', () => {
    it('returns non-negative grams for all goals', () => {
      for (const goal of ['fat_loss', 'recomp', 'muscle_gain'] as const) {
        const result = calculateMacros({ ...baseInput, goal });
        expect(result.proteinGrams).toBeGreaterThan(0);
        expect(result.fatGrams).toBeGreaterThan(0);
        expect(result.carbGrams).toBeGreaterThan(0);
      }
    });
  });
});
```

### useWorkouts integration test shape
```typescript
// Source: useWorkouts.ts, MSW 2 docs
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkouts } from '@/hooks/workouts/useWorkouts';
import { createWrapper } from '@/__tests__/helpers/renderWithProviders';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://kmavbjhdieeddxybaccj.supabase.co';

describe('useWorkouts', () => {
  it('returns parsed workout list on success', async () => {
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Test Workout');
  });

  it('returns error when Supabase returns 500', async () => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/workouts`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### package.json scripts to add
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --reporter=verbose --coverage"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `msw/browser` for all tests | `msw/node` (`setupServer`) for unit/integration tests | MSW 2.0 (2023) | Browser mode requires Playwright; node mode is correct for Vitest/jsdom |
| `@testing-library/react-hooks` for hook testing | `renderHook` from `@testing-library/react` | React 18 / RTL 14 | No separate package needed; `renderHook` is built-in |
| `rest.get()` MSW syntax | `http.get()` + `HttpResponse.json()` | MSW 2.0 (2023) | Old v1 syntax removed; new API is cleaner |
| `window.confirm()` for destructive confirms | Accessible modal dialog | Ongoing best practice | Keyboard accessible, screen reader compatible, testable |
| Inline `animate-pulse` div | Shared `<Skeleton />` component | Project decision | DRY, consistent sizing API, easier to update |

**Deprecated/outdated:**
- `msw` v1 `rest` import and `ctx.json()` resolver pattern: removed in v2, use `http` + `HttpResponse`
- `@testing-library/react-hooks`: no longer needed with RTL 14+ / React 18+
- `jest-environment-jsdom`: Vitest uses its own `jsdom` integration via `environment: 'jsdom'` config

## Open Questions

1. **Button `variant="destructive"` — does it exist in the current Button component?**
   - What we know: Button.tsx exists with `variant` prop using `class-variance-authority`; variants seen in usage: `"ghost"`, `"primary"`, `"outline"`
   - What's unclear: Whether `"destructive"` variant is defined in Button.tsx
   - Recommendation: Read Button.tsx before implementing ConfirmDialog. If `"destructive"` is not defined, add it or use a `className` override for red styling.

2. **Supabase PostgREST query parameters in MSW handler URLs**
   - What we know: `useWorkouts` calls `.select(...).order("created_at", { ascending: false })` — Supabase appends query params like `?order=created_at.desc&select=...`
   - What's unclear: Whether MSW matches the base URL path without query params or needs exact match
   - Recommendation: MSW `http.get()` matches path only (not query string) by default — the base `rest/v1/workouts` handler will match. Verify with `onUnhandledRequest: 'error'`.

3. **`cn()` / `utils.ts` path for Skeleton**
   - What we know: Project uses `clsx` + `tailwind-merge` via `cn()` utility
   - What's unclear: Exact import path (possibly `@/utils/utils` or `@/lib/utils`)
   - Recommendation: Check the existing Button.tsx or Card.tsx import for `cn` before implementing Skeleton.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` — Wave 0 creates this |
| Quick run command | `npm run test -- --run` (or `npx vitest run`) |
| Full suite command | `npm run test:ci` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | calculateBMR male formula correct | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | calculateBMR female formula correct | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | calculateTDEE multiplies BMR * activityLevel | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | getMacroSplit recomp ratios correct | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | getMacroSplit fat_loss ratios correct | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | getMacroSplit muscle_gain ratios correct | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | calculateMacros fat_loss subtracts 400 | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | calculateMacros muscle_gain adds 250 | unit | `npx vitest run src/__tests__/utils/macros` | Wave 0 |
| QUAL-01 | useWorkouts returns parsed list on success | integration | `npx vitest run src/__tests__/hooks` | Wave 0 |
| QUAL-01 | useWorkouts returns error on 500 response | integration | `npx vitest run src/__tests__/hooks` | Wave 0 |
| QUAL-02 | No bare console.error in hooks/pages | manual-only | `grep -rn "console.error" src/` — must return 0 matches in hooks/pages | n/a |
| QUAL-03 | Delete requires confirm dialog, not window.confirm | manual-only | `grep -rn "window.confirm" src/` — must return 0 matches | n/a |
| QUAL-04 | No "Loading..." text in workouts/weight/habits pages | manual-only | `grep -rn '"Loading' src/app/dashboard` — must return 0 matches in target pages | n/a |

Note: QUAL-02, QUAL-03, QUAL-04 are verified by code inspection (grep) and manual browser test, not automated unit tests.

### Sampling Rate
- **Per task commit:** `npx vitest run` (full suite; fast since tests are pure/MSW-mocked)
- **Per wave merge:** `npm run test:ci` (verbose + coverage)
- **Phase gate:** `npx vitest run` returns 0 failures before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — test configuration file (does not exist)
- [ ] `src/__tests__/setup.ts` — jest-dom + MSW server lifecycle (does not exist)
- [ ] `src/__tests__/mocks/server.ts` — setupServer export (does not exist)
- [ ] `src/__tests__/mocks/handlers.ts` — base Supabase handlers (does not exist)
- [ ] `src/__tests__/helpers/renderWithProviders.tsx` — React Query wrapper (does not exist)
- [ ] `src/__tests__/utils/macros/calculateMacros.test.ts` — unit tests (does not exist)
- [ ] `src/__tests__/hooks/workouts/useWorkouts.test.ts` — integration tests (does not exist)
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom @testing-library/dom msw jsdom vite-tsconfig-paths @vitest/coverage-v8`
- [ ] `npm install @radix-ui/react-alert-dialog`
- [ ] `package.json` scripts: `test`, `test:watch`, `test:ci`

## Sources

### Primary (HIGH confidence)
- [Next.js Vitest docs](https://nextjs.org/docs/app/guides/testing/vitest) — vitest.config.mts structure, required packages, jsdom setup
- [MSW Quick Start](https://mswjs.io/docs/quick-start/) — setupServer, handler pattern, vitest.setup.ts lifecycle
- [TanStack Query v5 Testing](https://tanstack.com/query/v5/docs/react/guides/testing) — renderHook wrapper, retry: false, per-test QueryClient
- [Radix UI Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog) — component anatomy, Root/Portal/Overlay/Content/Action/Cancel
- npm registry — package versions verified 2026-03-19

### Secondary (MEDIUM confidence)
- [Testing React and Supabase with RTL and MSW](https://nygaard.dev/blog/testing-supabase-rtl-msw) — Supabase PostgREST URL format (`{url}/rest/v1/{table}`), handler structure
- [MSW Intercepting Requests](https://mswjs.io/docs/http/intercepting-requests/) — URL matching behavior

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry; official docs confirm setup
- Architecture: HIGH — patterns sourced from official Next.js, MSW, TanStack Query, and Radix UI docs
- Pitfalls: HIGH — path alias issue and retry behavior are well-documented; env var pitfall confirmed from source code inspection
- Test formulas: HIGH — macro formulas read directly from source files (calculateBMR.ts, getMacroSplit.ts)
- Skeleton/logError patterns: HIGH — derived from project source code and existing conventions

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable libraries; vitest 4 and MSW 2 are current majors)
