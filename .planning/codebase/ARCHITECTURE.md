# Architecture

**Analysis Date:** 2026-02-26

## Pattern Overview

**Overall:** Client-Server with React + Next.js frontend, Supabase backend, and layered data fetching architecture.

**Key Characteristics:**
- Server-side authentication via Supabase Auth (session-based)
- Client-side data fetching with React Query (TanStack Query) for caching and synchronization
- Functional React components with hooks (React 19, Next.js 15 App Router)
- Zod schema validation for runtime type safety
- Separation of concerns: pages → components → hooks → utilities
- Direct Supabase client calls from hooks (no backend API layer)

## Layers

**Pages/Routes Layer:**
- Purpose: Entry points for user flows, handle routing, authentication guards, page-specific state
- Location: `src/app/**/*.tsx`
- Contains: Next.js page components, layout components, auth pages
- Depends on: Hooks, components, Supabase client for immediate data needs
- Used by: Next.js App Router

**Components Layer:**
- Purpose: Presentational UI and business logic composition
- Location: `src/components/**/*.tsx`
- Contains: UI components (Card, Button), domain components (MacroSummary, WeightChart, ProfileForm)
- Depends on: Hooks for data, other UI components
- Used by: Pages and other components

**Hooks Layer:**
- Purpose: Data fetching, caching, and state management
- Location: `src/hooks/**/*.ts`
- Contains: Custom React hooks using React Query (useWorkouts, useMacros, useUser, useWeightLogs, useHabits) and direct Supabase calls
- Depends on: Supabase client, utils (calculateMacros), schemas (Zod validation)
- Used by: Components and pages

**Utils Layer:**
- Purpose: Pure business logic and calculations
- Location: `src/utils/**/*.ts`
- Contains: Macro calculations (calculateBMR, calculateTDEE, calculateMacros, getMacroSplit)
- Depends on: Nothing (pure functions)
- Used by: Hooks

**Types & Schemas Layer:**
- Purpose: Type definitions and validation
- Location: `src/types/database.ts`, `src/schemas/workoutSchema.ts`
- Contains: TypeScript interfaces (UserProfile, Habit, HabitLog, WeightLog, UserMacro) and Zod schemas (WorkoutTemplate, WorkoutLog)
- Depends on: Zod library
- Used by: Hooks, components, utilities

**Infrastructure Layer:**
- Purpose: External service clients and shared utilities
- Location: `src/lib/supabaseClient.ts`, `src/lib/utils.ts`
- Contains: Supabase client instance, Tailwind utility functions
- Depends on: Supabase JS SDK
- Used by: Hooks, occasionally pages

## Data Flow

**User Authentication & Profile Setup Flow:**

1. App loads → `src/app/layout.tsx` wraps with providers
2. `Providers` component initializes React Query client
3. Page checks auth via `useUser()` hook → queries Supabase Auth session
4. If not authenticated → redirect to `/auth/login` or `/auth/signup`
5. If authenticated but no profile → redirect to `/dashboard/profile/setup`
6. On profile setup page → submit form → `useUser()` verifies → create profile in `user_profiles` table

**Macro Calculation Flow:**

1. Component renders and calls `useMacros()` hook
2. `useMacros()` fetches user profile from `user_profiles` table
3. Calls `calculateMacros(profileInput)` utility with profile data
4. Utility chain: `calculateBMR()` → `calculateTDEE()` → `getMacroSplit()` → returns `MacroOutput`
5. Component displays calculated macros with editable overrides
6. On "Save" → inserts to `user_macros` table with Supabase client

**Workout Management Flow:**

1. `useWorkouts()` query fetches from `workouts` table with nested `workout_exercises`
2. React Query caches with 5-minute stale time
3. Creates, updates, deletes via mutations (`useCreateWorkout`, `useUpdateWorkout`, `useDeleteWorkout`)
4. On mutation success → invalidates cache → triggers refetch
5. `useWorkoutLogs()` fetches `workout_logs` with nested `workout_log_exercises`
6. `useCreateWorkoutLog()` inserts log + exercises in transaction-like sequence

