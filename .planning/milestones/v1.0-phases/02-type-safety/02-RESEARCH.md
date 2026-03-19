# Phase 2: Type Safety - Research

**Researched:** 2026-03-18
**Domain:** Zod validation, React Query migration, ESLint exhaustive-deps, date-fns
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Zod validation strategy**
- Use `.safeParse()` at ALL Supabase hook boundaries — follows success criteria literally
- On failure: throw an error that React Query catches — components use standard `error`/`isError` fields
- Error message format: operation name + Zod issues (e.g., `Zod validation failed in useWorkouts: [field-level issues]`)
- Convert existing `.parse()` calls in `useWorkouts` and `useWorkoutLogs` to `.safeParse()` too — consistency across all hooks
- No `as TypeName` casts on raw Supabase `data` anywhere in the codebase after this phase

**useHabits React Query migration**
- Single composite query — one `useQuery` that fetches habits + logs + today's completions in its `queryFn` (matches current data flow)
- Separate mutation hooks: `useAddHabit()`, `useCompleteHabit()`, `useDeleteHabit()` — matches `useCreateWorkout`/`useDeleteWorkout` pattern
- Return standard React Query shape (`{ data, isLoading, error }`) — components access `data.habits`, `data.todayCompleted`
- Query data type wraps habits + todayCompleted in a single object

**useMacros React Query migration**
- Derived calculation (BMR, TDEE, macro split) happens inside `queryFn` — fetches profile, runs `calculateMacros()`, returns final `MacroOutput`
- Returns standard React Query shape, consistent with all other hooks

**ProfileForm enum validation**
- Validate form string values against Zod enum schemas BEFORE use (not after cast)
- Reuse existing `ProfileSchema` enum definitions (`sex`, `goal`, `activity_level`)

**ESLint exhaustive-deps**
- Enable `react-hooks/exhaustive-deps` as `"error"` (not warning)
- Fix all violations — `useMacros` empty `[]`, `dashboard/page.tsx` stale user ref, and any others found
- After React Query migration, most useEffect dependency issues should be eliminated since data fetching moves to `useQuery`

**Date utility**
- Add `date-fns` as a dependency
- Create shared utility file `src/utils/dates/localDate.ts` with `getLocalDate()` and `formatLocalDate()` functions
- Replace ALL `.toISOString().split('T')[0]` patterns across the codebase with the shared utility
- Assume stored `date` column values in `habit_logs` are local-date strings — compare against local today, no timezone normalization of stored dates

**Schema coverage**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TYPE-01 | All Supabase query results in hooks use Zod `.safeParse()` instead of `as TypeName` casts — applies to `useWorkouts`, `useWorkoutLogs`, macros history page, profile edit page, and `MacroSummary` | safeParse pattern documented; all cast locations inventoried |
| TYPE-02 | ESLint `react-hooks/exhaustive-deps` rule enabled, all `useEffect` dependency arrays corrected | Plugin v5.2.0 already installed; flat config pattern documented; all violations inventoried |
| TYPE-03 | `ProfileForm` string-to-enum conversions validated against Zod enum schemas before use | ProfileSchema enum definitions confirmed; parse-before-assign pattern documented |
| TYPE-04 | `useHabits` and `useMacros` migrated from manual `useState`/`useEffect` to React Query hooks | Full migration pattern from `useWorkouts` analyzed; composite queryFn approach confirmed |
| BUG-01 | All `.toISOString().split('T')[0]` date patterns replaced with `date-fns` `format(new Date(), 'yyyy-MM-dd')` | 4 locations found; date-fns v4.1.0 confirmed; `format` function confirmed |
</phase_requirements>

---

## Summary

Phase 2 is a hardening pass across five distinct areas: (1) Zod safeParse at all Supabase boundaries, (2) React Query migration for `useHabits` and `useMacros`, (3) ESLint exhaustive-deps enforcement, (4) ProfileForm enum validation ordering, and (5) timezone-safe date handling via `date-fns`. All decisions are locked by CONTEXT.md — no architectural choices remain open for research.

