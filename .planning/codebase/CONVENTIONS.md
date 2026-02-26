# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `Button.tsx`, `MacroSummary.tsx`, `Card.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useWorkouts.ts`, `useMacros.ts`, `useUser.ts`)
- Utility/helper files: camelCase (e.g., `calculateBMR.ts`, `supabaseClient.ts`, `utils.ts`)
- Schema files: camelCase with `Schema` suffix (e.g., `profileSchema.ts`, `workoutSchema.ts`)
- Type definition files: camelCase (e.g., `database.ts`)
- Pages: use Next.js routing convention with lowercase directories and filenames (e.g., `page.tsx`, `[id]/page.tsx`)

**Functions:**
- Exported hook functions: start with `use` prefix (e.g., `useWorkouts()`, `useCreateWorkout()`, `useMacros()`)
- Event handlers: `handle` prefix (e.g., `handleLogout`, `handleRecalculate`, `handleSave`)
- Utility functions: plain camelCase (e.g., `calculateBMR()`, `calculateMacros()`, `cn()`)
- Internal helper functions: camelCase without special prefix
- Query hooks (tanstack/react-query): `useQuery`, `useMutation` for creating queries/mutations

**Variables:**
- Local state: camelCase (e.g., `userName`, `targetCalories`, `isRecalculating`, `macrosLoading`)
- Database columns: snake_case (e.g., `user_id`, `weight_kg`, `activity_level`)
- Type definitions from database: snake_case (matches database schema)
- Component props objects: camelCase (e.g., `targetCalories`, `proteinGrams`)
- Boolean flags: prefix with `is` or `has` (e.g., `isLoading`, `isRecalculating`, `isSaving`)

**Types:**
- Exported interface types: PascalCase (e.g., `UserProfile`, `Habit`, `HabitLog`, `WeightLog`, `UserMacro`)
- Zod schema objects: PascalCase + `Schema` suffix (e.g., `ProfileSchema`, `WorkoutTemplateSchema`, `ExerciseTemplateSchema`)
- Type aliases from `z.infer`: PascalCase (e.g., `WorkoutTemplate`, `ExerciseTemplate`, `WorkoutLog`)
- Row types from database queries: PascalCase + `Row` suffix (e.g., `ExerciseRow`, `WorkoutRow`)
- Props interfaces: PascalCase + `Props` suffix (e.g., `ButtonProps`)

## Code Style

**Formatting:**
- No explicit prettier config file; follows Next.js defaults
- Line length appears consistent around 80-100 characters
- Indentation: 2 spaces (inferred from all source files)
- Semicolons: Always present at end of statements

**Linting:**
- ESLint with Next.js config: `eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript`
- Rule: Enforces TypeScript strict mode via `tsconfig.json`
- Focus on core web vitals compliance and Next.js best practices

**TypeScript:**
- `strict: true` enabled in `tsconfig.json`
- Target: ES2017
- Module resolution: bundler
- Path alias: `@/*` maps to `./src/*`
- JSX: `preserve` (handled by Next.js)

## Import Organization

**Order:**
1. React and Next.js imports (e.g., `import { useEffect, useState } from "react"`)
2. Third-party library imports (e.g., `import { useQuery, useMutation } from "@tanstack/react-query"`)
3. Internal absolute imports using `@/` alias (e.g., `import { supabase } from "@/lib/supabaseClient"`)
4. Blank line between groups

**Path Aliases:**
- `@/*` resolves to `./src/*` (configured in `tsconfig.json`)
- All internal imports use absolute `@/` paths, never relative paths
- Examples: `@/lib/`, `@/hooks/`, `@/utils/`, `@/schemas/`, `@/types/`, `@/components/`