**State Management:**
- Authentication state: `useUser()` hook subscribed to Supabase auth listener
- Server state: React Query manages caching, invalidation, stale time
- Local UI state: `useState` in components for forms, loading flags, editable fields
- Profile data: Fetched on-demand in hooks and pages (useEffect + state)

## Key Abstractions

**Database Interfaces (src/types/database.ts):**
- Purpose: Define shape of database tables at TypeScript level
- Examples: `UserProfile`, `Habit`, `HabitLog`, `WeightLog`, `UserMacro`
- Pattern: One interface per table, matches Supabase schema

**Zod Schemas (src/schemas/workoutSchema.ts):**
- Purpose: Runtime validation and type inference for workout data
- Examples: `WorkoutTemplateSchema`, `WorkoutLogSchema`, `ExerciseTemplateSchema`
- Pattern: Define with `z.object()`, infer TypeScript type with `z.infer`

**Custom Hooks (src/hooks/**):**
- Purpose: Encapsulate query/mutation patterns and Supabase calls
- Examples: `useWorkouts()`, `useCreateWorkout()`, `useMacros()`, `useUser()`
- Pattern: Return React Query objects (data, isLoading, error) or mutation functions with onSuccess invalidation

**Calculation Utilities (src/utils/macros/**):**
- Purpose: Pure, deterministic business logic
- Examples: `calculateBMR()`, `calculateTDEE()`, `calculateMacros()`, `getMacroSplit()`
- Pattern: Take typed input → return typed output, no side effects

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All pages load through this
- Responsibilities: Set metadata, load global styles, render Toaster (react-hot-toast), wrap with Providers

**Providers Component:**
- Location: `src/app/providers.tsx`
- Triggers: Called from root layout
- Responsibilities: Initialize QueryClientProvider for React Query, enable caching for entire app

**Auth Entry:**
- Location: `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx`
- Triggers: Unauthenticated users redirected here
- Responsibilities: Handle Supabase sign-in/sign-up, redirect to dashboard on success

**Dashboard Entry:**
- Location: `src/app/dashboard/page.tsx`
- Triggers: Authenticated users land here by default
- Responsibilities: Check auth status, display greeting, show macro summary and workout overview

**Dashboard Layout:**
- Location: `src/app/dashboard/layout.tsx`
- Triggers: Wraps all `/dashboard/*` routes
- Responsibilities: Enforce authentication, enforce profile setup, render navigation sidebar, redirect if no profile

## Error Handling

**Strategy:** Optimistic error handling with user feedback via toast notifications and console logging.

**Patterns:**

- **Data Fetching Errors:** Caught in hook try/catch, logged to console, error state set, user notified with `toast.error()`
- **React Query Errors:** Caught and thrown in `queryFn`, React Query propagates to `useQuery` error state
- **Mutation Errors:** Caught in `mutationFn`, thrown to trigger error UI state and skip `onSuccess`
- **Auth Errors:** Handled in `useUser()` subscription listener, redirect triggered at page level
- **Validation Errors:** Zod schema parse errors thrown from hooks, caught at component level
- **Form Validation:** Manual validation in components (e.g., check for NaN in MacroSummary), error toast on fail

## Cross-Cutting Concerns

**Logging:**
- Errors logged to `console.error()` with context message
- No structured logging framework; direct console calls in hooks and pages

**Validation:**
- Runtime: Zod schemas parse Supabase responses in hooks (`WorkoutTemplateSchema.parse()`)
- Type-level: TypeScript `strict: true` ensures compile-time safety
- Form: Manual checks in components before submission (numeric, required fields)

**Authentication:**
- Supabase Auth handles session management
- `useUser()` hook subscribes to auth state changes, provides `user` and `loading`
- Pages guard routes via `useEffect` → check user → redirect if null
- Layouts (DashboardLayout) enforce authentication and profile setup

**Loading States:**
- React Query: `isLoading`, `isFetching` states managed automatically
- Custom: Manual `loading`, `isRecalculating`, `isSaving` flags in component state
- UI Feedback: Disabled buttons, spinner animations, "Loading..." text during async operations

**Notifications:**
- react-hot-toast: Initialized in root layout, triggered from hooks/components
- Position: Top-right (configured in root layout)
- Types: Success, error, info messages from data operations

---

*Architecture analysis: 2026-02-26*
