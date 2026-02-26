# External Integrations

**Analysis Date:** 2026-02-26

## APIs & External Services

**Supabase (Backend-as-a-Service):**
- Primary external service for database and authentication
  - SDK/Client: @supabase/supabase-js 2.50.0
  - Configuration: `src/lib/supabaseClient.ts`
  - Auth: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

## Data Storage

**Databases:**
- Supabase PostgreSQL Database
  - Client: @supabase/supabase-js (createClient)
  - Configuration: `src/lib/supabaseClient.ts`
  - Connection env vars:
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY

**Database Tables & Schema:**
- `workouts` - Workout templates with user_id, name, created_at
- `workout_exercises` - Exercise definitions under workouts
  - Fields: id, workout_id, name, sets_count, reps, rest_seconds, display_order, created_at
- `workout_logs` - Logged workout instances
  - Fields: id, workout_id, user_id, log_date, notes, created_at
- `workout_log_exercises` - Individual set logs
  - Fields: id, workout_log_id, exercise_name, set_number, reps_completed, weight, created_at
- `profiles` - User profile information
- `macros` - Macro tracking data
- `macro_history` - Historical macro entries
- `weight_logs` - Weight tracking entries
- `habits` - Habit tracking data

**File Storage:**
- Not detected - No file upload integration implemented

**Caching:**
- React Query client-side caching - In-memory with configurable stale times
  - Example: `staleTime: 1000 * 60 * 5` (5 minutes) in `src/hooks/workouts/useWorkouts.ts`
  - No Redis or external caching service

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication
  - Implementation: Email/password auth via supabase.auth.signInWithPassword() and signUp()
  - Location: `src/app/auth/login/page.tsx`, `src/app/auth/signup/page.tsx`
  - Session management: Handled by Supabase SDK
  - User retrieval: `src/hooks/profile/useUser.ts` queries authenticated user

## Monitoring & Observability

**Error Tracking:**
- Not detected - No error tracking service configured (Sentry, DataDog, etc.)

**Logs:**
- Console logging only - No structured logging service
- Toast notifications for user-facing errors via react-hot-toast
- Example patterns: `toast.error("Failed to load macro history")`

## CI/CD & Deployment

**Hosting:**
- Not detected in codebase - Deployment platform not configured
- Next.js supports: Vercel (recommended), Netlify, AWS, self-hosted

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI configuration found

## Environment Configuration

**Required env vars:**
- NEXT_PUBLIC_SUPABASE_URL - Supabase project URL (public, prefixed for browser access)
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anon public key (public, safe for browser)

**Optional env vars:**
- None detected

**Secrets location:**
- `.env.local` file - Contains local environment variables (not committed)

## Webhooks & Callbacks

**Incoming:**
- Not detected - No incoming webhook endpoints implemented

**Outgoing:**
- Not detected - No outgoing webhooks to external services

## Data Query Patterns

**Server State Management:**
- TanStack React Query - All data fetching uses useQuery/useMutation
- Query keys: Following pattern ["resource"] and ["resource", id]
- Example query key: ["workouts"], ["workout", workoutId]
- Cache invalidation: On mutation success via useQueryClient()

**Supabase Query Pattern:**
Example from `src/hooks/workouts/useWorkouts.ts`:
```typescript
const { data, error } = await supabase
  .from("workouts")
  .select(
    `id, user_id, name, created_at,
     workout_exercises(id, workout_id, name, sets_count, reps, rest_seconds, display_order, created_at)`
  )
  .order("created_at", { ascending: false });
```

**Validation:**
- Runtime validation using Zod schemas
- Schemas: `src/schemas/workoutSchema.ts`, profile schemas, macro schemas
- All data from Supabase is validated against Zod schemas before use

---

*Integration audit: 2026-02-26*
