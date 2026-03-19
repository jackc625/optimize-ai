# Phase 2: Type Safety - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate unsafe `as` casts at every Supabase boundary, standardize all hooks on React Query, enforce correct useEffect dependencies via ESLint, validate ProfileForm enums with Zod, and fix timezone-unsafe date handling. This phase is type safety and consistency hardening — no new features, no new UI.

</domain>

<decisions>
## Implementation Decisions

### Zod validation strategy
- Use `.safeParse()` at ALL Supabase hook boundaries — follows success criteria literally
- On failure: throw an error that React Query catches — components use standard `error`/`isError` fields
- Error message format: operation name + Zod issues (e.g., `Zod validation failed in useWorkouts: [field-level issues]`)
- Convert existing `.parse()` calls in `useWorkouts` and `useWorkoutLogs` to `.safeParse()` too — consistency across all hooks
- No `as TypeName` casts on raw Supabase `data` anywhere in the codebase after this phase

### useHabits React Query migration
- Single composite query — one `useQuery` that fetches habits + logs + today's completions in its `queryFn` (matches current data flow)
- Separate mutation hooks: `useAddHabit()`, `useCompleteHabit()`, `useDeleteHabit()` — matches `useCreateWorkout`/`useDeleteWorkout` pattern
- Return standard React Query shape (`{ data, isLoading, error }`) — components access `data.habits`, `data.todayCompleted`
- Query data type wraps habits + todayCompleted in a single object

### useMacros React Query migration
- Derived calculation (BMR, TDEE, macro split) happens inside `queryFn` — fetches profile, runs `calculateMacros()`, returns final `MacroOutput`
- Returns standard React Query shape, consistent with all other hooks

### ProfileForm enum validation
- Validate form string values against Zod enum schemas BEFORE use (not after cast)
- Reuse existing `ProfileSchema` enum definitions (`sex`, `goal`, `activity_level`)

### ESLint exhaustive-deps
- Enable `react-hooks/exhaustive-deps` as `"error"` (not warning)
- Fix all violations — `useMacros` empty `[]`, `dashboard/page.tsx` stale user ref, and any others found
- After React Query migration, most useEffect dependency issues should be eliminated since data fetching moves to `useQuery`

### Date utility
- Add `date-fns` as a dependency
- Create shared utility file `src/utils/dates/localDate.ts` with `getLocalDate()` and `formatLocalDate()` functions
- Replace ALL `.toISOString().split('T')[0]` patterns across the codebase with the shared utility
- Assume stored `date` column values in `habit_logs` are local-date strings — compare against local today, no timezone normalization of stored dates

### Schema coverage
- Create `src/schemas/macroSchema.ts` for `MacroRecordSchema` (macros history page)
- Create `UserProfileSchema` in `src/schemas/profileSchema.ts` — separate from existing `ProfileSchema` (form input validation vs Supabase response validation)
- Replace `as number` in `MacroSummary.tsx` — remove the cast for consistency even though the existing guard is technically safe
- Follow existing convention: one schema file per domain, types inferred via `z.infer<>`

### Claude's Discretion
- Exact Zod schema field definitions for MacroRecordSchema and UserProfileSchema (derive from actual Supabase column shapes)
- How to handle the `MacroSummary` number narrowing after removing `as number` (type guard, Zod, or refactor)
- ESLint config format for enabling exhaustive-deps (flat config vs legacy)
- Specific date-fns functions to expose from the shared utility
- Query key naming conventions for new habit/macro queries

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` — TYPE-01, TYPE-02, TYPE-03, TYPE-04, BUG-01 define exact acceptance criteria
- `.planning/ROADMAP.md` §Phase 2 — Success criteria 1-5 define what must be TRUE

### Existing schemas (patterns to follow)
- `src/schemas/workoutSchema.ts` — Established Zod schema pattern with z.infer types
- `src/schemas/profileSchema.ts` — Existing ProfileSchema for form validation (do not modify, add separate UserProfileSchema)

### Hooks to modify
- `src/hooks/workouts/useWorkouts.ts` — Convert .parse() to .safeParse(), remove `as` casts
- `src/hooks/workouts/useWorkoutLogs.ts` — Convert .parse() to .safeParse(), remove `as` casts
- `src/hooks/habits/useHabits.ts` — Full React Query migration + date fix
- `src/hooks/macros/useMacros.ts` — Full React Query migration

### Pages with `as` casts to fix
- `src/app/dashboard/macros/history/page.tsx` — `as MacroRecord[]` cast (needs new schema)
- `src/app/dashboard/profile/edit/page.tsx` — `as UserProfile` cast (needs new schema)
- `src/components/macros/MacroSummary.tsx` — `as number` cast
- `src/components/profile/ProfileForm.tsx` — `as "male" | "female"` and similar enum casts

### Codebase conventions
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, import organization, module design
- `.planning/codebase/CONCERNS.md` §Type Safety Issues, §Data Persistence & Race Conditions, §Fragile Areas — Detailed issue descriptions

### Prior phase context
- `.planning/phases/01-critical-safety/01-CONTEXT.md` — Phase 1 decisions (no new error utility this phase; structured logging deferred to Phase 3)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workoutSchema.ts`: Established Zod schema pattern — `.safeParse()` + throw on failure can follow this file's structure
- `profileSchema.ts`: Enum definitions for `sex`, `goal`, `activity_level` — reuse in ProfileForm validation
- `useWorkouts.ts` / `useWorkoutLogs.ts`: React Query hook patterns with `useQuery`, `useMutation`, `useQueryClient` — migration targets should match this structure
- `eslint-plugin-react-hooks`: Already installed in `package-lock.json` — just needs config enabling

### Established Patterns
- Hooks use `@tanstack/react-query` with `queryKey` arrays and `staleTime` configuration
- Mutations invalidate related query keys via `useQueryClient`
- Supabase data flows: `supabase.from().select()` → check error → parse/cast → return typed data
- All imports use `@/` path alias

### Integration Points
- Components consuming `useHabits` return value will need updating (custom shape → React Query shape)
- Components consuming `useMacros` return value will need updating
- `eslint.config.mjs` needs exhaustive-deps rule addition
- `package.json` needs `date-fns` dependency

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions captured above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-type-safety*
*Context gathered: 2026-03-18*