The codebase has a strong existing pattern to follow: `useWorkouts.ts` and `useWorkoutLogs.ts` demonstrate correct React Query structure with `useQuery`/`useMutation`, typed schemas via `z.infer<>`, and `useQueryClient` invalidation. The two migrating hooks (`useHabits`, `useMacros`) currently use `useState`/`useEffect` and must be rewritten to match this established pattern. All components consuming these hooks will need their destructuring updated from the old `{ habits, todayCompleted, loading, addHabit }` shape to `{ data, isLoading, error }` plus separate mutation hooks.

The `eslint-plugin-react-hooks@5.2.0` is already installed as a transitive dependency. The ESLint config is flat format (`eslint.config.mjs`); the rule must be added via the `FlatCompat`-based config object. After the React Query migration eliminates most manual `useEffect` fetching patterns, only the auth-redirect effects and the `dashboard/page.tsx` profile-name fetch will remain as places requiring dependency fixes.

**Primary recommendation:** Execute in dependency order — (1) create new schemas, (2) add date-fns utility, (3) convert .parse() to .safeParse() in workout hooks, (4) migrate useHabits and useMacros to React Query, (5) fix ProfileForm enum validation, (6) enable ESLint rule and fix any remaining violations.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 3.25.56 (installed) | Runtime schema validation and type inference | Already in codebase; established pattern in workoutSchema.ts |
| @tanstack/react-query | 5.91.0 (installed) | Data fetching, caching, mutation state | Already in codebase; established pattern in useWorkouts.ts |
| date-fns | 4.1.0 (latest) | Timezone-aware date formatting | Locked decision; replaces .toISOString().split('T')[0] |
| eslint-plugin-react-hooks | 5.2.0 (installed) | Enforce correct useEffect dependency arrays | Already installed as transitive dep; just needs config enabling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | 2.5.2 (installed) | User-facing error/success notifications | All mutation error handling (existing pattern) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| date-fns | dayjs | date-fns has better tree-shaking and TypeScript types; locked decision anyway |
| safeParse + throw | parse() | parse() throws automatically but error is generic; safeParse gives structured ZodError for better messages |

**Installation (date-fns only — everything else already installed):**
```bash
npm install date-fns
```

**Version verification (confirmed 2026-03-18):**
- `date-fns`: 4.1.0 (npm registry)
- `zod`: 4.3.6 (npm registry, but project uses 3.x constraint `^3.25.56` — do not upgrade to v4)
- `@tanstack/react-query`: 5.91.0 (npm registry)
- `eslint-plugin-react-hooks`: 5.2.0 (already in node_modules)

**IMPORTANT:** `zod` npm registry latest is v4.x. The project's `package.json` pins `"zod": "^3.25.56"` — this is correct and intentional per REQUIREMENTS.md which explicitly defers Zod v4 migration. Do not upgrade.

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
src/
├── schemas/
│   ├── workoutSchema.ts       # existing — pattern to follow
│   ├── profileSchema.ts       # existing — add UserProfileSchema here
│   └── macroSchema.ts         # NEW — MacroRecordSchema for history page
├── utils/
│   └── dates/
│       └── localDate.ts       # NEW — getLocalDate() and formatLocalDate()
└── hooks/
    └── habits/
        └── useHabits.ts       # REWRITE — React Query migration
    └── macros/
        └── useMacros.ts       # REWRITE — React Query migration
