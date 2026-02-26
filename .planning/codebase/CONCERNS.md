# Codebase Concerns

**Analysis Date:** 2026-02-26

## URL Routing Errors

**Malformed navigation path with double slash:**
- Issue: Route construction contains double forward slash
- Files: `src/app/dashboard/workouts/page.tsx` (line 104)
- Impact: Navigation to `/dashboard//workouts/${w.id}/log` is malformed; browser normalizes it, but this is unprofessional and indicates sloppy path construction
- Fix approach: Change `router.push(/dashboard//workouts/${w.id}/log)` to `router.push(/dashboard/workouts/${w.id}/log)` - remove extra slash

## Type Safety Issues

**Unsafe type assertions without validation:**
- Issue: Multiple locations use `as` casts on data that may not match the asserted type
- Files:
  - `src/hooks/workouts/useWorkouts.ts` (lines 58, 64, 101, 107) - casts `WorkoutRow[]` without runtime validation
  - `src/hooks/workouts/useWorkoutLogs.ts` (lines 59, 68, 140) - casts `LogRow[]` without validation
  - `src/app/dashboard/macros/history/page.tsx` - casts to `MacroRecord[]`
  - `src/app/dashboard/profile/edit/page.tsx` - casts to `UserProfile`
  - `src/components/macros/MacroSummary.tsx` (line 22) - unsafe number assertion
  - `src/components/profile/ProfileForm.tsx` (lines 50, 51) - casts string form values to enum types
- Impact: If Supabase returns unexpected data shape, code silently fails or throws runtime errors. Zod schemas exist but aren't consistently applied at data fetch boundaries
- Fix approach: Use Zod schema validation on all Supabase query results before type assertion. Replace `as Type` with `.parse()` throughout data fetching

**Unvalidated form string-to-enum conversions:**
- Issue: Form input strings are cast directly to union types without validation
- Files: `src/components/profile/ProfileForm.tsx` (lines 50-55)
- Impact: If form contains invalid enum value, silent type error occurs. Zod validation happens after cast
- Fix approach: Validate with Zod schema before casting, or use enum helper function to validate string→enum conversion

## Testing Coverage

**Complete absence of automated tests:**
- Issue: No test files found in codebase; zero test infrastructure configured
- Files: N/A - no `.test.ts`, `.spec.ts` files or test config (jest.config.js, vitest.config.ts)
- Impact: All features untested; refactoring is risky; bugs can be introduced silently
- Priority: High
- Fix approach: Set up test framework (vitest recommended for Next.js), add unit tests for hooks, integration tests for critical user flows (auth, profile setup, workout logging)

## Data Persistence & Race Conditions

**useEffect dependency array issues:**
- Issue: Some useEffect hooks may have missing or incorrect dependencies
- Files:
  - `src/app/dashboard/page.tsx` (lines 32-49) - `loadProfileName()` effect depends on `[user]` only; if user changes, profile name may become stale
  - `src/hooks/macros/useMacros.ts` (lines 60-62) - empty dependency array `[]` means `refresh()` never re-runs; if user changes or dependencies update, stale data returned
  - `src/app/dashboard/workouts/[id]/page.tsx` (lines 41-45) - correctly depends on `workoutQuery.data`
- Impact: Stale data displayed; user changes not reflected without page reload; difficult-to-diagnose bugs
- Fix approach: Audit all useEffect hooks for correct dependency arrays; use ESLint rule `exhaustive-deps`

**useWorkout with conditional enabled state but no refresh on dependency changes:**
- Issue: `useWorkout()` hook uses `enabled: Boolean(workoutId)` but workoutId may change
- Files: `src/app/dashboard/workouts/[id]/log/page.tsx` (lines 30)
- Impact: If user navigates between workout IDs, cached query may not refetch if staleTime hasn't elapsed
- Fix approach: Ensure queryKey includes all relevant parameters; current code appears safe but relies on query invalidation for correctness

## Error Handling & Logging

