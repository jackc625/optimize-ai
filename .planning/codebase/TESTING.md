# Testing Patterns

**Analysis Date:** 2026-02-26

## Test Framework

**Status:** Not configured

**Current State:**
- No test runner installed (Jest, Vitest, Playwright not in dependencies)
- No test configuration files present in project root
- No test files exist in `src/` directory
- No test scripts in `package.json`

**Recommendation for Future Setup:**
When testing is added to this project, consider:
- **Unit tests:** Vitest (modern, fast, ESM-native) or Jest
- **Component tests:** React Testing Library (component behavior testing)
- **E2E tests:** Playwright or Cypress (full user flow testing)
- **Type checking:** Already covered by `tsc --noEmit` (available via `npm run type-check`)

## Current Testing Approach

**Type Safety:** Primary testing mechanism
- TypeScript strict mode enabled: `strict: true` in `tsconfig.json`
- Run type checking: `npm run type-check` executes `tsc --noEmit`
- All function parameters and return types are explicitly typed
- Zod schema validation provides runtime type checking

**Example from `src/schemas/profileSchema.ts`:**
```typescript
export const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z
    .number({ invalid_type_error: "Age must be a number" })
    .int("Age must be an integer")
    .min(10, "Age must be at least 10")
    .max(120, "Age must be 120 or less"),
  // ... additional fields with validation
});
```

**Zod Validation:**
- All database-sourced data validated against schemas at parse time
- Pattern: `WorkoutTemplateSchema.parse({ ... })` after Supabase queries
- Provides runtime type safety for database responses
- Throws on validation failure; errors bubble up to error handlers

## Error Handling as Testing

**Pattern:** Explicit error handling replaces unit tests in current implementation

**Example from `src/hooks/workouts/useWorkouts.ts`:**
```typescript
if (error || !data) throw error || new Error("Workout not found");
const row = data as WorkoutRow;
return WorkoutTemplateSchema.parse({
  id: row.id,
  user_id: row.user_id,
  name: row.name,
  created_at: row.created_at,
  exercises: row.workout_exercises as ExerciseTemplate[],
});
```

**User-facing error handling:**
```typescript
if (error) {
  console.error("Failed to load profile name:", profileError.message);
  setUserName("User");
}
```

## Query Validation

**tanstack/react-query usage:**
- Query key structure enforces consistency: `["workouts"]`, `["workout", workoutId]`
- Query state monitored: `isLoading`, `error`, `data` properties
- Mutation state: `isPending`, `error`, `data` tracked per operation

**Example from `src/app/dashboard/page.tsx`:**
```typescript
const {
  data: workouts,
  isLoading: workoutsLoading,
  error: workoutsError,
} = useWorkouts();

// Usage patterns
if (isLoading) return <LoadingState />;
if (error) return <ErrorState message={error.message} />;
return <SuccessState data={workouts} />;
```

## Testable Code Patterns (Current)

**Pure utility functions:**
- All macro calculation utilities are pure functions with no side effects
- Example: `calculateBMR()`, `calculateTDEE()`, `getMacroSplit()`
- Could easily be unit tested without mocking

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

**Hook structure:**
- Hooks separate data fetching from UI rendering
- Hooks return typed objects with clear state
- Pattern makes testing possible via mocking Supabase calls

**Example from `src/hooks/macros/useMacros.ts`:**
```typescript
export function useMacros() {
  const [macros, setMacros] = useState<MacroOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      // ... fetch and calculate
      setMacros(result);
    } catch (err) {
      console.error("useMacros refresh error:", err);
      toast.error("Failed to calculate macros");
      setMacros(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { macros, loading, refresh };
}
```

## Integration Testing Approach

**Current pattern:** Manual testing via UI and browser console

**Database integration:**
- Supabase client used directly in hooks and components
- Error handling ensures graceful degradation
- Type safety via Zod validation

**Example flow from `src/app/dashboard/workouts/new/page.tsx`:**
```typescript
const handleCreate = async (workoutName: string) => {
  try {
    await create.mutateAsync({ user_id: userId, name: workoutName });
    router.push("/dashboard/workouts");
  } catch (err) {
    if (err instanceof Error) {
      console.error("Create workout error:", err.message);
    } else {
      console.error("Unexpected error:", String(err));
    }
  }
};
```

## What Would Be Tested (Future Implementation)

### Unit Tests
**Utility functions:**
- `calculateBMR()` - verify formulas for male/female with known inputs
- `calculateTDEE()` - verify activity level multipliers
- `getMacroSplit()` - verify macro percentages for different goals
- `cn()` - verify clsx + tailwind-merge behavior

**Zod schemas:**
- ProfileSchema validation with valid/invalid inputs
- WorkoutTemplateSchema parsing
- Error messages on validation failure

### Component Tests
**Button component (`src/components/ui/Button.tsx`):**
- Render with different variants (primary, outline, ghost)
- Render with different sizes (sm, md, lg)
- Click handler invoked correctly
- Disabled state prevents clicks
- Accessibility: focus ring, ARIA attributes

**Card component (`src/components/ui/Card.tsx`):**
- Render with header, content, footer sections
- CSS class composition correct
- Theme CSS variables applied

**MacroSummary component (`src/components/macros/MacroSummary.tsx`):**
- Loading states render correctly
- Auth check prevents rendering when no user
- Form inputs update state
- Save button calls mutation with correct payload
- Error toast on save failure

### Integration Tests
**Hook integration with Supabase:**
- `useWorkouts()` fetches and parses data correctly
- `useCreateWorkout()` mutation updates query cache
- `useMacros()` calculates macros from profile
- Error states handled gracefully

**Page flows:**
- Dashboard requires authentication
- Profile setup redirects to dashboard on complete
- Workout creation and logging flow

### E2E Tests
**User workflows:**
- Sign up → Create profile → View macros
- Create workout → Log exercises → View history
- Edit profile and recalculate macros
- Delete workout and verify removal

## Code Coverage Targets (If Implemented)

**Current:** No coverage tracking

**Recommended targets when testing is added:**
- Utility functions: 100% coverage (calculation logic critical)
- Hooks: 80%+ coverage (focus on error paths)
- Components: 70%+ coverage (UI testing less critical than logic)
- Overall: 75%+ project coverage

## Where Tests Would Live

**Co-located pattern (Recommended for this project):**
```
src/
├── utils/macros/
│   ├── calculateBMR.ts
│   └── calculateBMR.test.ts
├── hooks/workouts/
│   ├── useWorkouts.ts
│   └── useWorkouts.test.ts
├── components/ui/
│   ├── Button.tsx
│   └── Button.test.tsx
```

**Test file naming:**
- `*.test.ts` or `*.test.tsx` for all test files
- Placed in same directory as source file

## Mocking Strategy (Future)

**What to mock:**
- Supabase client calls in hooks and components
- `useQueryClient` in mutation tests
- `react-hot-toast` notifications in component tests

**What NOT to mock:**
- Pure utility functions (calculateBMR, etc.)
- Zod schema parsing (test with real data)
- Type definitions

**Mock library recommendation:** Vitest's `vi.mock()` or Jest's `jest.mock()`

**Example mock pattern (conceptual):**
```typescript
// vitest.config.ts would configure mock resolution
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: "Test User" },
            error: null,
          }),
        }),
      }),
    }),
  },
}));
```

## Commands to Add (When Testing Framework Installed)

```bash
npm run test                # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run lint              # ESLint (already available)
npm run type-check        # TypeScript check (already available)
```

---

*Testing analysis: 2026-02-26*