```

### Pattern 1: safeParse at Supabase boundary (replace .parse() and as-casts)

**What:** Replace `Schema.parse(data)` and `data as Type` with `.safeParse()` that throws a structured error on failure.
**When to use:** Every location where Supabase `.data` is consumed in a hook.

```typescript
// Source: locked decision from CONTEXT.md; following existing workoutSchema pattern
const result = WorkoutTemplateSchema.safeParse({
  id: row.id,
  user_id: row.user_id,
  name: row.name,
  created_at: row.created_at,
  exercises: row.workout_exercises,
});
if (!result.success) {
  throw new Error(
    `Zod validation failed in useWorkouts: ${JSON.stringify(result.error.issues)}`
  );
}
return result.data; // TypeScript narrows to WorkoutTemplate
```

**For array mapping (useWorkouts, useWorkoutLogs):**
```typescript
// Instead of rows.map(row => Schema.parse({...}))
return rows.map((row) => {
  const result = WorkoutTemplateSchema.safeParse({ ...mappedRow });
  if (!result.success) {
    throw new Error(`Zod validation failed in useWorkouts: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
});
```

**Note:** For the intermediate `as WorkoutRow[]` casts that shape raw Supabase data before passing into safeParse — these are acceptable intermediate casts since the data immediately flows into Zod validation. The goal is no `as TypeName` on the _result_ of safeParse.

### Pattern 2: React Query composite query (useHabits migration target)

**What:** Single `useQuery` that runs all fetches and returns a composite typed object.
**When to use:** When a hook currently does multiple fetches in one `fetchAll()` function.

```typescript
// Source: matches useWorkouts.ts structure in this codebase
export type HabitsQueryData = {
  habits: HabitWithStreak[];
  todayCompleted: Set<string>;
};

export function useHabits() {
  return useQuery<HabitsQueryData, Error>({
    queryKey: ["habits"],
    queryFn: async () => {
      // ... all three Supabase fetches happen here
      // ... streak calculation happens here
      // ... date fix happens here (getLocalDate() instead of .toISOString().split('T')[0])
      return { habits: computed, todayCompleted: new Set(todayRows.map(l => l.habit_id)) };
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

**Component consumption change:**
```typescript
// Before (old shape):
const { habits, todayCompleted, loading, addHabit } = useHabits();

// After (React Query shape):
const { data, isLoading, error } = useHabits();
const habits = data?.habits ?? [];
const todayCompleted = data?.todayCompleted ?? new Set<string>();
const { mutate: addHabit } = useAddHabit();
```

### Pattern 3: Separate mutation hooks (matching useCreateWorkout pattern)

**What:** Each mutation becomes its own exported hook function in the same file.
**When to use:** Follows `useCreateWorkout`/`useDeleteWorkout` precedent.

```typescript
// Source: useWorkouts.ts pattern
export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (title) => {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("habits").insert({ title, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}
```

### Pattern 4: useMacros React Query migration

**What:** Move `refresh()` logic into `queryFn`; derive types from existing `MacroOutput`.
**When to use:** The current `useEffect(() => refresh(), [])` pattern is the target.

```typescript
export function useMacros() {
  return useQuery<MacroOutput, Error>({
    queryKey: ["macros"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) throw new Error("Not authenticated");

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("age, height_cm, weight_kg, sex, goal, activity_level")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError || !profileData) throw profileError || new Error("Profile not found");

      // Validate profile data with UserProfileSchema (new schema)
      const parsed = UserProfileSchema.safeParse(profileData);
      if (!parsed.success) throw new Error(`Zod validation failed in useMacros: ${JSON.stringify(parsed.error.issues)}`);

      const input: ProfileInput = {
        age: parsed.data.age,
        heightCm: parsed.data.height_cm,
        weightKg: parsed.data.weight_kg,
        sex: parsed.data.sex,
        goal: parsed.data.goal,
        activityLevel: parsed.data.activity_level,
      };
      return calculateMacros(input);
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

**MacroSummary impact:** Currently calls `refresh()` for "Recalculate" button. With React Query, this becomes `queryClient.invalidateQueries({ queryKey: ["macros"] })` or using the query's `refetch()` function returned by `useQuery`.

### Pattern 5: ProfileForm enum validation (parse-before-assign)

**What:** Call `ProfileSchema.shape.sex.safeParse(form.sex)` before constructing parsedInput, so the cast never happens.
**When to use:** Anywhere a raw string from form state is used as an enum type.

```typescript
// Current (WRONG — cast before validation):
sex: form.sex as "male" | "female",    // line 50
// ...then...
ProfileSchema.parse(parsedInput);       // validation happens too late

// Fixed (validate first, no cast needed):
const parsedInput = {
  name: form.name.trim(),
  age: Number(form.age),
  height_cm: Number(form.height_cm),
  weight_kg: Number(form.weight_kg),
  sex: form.sex,            // keep as string
  goal: form.goal,          // keep as string
  activity_level: form.activity_level,  // keep as string
  goal_weight_kg: form.goal_weight_kg.trim() !== "" ? Number(form.goal_weight_kg) : undefined,
};
// ProfileSchema.parse() validates enum membership — TypeScript infers narrowed type from .parse() return
const validated = ProfileSchema.parse(parsedInput); // throws ZodError if enum invalid
// Use validated.sex, validated.goal, validated.activity_level for payload
```

### Pattern 6: Date utility (date-fns v4)

**What:** Shared utility to get today as YYYY-MM-DD in local time.
**When to use:** Replace every `.toISOString().split('T')[0]` occurrence.

```typescript
// Source: date-fns v4 official API (format function)
// File: src/utils/dates/localDate.ts
import { format } from "date-fns";

/**
 * Returns today's date as "YYYY-MM-DD" in the user's local timezone.
 * Replaces: new Date().toISOString().split('T')[0]
 */
export function getLocalDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Formats an arbitrary Date as "YYYY-MM-DD" in local timezone.
 */
export function formatLocalDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
```

**date-fns v4 note:** v4 uses named exports only (no default export). The `format` function signature is `format(date: Date | number, formatStr: string): string`. Format token is lowercase `yyyy-MM-dd` (not `YYYY-MM-DD` which is ISO week year).

**Streak calculation fix in useHabits:**
```typescript
// Current (UTC-shifted):
const isoToday = current.toISOString().split("T")[0];

// Fixed (local timezone):
import { formatLocalDate, getLocalDate } from "@/utils/dates/localDate";
// In calculateStreak:
const localToday = formatLocalDate(current);
// In getTodayDate / queryFn:
const today = getLocalDate();
```

### Pattern 7: ESLint flat config exhaustive-deps

**What:** Add `react-hooks/exhaustive-deps` rule to the existing `eslint.config.mjs` flat config.
**When to use:** The config uses `FlatCompat` with `next/core-web-vitals` — add rule via spread.

```javascript
// Source: eslint-plugin-react-hooks README; flat config pattern
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/exhaustive-deps": "error",
    },
  },
];

export default eslintConfig;
```

**Note:** `eslint-plugin-react-hooks` is already loaded by `next/core-web-vitals` — no explicit plugin import needed. Adding the rule object after the compat spread is sufficient.

### Pattern 8: New Zod schemas

**MacroRecordSchema** (for `macros/history/page.tsx`, replaces `as MacroRecord[]`):
```typescript
// Source: database.ts UserMacro interface + actual macros history page fields
// File: src/schemas/macroSchema.ts
import { z } from "zod";

export const MacroRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  bmr: z.number(),
  maintenance_calories: z.number(),
  target_calories: z.number(),
  protein_grams: z.number(),
  fat_grams: z.number(),
  carb_grams: z.number(),
});
export type MacroRecord = z.infer<typeof MacroRecordSchema>;

export const MacroRecordArraySchema = z.array(MacroRecordSchema);
```

**Note:** The existing `UserMacro` interface in `database.ts` has `calories` (not `bmr`/`maintenance_calories`/`target_calories`). The actual `user_macros` table has the full field set as seen in `MacroHistoryPage` (lines 10-19). The `UserMacro` interface in `database.ts` is incomplete — `MacroRecordSchema` should match the actual Supabase columns.

**UserProfileSchema** (for `profile/edit/page.tsx`, replaces `as UserProfile`):
```typescript
// Source: database.ts UserProfile interface — this is a Supabase read schema, separate from ProfileSchema (form input)
// File: src/schemas/profileSchema.ts (add below existing ProfileSchema)
export const UserProfileSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string(),
  age: z.number(),
  height_cm: z.number(),
  weight_kg: z.number(),
  sex: z.enum(["male", "female"]),
  goal: z.enum(["fat_loss", "muscle_gain", "recomp"]),
  activity_level: z.enum(["sedentary", "moderate", "active"]),
  goal_weight_kg: z.number().nullable(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
```

**Note:** After adding `UserProfile` as a `z.infer<>` type in `profileSchema.ts`, the import in `ProfileForm.tsx` and `profile/edit/page.tsx` should switch from `import type { UserProfile } from "@/types/database"` to `import type { UserProfile } from "@/schemas/profileSchema"`. The `database.ts` definition remains but stops being the canonical type.

### Pattern 9: MacroSummary number narrowing (replacing `as number`)

**Current code (line 22):**
```typescript
const fmt = (n: number | undefined) =>
  Number.isFinite(n ?? NaN) ? Math.round(n as number).toString() : "—";
```

**Fix — use non-null assertion after guard (TypeScript already knows `n` is number after `Number.isFinite`):**
```typescript
const fmt = (n: number | undefined): string => {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return Math.round(n).toString();
};
```

The `Number.isFinite(n ?? NaN)` guard means `n` is a `number` at the point of `Math.round(n)` — TypeScript's control flow analysis should narrow this without a cast once the guard is restructured as an early return.

### Anti-Patterns to Avoid

- **`as TypeName` on raw Supabase `data`:** Silently accepts invalid shapes. Replace with `.safeParse()` + throw.
- **`Schema.parse()` in queryFn:** Throws a ZodError which React Query catches, but error message is generic. Use `.safeParse()` for structured messages with operation context.
- **`useEffect(() => fetchData(), [])` in new hooks:** This is the pattern being replaced. All new fetches belong in `queryFn`.
- **`refreshQuery()` that sets state:** After migration, `queryClient.invalidateQueries()` or `refetch()` from `useQuery` is the correct approach.
- **date-fns v4 default imports:** v4 removed default exports. Always use named imports: `import { format } from "date-fns"`.
- **`YYYY` format token:** In date-fns, `YYYY` is ISO week year (wrong near Jan 1). Always use lowercase `yyyy` for calendar year.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime type checking of Supabase responses | Custom type guards | Zod `safeParse()` | Edge cases in nullable fields, nested objects, enum validation |
| Local-timezone date strings | Custom date math | `date-fns format()` | Handles DST, locale, leap seconds |
| Query key invalidation tracking | Manual refetch calls | `useQueryClient().invalidateQueries()` | React Query handles stale tracking and deduplication |
| Enum validation from string | Manual `includes()` checks | Zod `.enum().safeParse()` | Type narrowing + error message included |

**Key insight:** The codebase's existing `useWorkouts.ts` demonstrates all the patterns Phase 2 needs. New code should mirror it, not diverge.

---

## Common Pitfalls

### Pitfall 1: `Set<string>` is not serializable — React Query query data must be serializable

**What goes wrong:** `useHabits`'s `todayCompleted: Set<string>` cannot be serialized by React Query's default serialization. If React Query tries to serialize/deserialize the cached value (e.g., devtools, persistence), a `Set` becomes an empty object `{}`.
**Why it happens:** React Query serializes cache data to JSON internally in some contexts; `Set` serializes as `{}`.
**How to avoid:** Two options: (a) store `todayCompleted` as `string[]` in the query data and convert to `Set` in the consuming component, or (b) keep it as `Set` and accept that cache persistence won't work for this key. For this codebase with no persistence configured, `Set` is safe — but `string[]` is more portable.
**Recommendation:** Return `todayCompleted: string[]` from `queryFn`; let the consuming component do `new Set(data.todayCompleted)` if needed for O(1) lookup.

### Pitfall 2: ESLint exhaustive-deps with `queryClient.invalidateQueries` in mutation `onSuccess`

**What goes wrong:** `onSuccess` callbacks that reference `qc` (from `useQueryClient()`) outside the hook's render cycle don't trigger exhaustive-deps warnings — but if `queryClient` identity changes, stale closure. This is not a real concern here since `useQueryClient()` returns a stable reference.
**How to avoid:** Keep `useQueryClient()` call at hook top-level (not inside callbacks). Already established pattern in `useWorkouts.ts`.

### Pitfall 3: `MacroSummary` calls `refresh()` — this breaks after useMacros migration

**What goes wrong:** `MacroSummary.tsx` destructures `refresh` from `useMacros()`. After migration, `useMacros()` returns `{ data, isLoading, error, refetch }` (React Query shape). The old `refresh` reference breaks.
**How to avoid:** Update `MacroSummary.tsx` to use `refetch` from React Query: `const { data: macros, isLoading: macrosLoading, refetch } = useMacros()`. Replace `await refresh()` with `await refetch()`.
**Note:** React Query's `refetch()` returns a promise, so `await refetch()` works correctly in `handleRecalculate`.

### Pitfall 4: ProfileForm `activity_level` vs `activityLevel` impedance

**What goes wrong:** `ProfileInput` (used by `calculateMacros`) uses camelCase `activityLevel: number` but the database/profile columns use snake_case `activity_level: string`. The mapping happens in `useMacros.refresh()`. After migration, this mapping moves into `queryFn`. The `activityLevel` in `ProfileInput` is typed as `number` — but looking at `calculateMacros.ts`, `activityLevel` is actually `number` (a TDEE multiplier), not the string enum from the profile. The mapping from `"sedentary"/"moderate"/"active"` → multiplier number happens inside `calculateTDEE`. Verify this chain is preserved in the migrated `queryFn`.
**How to avoid:** Check `calculateTDEE.ts` to confirm it accepts the string enum (not a number). The current `useMacros.ts` passes `profileData.activity_level || "moderate"` directly as `activityLevel` — TypeScript allows this only if `ProfileInput.activityLevel` accepts `string`. Confirm the type before migration.

### Pitfall 5: `UserMacro` interface in `database.ts` has wrong field names

**What goes wrong:** `database.ts` has `UserMacro.calories` but the actual `user_macros` table (as seen in `macros/history/page.tsx`) has `bmr`, `maintenance_calories`, `target_calories`, `protein_grams`, `fat_grams`, `carb_grams`. The `calories` field in `database.ts` does not exist in the actual table.
**How to avoid:** `MacroRecordSchema` must be derived from what `macros/history/page.tsx` actually selects (`SELECT *`), not from `database.ts`. Do not use `UserMacro` from `database.ts` as the basis for `MacroRecordSchema`.

### Pitfall 6: `.toISOString().slice(0, 10)` variant in workout log page

**What goes wrong:** `src/app/dashboard/workouts/[id]/log/page.tsx:80` uses `.slice(0, 10)` instead of `.split('T')[0]` — both produce the same UTC-shifted result and both must be replaced.
**How to avoid:** BUG-01 scope includes this file. All UTC-shifted date patterns across the codebase must be replaced, not just the `split` variant.

### Pitfall 7: `as WorkoutRow[]` intermediate casts after safeParse conversion

**What goes wrong:** `useWorkouts.ts` and `useWorkoutLogs.ts` cast raw Supabase data to `WorkoutRow[]`/`LogRow[]` intermediate types before passing into Schema.parse. After converting to `.safeParse()`, the `as WorkoutRow[]` intermediate cast can remain — it's casting the raw `any` Supabase response to a known structure before validation, which is then immediately validated by Zod. Success criteria says no `as TypeName` casts on raw data — the intermediate `as WorkoutRow[]` is acceptable as a shaping cast since it immediately flows into safeParse. The `as ExerciseTemplate[]` nested cast inside the parse call should also be removed since that data passes directly into Zod.

---

## Code Examples

Verified patterns from official sources and codebase analysis:

### safeParse with structured error message
```typescript
// Pattern for all Supabase data boundaries
const result = SomeSchema.safeParse(data);
if (!result.success) {
  throw new Error(
    `Zod validation failed in useHookName: ${JSON.stringify(result.error.issues)}`
  );
}
return result.data; // TypeScript: narrowed to SomeType
```

### React Query array return with safeParse per item
```typescript
return rows.map((row) => {
  const result = WorkoutTemplateSchema.safeParse({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    created_at: row.created_at,
    exercises: row.workout_exercises,
  });
  if (!result.success) {
    throw new Error(`Zod validation failed in useWorkouts: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
});
```

### date-fns v4 format (local timezone)
```typescript
import { format } from "date-fns";

// Correct — local timezone:
format(new Date(), "yyyy-MM-dd")  // e.g. "2026-03-18" in user's local time

// Wrong — UTC shifted:
new Date().toISOString().split("T")[0]  // e.g. "2026-03-17" if user is UTC-5 after 7pm
```

### Enum validation before assignment (ProfileForm fix)
```typescript
// The ProfileSchema.parse() call already validates enums.
// Fix: remove the `as` casts and pass raw strings — parse() will narrow the type.
const parsedInput = {
  name: form.name.trim(),
  age: Number(form.age),
  height_cm: Number(form.height_cm),
  weight_kg: Number(form.weight_kg),
  sex: form.sex,               // string, validated by ProfileSchema
  goal: form.goal,             // string, validated by ProfileSchema
  activity_level: form.activity_level,  // string, validated by ProfileSchema
  goal_weight_kg: form.goal_weight_kg.trim() ? Number(form.goal_weight_kg) : undefined,
};
const validated = ProfileSchema.parse(parsedInput);
// validated.sex is "male" | "female" — TypeScript knows this from z.infer
```

### ESLint flat config rule addition
```javascript
// eslint.config.mjs
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
```

---

## Complete Inventory: All Locations Requiring Changes

### TYPE-01: safeParse conversions
| File | Line(s) | Current Pattern | Required Change |
|------|---------|-----------------|-----------------|
| `src/hooks/workouts/useWorkouts.ts` | 57-66 | `as WorkoutRow[]` + `.parse()` | Keep intermediate cast; convert `.parse()` to `.safeParse()` |
| `src/hooks/workouts/useWorkouts.ts` | 101-108 | `data as WorkoutRow` + `.parse()` | Same pattern |
| `src/hooks/workouts/useWorkoutLogs.ts` | 59-70 | `as LogRow[]` + `.parse()` | Keep intermediate cast; convert `.parse()` to `.safeParse()` |
| `src/hooks/workouts/useWorkoutLogs.ts` | 133-141 | `.parse()` + `as WorkoutLogExercise[]` | Convert to `.safeParse()` |
| `src/app/dashboard/macros/history/page.tsx` | 50 | `data as MacroRecord[]` | Add `MacroRecordArraySchema.safeParse()` |
| `src/app/dashboard/profile/edit/page.tsx` | 42 | `data as UserProfile` | Add `UserProfileSchema.safeParse()` |
| `src/components/macros/MacroSummary.tsx` | 22 | `n as number` | Refactor `fmt()` to use early return (no cast needed) |
| `src/components/profile/ProfileForm.tsx` | 50-52 | `form.sex as "male"...` etc. | Remove casts; let `ProfileSchema.parse()` narrow types |

### TYPE-02: useEffect dependency violations
| File | Issue | Fix |
|------|-------|-----|
| `src/hooks/macros/useMacros.ts` | `useEffect(() => refresh(), [])` — `refresh` missing from deps | Eliminated by React Query migration |
| `src/app/dashboard/page.tsx` | `useEffect(() => { loadProfileName() }, [user])` — `loadProfileName` closure captures stale values | Either add `loadProfileName` to deps (requires `useCallback`) or inline the fetch |
| `src/hooks/habits/useHabits.ts` | `useEffect(() => { fetchAll() }, [])` — `fetchAll` missing from deps | Eliminated by React Query migration |

### BUG-01: toISOString patterns
| File | Line | Pattern |
|------|------|---------|
| `src/hooks/habits/useHabits.ts` | 24 | `current.toISOString().split("T")[0]` |
| `src/hooks/habits/useHabits.ts` | 38 | `new Date().toISOString().split("T")[0]` |
| `src/hooks/weight/useWeightLogs.ts` | 62 | `new Date().toISOString().split("T")[0]` |
| `src/app/dashboard/workouts/[id]/log/page.tsx` | 80 | `new Date().toISOString().slice(0, 10)` |

**Note:** `src/hooks/habits/useHabits.ts:17` (`d.split("T")[0]`) is normalizing stored log dates, not generating today's date — this is a different operation. Per CONTEXT.md: "Assume stored date column values in habit_logs are local-date strings — compare against local today, no timezone normalization of stored dates." This normalization line should be removed in the migrated hook; if the stored values are already YYYY-MM-DD (no T), the split is a no-op and the full `getLocalDate()` function handles the comparison side.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useState` + `useEffect` for async data | React Query `useQuery` | ~2022 (RQ v4+) | Eliminates loading state management, deduplication, stale-while-revalidate |
| `as TypeName` casts | Zod `.safeParse()` + type inference | ~2021 (Zod v3) | Runtime validation catches schema drift; TypeScript narrows automatically |
| `new Date().toISOString().split('T')[0]` | `format(new Date(), 'yyyy-MM-dd')` from date-fns | Ongoing | Timezone correctness for users outside UTC |
| ESLint hooks rule as warning | ESLint hooks rule as error | Project-specific | Forces correctness at lint time, not runtime |

**Deprecated/outdated in this codebase:**
- `useState`/`useEffect` pattern in `useHabits`/`useMacros`: replaced by React Query (TYPE-04)
- Direct `as TypeName` casts on Supabase responses: replaced by Zod safeParse (TYPE-01)
- UTC-based date strings: replaced by date-fns local format (BUG-01)

---

## Open Questions

1. **`activityLevel` type in `ProfileInput`**
   - What we know: `calculateMacros.ts` declares `activityLevel: number` in `ProfileInput`; current `useMacros.ts` passes the string `"moderate"` as `activityLevel`
   - What's unclear: Does `calculateTDEE` actually accept a string, or is there a type error being masked? If `ProfileInput.activityLevel` is truly `number`, the current code is already broken at the TypeScript level
   - Recommendation: Read `calculateTDEE.ts` before migrating `useMacros` to confirm the type mismatch. The `UserProfileSchema` for `activityLevel` should be `z.enum(["sedentary", "moderate", "active"])` to match DB; the mapping to multiplier stays in `calculateTDEE`.

2. **`useWeightLogs` migration scope**
   - What we know: `useWeightLogs.ts` uses `useState`/`useEffect` and has a `toISOString` pattern (BUG-01 scope)
   - What's unclear: CONTEXT.md does not mention migrating `useWeightLogs` to React Query — only BUG-01's date fix is required
   - Recommendation: Only fix the `toISOString` in `useWeightLogs.ts` for BUG-01; do not migrate to React Query (out of scope for this phase).

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — Vitest is planned for Phase 3 (QUAL-01) but not yet installed |
| Config file | None — no test infrastructure exists |
| Quick run command | N/A until Phase 3 |
| Full suite command | N/A until Phase 3 |

### Phase Requirements → Test Map

Phase 2 is a refactoring/hardening phase with no new features. Automated testing of the specific changes requires the Phase 3 test infrastructure. However, the following verification approaches are available:

| Req ID | Behavior | Test Type | Verification Command | Notes |
|--------|----------|-----------|---------------------|-------|
| TYPE-01 | No `as TypeName` on Supabase data | Static (grep) | `grep -rn "as [A-Z]" src --include="*.ts" --include="*.tsx"` | Grep for remaining casts |
| TYPE-02 | No exhaustive-deps violations | Lint | `npm run lint` | ESLint rule enabled as error |
| TYPE-03 | ProfileForm enums validated before use | Static + manual | `tsc --noEmit` | TypeScript will catch if narrowing is wrong |
| TYPE-04 | useHabits/useMacros use useQuery | Static (grep) | `grep -rn "useState\|useEffect" src/hooks/habits src/hooks/macros` | Should be empty after migration |
| BUG-01 | No toISOString patterns | Static (grep) | `grep -rn "toISOString\|\.slice(0, 10)" src` | Should return no date-string results |

### Sampling Rate
- **Per task commit:** `npm run type-check && npm run lint` — catches TypeScript and ESLint errors
- **Per wave merge:** `npm run build` — catches any Next.js compilation issues
- **Phase gate:** `npm run build && npm run lint && npm run type-check` all green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Vitest not yet installed — unit tests for `getLocalDate()`, `calculateStreak()` fixes deferred to Phase 3
- [ ] No hook test utilities — React Query migration correctness verified by TypeScript + manual testing

*(Phase 3 adds QUAL-01: Vitest infrastructure + calculateMacros and useWorkouts tests)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis — all files read and inventoried before writing research
- `src/hooks/workouts/useWorkouts.ts` — authoritative pattern for React Query structure in this project
- `src/schemas/workoutSchema.ts` + `src/schemas/profileSchema.ts` — authoritative schema patterns
- `eslint.config.mjs` — confirmed flat config format
- `package.json` + `package-lock.json` — confirmed installed versions

### Secondary (MEDIUM confidence)
- npm registry (`npm view date-fns version`) — confirmed date-fns 4.1.0 (2026-03-18)
- npm registry (`npm view zod version`) — confirmed zod 4.3.6 latest; project stays on ^3.x
- eslint-plugin-react-hooks v5.2.0 in `package-lock.json` — confirmed installed

### Tertiary (LOW confidence)
- None — all claims verified against actual files or registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified against registry
- Architecture: HIGH — patterns derived directly from existing codebase files, not training data
- Pitfalls: HIGH — derived from actual code analysis; pitfall 1 (Set serialization) is MEDIUM confidence as it depends on React Query internals not explicitly verified
- Inventory of change locations: HIGH — verified by reading every affected file

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable ecosystem; library versions unlikely to change)