**Insufficient error context in console.error:**
- Issue: Error logs don't include enough context; stack traces and full error objects not logged
- Files:
  - `src/hooks/habits/useHabits.ts` (line 97) - logs `err` without object destructuring
  - `src/hooks/macros/useMacros.ts` (line 52) - logs `err` without formatting
  - `src/app/dashboard/page.tsx` (line 42) - only logs `profileError.message`
  - `src/app/dashboard/layout.tsx` (line 32) - only logs `error.message`
  - `src/app/dashboard/workouts/new/page.tsx` (lines 32-34) - handles both Error and unknown, but logging could be clearer
- Impact: Debugging production issues is harder; missing stack traces and context
- Fix approach: Create error logging utility that logs full error objects, stack traces, and contextual data (user ID, operation name, etc.)

**Browser API usage for destructive operations:**
- Issue: `window.confirm()` used for delete confirmation
- Files: `src/app/dashboard/workouts/page.tsx` (line 20-24)
- Impact: Non-dismissible modal is poor UX; no accessible alternative dialog
- Fix approach: Replace with accessible modal component (e.g., custom Dialog component or headless UI library)

## Authentication & Security

**Unsafe user checks without error handling:**
- Issue: Multiple locations check `if (!user)` without verifying authentication state completed
- Files:
  - `src/hooks/profile/useUser.ts` - `useUser()` hook doesn't throw on errors; relies on loader state
  - `src/app/dashboard/layout.tsx` (line 20-21) - early return if `userLoading` but auth check not guaranteed
  - `src/app/dashboard/page.tsx` (lines 24-29) - router.push during render (before effect completes)
- Impact: Race conditions where page renders before auth check completes; potential exposure of data
- Fix approach: Use Supabase middleware or wrapper hook to guarantee auth state before rendering protected content

**Missing CSRF protection:**
- Issue: No CSRF tokens visible in mutation handlers; relying on Supabase RLS
- Files: All mutation hooks (`useCreateWorkout`, `useUpdateWorkout`, `useDeleteWorkout`, etc.)
- Impact: If compromised, attackers could perform mutations via cross-origin requests
- Fix approach: Ensure Supabase Row-Level Security (RLS) policies validate `auth.uid()` on every mutation; audit RLS policies

**Environment variables not validated at runtime:**
- Issue: Supabase URL and key loaded with `!` operator; no validation
- Files: `src/lib/supabaseClient.ts` (lines 3-4)
- Impact: Missing env vars cause silent undefined errors at runtime
- Fix approach: Add runtime validation; throw clear error if env vars missing at startup

## Performance Concerns

**No pagination in list queries:**
- Issue: All list queries (`useWorkouts`, `useWorkoutLogs`, `useHabits`) fetch all records
- Files:
  - `src/hooks/workouts/useWorkouts.ts` (line 34) - `.select()` with no limit
  - `src/hooks/workouts/useWorkoutLogs.ts` (line 35) - `.select()` with no limit
  - `src/hooks/habits/useHabits.ts` (lines 50-51, 62-64) - multiple unbounded queries
- Impact: As data grows (100+ workouts, 1000+ logs), queries slow down; memory usage increases; client renders full lists
- Fix approach: Implement cursor-based or offset pagination; add `.range()` to Supabase queries; implement virtual scrolling in list components

**QueryClient created without options in Providers:**
- Issue: `QueryClient` instantiated with default options
- Files: `src/app/providers.tsx` (line 6)
- Impact: Cache invalidation conservative; queries may refetch too frequently or stale data persists
- Fix approach: Configure `QueryClient` with explicit `staleTime`, `gcTime`, `retry` options based on data freshness requirements

**Unnecessary re-renders in MacroSummary:**
- Issue: MacroSummary component initializes local state from props on every effect
- Files: `src/components/macros/MacroSummary.tsx` (lines 35-42)
- Impact: Form fields reset on macro recalculation; poor UX if user is editing
- Fix approach: Use `useCallback` to prevent unnecessary renders; separate controlled/uncontrolled state logic

## Fragile Areas