**Example pattern from `src/hooks/workouts/useWorkouts.ts`:**
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  WorkoutTemplateSchema,
  WorkoutTemplate,
  ExerciseTemplate,
} from "@/schemas/workoutSchema";
```

## Error Handling

**Patterns:**
- Supabase operations: Check `error` and `data` destructured from response
- Pattern: `const { data, error } = await supabase...`
- Error throwing: `if (error) throw error;` or `if (error || !data) throw error || new Error("message")`
- User-facing errors: Display via `toast.error()` from react-hot-toast
- Console logging for debugging: `console.error()` called with descriptive message

**Example from `src/app/dashboard/page.tsx`:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from("user_profiles")
  .select("name")
  .eq("user_id", user.id)
  .maybeSingle();

if (profileError) {
  console.error("Failed to load profile name:", profileError.message);
  setUserName("User");
} else {
  setUserName(profile?.name ?? "User");
}
```

**Mutation error handling:**
- Mutations provide `error` in response object
- Handle with try-catch for exceptions, null-check for missing data
- User notification: Always call `toast.error()` for failed operations

## Logging

**Framework:** `console` for development; `react-hot-toast` for user notifications

**Patterns:**
- `console.error()`: Used for unexpected errors and debugging (e.g., database errors, async failures)
- `toast.error()`: User-facing error messages (e.g., "Failed to save macros")
- `toast.success()`: Confirmation messages on successful operations
- No info or debug logging present in codebase; minimal console usage

**Example from `src/hooks/macros/useMacros.ts`:**
```typescript
try {
  // ... async operations
} catch (err) {
  console.error("useMacros refresh error:", err);
  toast.error("Failed to calculate macros");
  setMacros(null);
}
```

## Comments

**When to Comment:**
- File-level comments: JSDoc-style comments for exported functions and types
- Inline comments: Minimal; code is self-documenting
- Workflow comments: Numbered steps for multi-step processes (e.g., `// 1)`, `// 2)`, `// 3)`)

**JSDoc/TSDoc:**
- Used for exported functions and public APIs
- Format: `/** Description */` on line before function
- Example from `src/schemas/profileSchema.ts`:
```typescript
/**
 * Zod schema for validating user profile input.
 */
export const ProfileSchema = z.object({
```

**Workflow documentation:**
- Complex functions document steps as numbered comments
- Example from `src/hooks/workouts/useWorkouts.ts`:
```typescript
/** 1) Fetch all workout templates (with exercises) */
export function useWorkouts() {
  return useQuery<WorkoutTemplate[], Error>({
    queryFn: async () => {
      // ... implementation
```

## Function Design

**Size:** Functions are typically 10-50 lines; utility functions are 2-15 lines

**Parameters:**
- Named parameters preferred; objects for multiple parameters
- Example: `calculateBMR(weightKg: number, heightCm: number, age: number, sex: "male" | "female")`
- Mutation functions accept single parameter object: `useMutation<ReturnType, ErrorType, VariableType>`

**Return Values:**
- Explicit return types on all exported functions
- Utility functions return calculated/transformed values
- Hooks return objects with named properties (e.g., `{ macros, loading, refresh }`)
- Query hooks return standard tanstack/react-query shape: `{ data, error, isLoading, isPending }`

**Example from `src/utils/macros/calculateBMR.ts`:**
```typescript
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: "male" | "female"
): number {
  return sex === "male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}
```

## Module Design

**Exports:**
- Named exports preferred for all functions and types
- Default exports used only for React components and pages
- Example from `src/components/ui/Button.tsx`:
```typescript
export function Button({ /* props */ }: ButtonProps) {
  // ...
}
```

**Barrel Files:**
- Not explicitly used; each file exported individually
- Components imported directly: `import { Button } from "@/components/ui/Button"`

**Organization:**
- Each feature has its own directory with domain-specific files
- `src/hooks/[domain]/use*.ts` for hooks
- `src/components/[domain]/ComponentName.tsx` for components
- `src/utils/[domain]/functionName.ts` for utilities
- Schemas grouped in `src/schemas/`
- Types grouped in `src/types/`

---

*Convention analysis: 2026-02-26*