**Supabase nested select queries with weak error handling:**
- Issue: Complex nested selects in workout queries assume correct table relationships; no schema validation
- Files:
  - `src/hooks/workouts/useWorkouts.ts` (lines 36-52) - nested `workout_exercises` select
  - `src/hooks/workouts/useWorkoutLogs.ts` (lines 36-54) - nested `workout_log_exercises` select
- Impact: If Supabase schema changes or relationship breaks, whole feature fails silently
- Fix approach: Add explicit error handling for relationship fetch failures; log errors with operation context

**Date parsing with string split (timezone issues):**
- Issue: Multiple locations use `.toISOString().split('T')[0]` for date handling
- Files:
  - `src/hooks/habits/useHabits.ts` (lines 17, 24, 38)
  - `src/app/dashboard/workouts/[id]/log/page.tsx` (line 80)
  - `src/app/dashboard/workouts/page.tsx` (line 86)
- Impact: Works in UTC but breaks when comparing user's local date vs ISO format; edge cases near midnight cause bugs
- Fix approach: Use consistent date utility library (date-fns or Day.js) for all date operations; store dates as UTC in DB

**Manual form state management instead of form library:**
- Issue: ProfileForm uses useState for 8+ form fields; no built-in validation or dirty tracking
- Files: `src/components/profile/ProfileForm.tsx` (lines 22-31)
- Impact: Complex form logic duplicated; hard to maintain; easy to introduce bugs in validation flow
- Fix approach: Consider `react-hook-form` or `formik` for form state management and validation

## Scaling Limits

**No query result caching strategy:**
- Issue: React Query caching doesn't account for user's own vs. shared data
- Files: All custom hooks using `useQuery`
- Impact: As users create more data, queries become slower; no background refetch strategy
- Fix approach: Implement staleTime/gcTime strategy based on data mutability; add manual cache invalidation after mutations

**Habit streak calculation runs on every fetch:**
- Issue: Streak calculation algorithm runs in-memory for all habits
- Files: `src/hooks/habits/useHabits.ts` (lines 14-34)
- Impact: O(n*m) complexity where n=habits, m=logs per habit; becomes slow with many habits/logs
- Fix approach: Consider storing streak in database or caching at component level

## Known Bugs

**Window.confirm not awaited:**
- Issue: `window.confirm()` is called but not awaited; mutation proceeds regardless
- Files: `src/app/dashboard/workouts/page.tsx` (line 20-24)
- Impact: User confirmation required but deletion proceeds; race condition if user cancels
- Current code: `if (window.confirm(...)) { deleteWorkout.mutate(...) }` is correct
- Note: Actually safe - `window.confirm()` is synchronous; false return prevents mutation
- Resolution: Keep as-is but consider modal for better UX

**Profile name fallback to "User" but no visual indication:**
- Issue: If profile name fails to load, defaults to "User" silently
- Files: `src/app/dashboard/page.tsx` (line 45)
- Impact: User sees generic greeting; no indication of error
- Fix approach: Show explicit message if profile name fails to load

## Missing Critical Features

**No offline support or optimistic updates:**
- Issue: All mutations require network; no optimistic UI updates
- Impact: Slow feedback on actions; poor experience on slow networks
- Fix approach: Implement optimistic updates in React Query; add offline queue for failed mutations

**No loading skeleton components:**
- Issue: Generic text loading messages instead of visual placeholders
- Files: Multiple pages (workouts, weight, habits)
- Impact: Poor perceived performance; users unsure if page is hung
- Fix approach: Create loading skeleton components that mirror final layout

## Configuration & Setup

**No database migration system detected:**
- Issue: No migrations directory or scripts visible
- Impact: Difficult to track schema changes; hard to deploy to new environments
- Fix approach: Add migration system (Supabase migrations CLI or custom scripts)

**Environment file not in git:**
- Issue: `.env.local` exists but likely not committed; developers need manual setup
- Impact: Onboarding difficulty; inconsistent environments
- Fix approach: Create `.env.example` with required vars; document setup process in README

---

*Concerns audit: 2026-02-26*
