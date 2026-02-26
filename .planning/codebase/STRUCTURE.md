# Codebase Structure

**Analysis Date:** 2026-02-26

## Directory Layout

```
optimize-ai/
├── src/
│   ├── app/                       # Next.js App Router (routes & pages)
│   │   ├── auth/
│   │   │   ├── login/page.tsx     # Sign-in page
│   │   │   └── signup/page.tsx    # Sign-up page
│   │   ├── dashboard/
│   │   │   ├── habits/page.tsx    # Habits tracking
│   │   │   ├── macros/
│   │   │   │   └── history/page.tsx  # Macro history
│   │   │   ├── profile/
│   │   │   │   ├── edit/page.tsx  # Edit profile
│   │   │   │   └── setup/page.tsx # Initial profile setup
│   │   │   ├── weight/page.tsx    # Weight tracking
│   │   │   ├── workouts/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx   # Workout detail
│   │   │   │   │   └── log/page.tsx  # Log workout
│   │   │   │   ├── new/page.tsx   # Create new workout
│   │   │   │   └── page.tsx       # Workouts list
│   │   │   ├── layout.tsx         # Dashboard wrapper (nav, auth guard)
│   │   │   └── page.tsx           # Dashboard home
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   └── providers.tsx          # React Query provider
│   ├── components/                # React components
│   │   ├── macros/
│   │   │   └── MacroSummary.tsx   # Macro calculation & editing
│   │   ├── profile/
│   │   │   └── ProfileForm.tsx    # User profile form
│   │   ├── ui/
│   │   │   ├── Button.tsx         # Button component (primary, outline, ghost)
│   │   │   └── Card.tsx           # Card component (layout wrapper)
│   │   └── weight/
│   │       └── WeightChart.tsx    # Weight tracking visualization
│   ├── hooks/                     # Custom React hooks
│   │   ├── habits/
│   │   │   └── useHabits.ts       # Habit CRUD
│   │   ├── macros/
│   │   │   └── useMacros.ts       # Fetch profile & calculate macros
│   │   ├── profile/
│   │   │   └── useUser.ts         # Auth state management
│   │   ├── weight/
│   │   │   └── useWeightLogs.ts   # Weight log CRUD
│   │   └── workouts/
│   │       ├── useWorkoutExercises.ts  # Exercise management
│   │       ├── useWorkoutLogs.ts       # Workout log CRUD
│   │       └── useWorkouts.ts          # Workout template CRUD
│   ├── lib/                       # Utilities & clients
│   │   ├── supabaseClient.ts      # Supabase JS client instance
│   │   └── utils.ts               # Tailwind helper functions
│   ├── schemas/                   # Zod validation schemas
│   │   ├── profileSchema.ts       # Profile form validation
│   │   └── workoutSchema.ts       # Workout data validation
│   ├── types/                     # TypeScript type definitions
│   │   └── database.ts            # Database table interfaces
│   └── utils/                     # Business logic utilities
│       └── macros/
│           ├── calculateBMR.ts    # Basal Metabolic Rate
│           ├── calculateMacros.ts # Macro coordinator
│           ├── calculateTDEE.ts   # Total Daily Energy Expenditure
│           └── getMacroSplit.ts   # Protein/carb/fat distribution
├── public/                        # Static assets
├── .env.local                     # Environment config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind CSS config
├── postcss.config.mjs             # PostCSS config
├── next.config.ts                 # Next.js config
├── eslint.config.mjs              # ESLint config
└── .planning/                     # GSD planning directory
```

## Directory Purposes

**src/app/:**
- Purpose: Next.js App Router routes and page components
- Contains: Page.tsx files, layout.tsx files, auth flows, dashboard pages
- Key files: `layout.tsx` (root), `providers.tsx` (React Query)

**src/components/:**
- Purpose: Reusable React components
- Contains: UI primitives (Button, Card), domain components (MacroSummary, ProfileForm, WeightChart)
- Organized by: Feature area (macros, profile, ui, weight)

**src/hooks/:**
- Purpose: Custom React hooks for data fetching and state management
- Contains: React Query queries and mutations, Supabase calls, auth listeners
- Organized by: Feature area (habits, macros, profile, weight, workouts)
- Pattern: Each hook file exports 1-5 related hooks (fetch, create, update, delete)

**src/lib/:**
- Purpose: Infrastructure and shared utilities
- Contains: Supabase client singleton, Tailwind merge utility
- Key files: `supabaseClient.ts` (used by all hooks), `utils.ts` (CSS utilities)

**src/schemas/:**
- Purpose: Zod validation schemas for runtime type safety
- Contains: Profile and workout validation schemas
- Pattern: Each schema file exports Zod object and inferred TypeScript type

**src/types/:**
- Purpose: TypeScript interface definitions matching database schema
- Contains: Database table interfaces (UserProfile, Habit, WeightLog, etc.)
- Key files: `database.ts` (all table interfaces)

**src/utils/:**
- Purpose: Pure business logic and calculations
- Contains: Macro calculation functions (BMR, TDEE, split logic)
- Organized by: Feature area (macros/)
- Pattern: Pure functions, no side effects, typed input/output

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout, metadata, Toaster, Providers wrapper
- `src/app/page.tsx`: Home page (landing)
- `src/app/auth/login/page.tsx`: Sign-in page
- `src/app/auth/signup/page.tsx`: Sign-up page
- `src/app/dashboard/layout.tsx`: Dashboard wrapper with nav and auth guard
- `src/app/dashboard/page.tsx`: Dashboard home

**Configuration:**
- `src/app/providers.tsx`: React Query client initialization
- `src/lib/supabaseClient.ts`: Supabase client instance
- `tsconfig.json`: TypeScript config with path alias `@/*` → `src/*`
- `tailwind.config.ts`: CSS variable colors, theme configuration

**Core Logic:**
- `src/hooks/profile/useUser.ts`: Authentication state
- `src/hooks/macros/useMacros.ts`: Profile fetch + macro calculation
- `src/hooks/workouts/useWorkouts.ts`: Workout template CRUD
- `src/hooks/workouts/useWorkoutLogs.ts`: Workout log CRUD
- `src/utils/macros/calculateMacros.ts`: Macro calculation coordinator

**Components:**
- `src/components/ui/Button.tsx`: Button primitive (variants: primary, outline, ghost)
- `src/components/ui/Card.tsx`: Card layout primitive
- `src/components/macros/MacroSummary.tsx`: Macro display + editable overrides
- `src/components/profile/ProfileForm.tsx`: User profile form

**Database Types:**
- `src/types/database.ts`: UserProfile, Habit, HabitLog, WeightLog, UserMacro interfaces
- `src/schemas/workoutSchema.ts`: WorkoutTemplate, WorkoutLog, ExerciseTemplate Zod schemas

**Utilities:**
- `src/utils/macros/calculateBMR.ts`: Mifflin-St Jeor equation for BMR
- `src/utils/macros/calculateTDEE.ts`: Multiply BMR by activity multiplier
- `src/utils/macros/getMacroSplit.ts`: Distribute calories to protein/carbs/fat
- `src/lib/utils.ts`: Tailwind merge utility for class composition

## Naming Conventions

**Files:**
- React components: PascalCase + .tsx (e.g., `Button.tsx`, `MacroSummary.tsx`)
- Hooks: camelCase, prefix `use` + .ts (e.g., `useWorkouts.ts`, `useMacros.ts`)
- Utils/Functions: camelCase + .ts (e.g., `calculateBMR.ts`, `getMacroSplit.ts`)
- Schemas: camelCase + Schema suffix + .ts (e.g., `workoutSchema.ts`, `profileSchema.ts`)
- Types: camelCase + .ts (e.g., `database.ts`)
- Pages: kebab-case directories, `page.tsx` files (e.g., `src/app/dashboard/macros/history/page.tsx`)

**Directories:**
- Feature areas: lowercase, plural when grouping multiple related items (e.g., `hooks/workouts/`, `components/macros/`)
- Dynamic routes: square brackets for parameters (e.g., `[id]`, `[date]`)

**TypeScript:**
- Interfaces: PascalCase with descriptive names (e.g., `UserProfile`, `WorkoutTemplate`, `MacroOutput`)
- Types: PascalCase (e.g., `ProfileInput`)
- Enums/Unions: PascalCase or quoted strings for database enums (e.g., `"fat_loss" | "muscle_gain" | "recomp"`)

**Functions:**
- Hooks: `useXxx` pattern (e.g., `useWorkouts`, `useMacros`)
- Component exports: PascalCase (e.g., `export function Button`)
- Utilities: camelCase with descriptive verb+noun (e.g., `calculateBMR`, `getMacroSplit`)

## Where to Add New Code

**New Feature Module:**
- Route/Pages: Create directory in `src/app/dashboard/[feature]/` with `page.tsx` and `layout.tsx` as needed
- Component: Create `src/components/[feature]/` with feature-specific components
- Hook: Create `src/hooks/[feature]/` with data fetching hooks
- Schema: Add to `src/schemas/[feature]Schema.ts` if data validation needed
- Types: Add interfaces to `src/types/database.ts` if new database table

**New Component:**
- UI primitive (Button, Card style): `src/components/ui/[ComponentName].tsx`
- Feature component (MacroSummary, ProfileForm): `src/components/[feature]/[ComponentName].tsx`
- Compound component: Export multiple related components from single file

**New Hook:**
- Data fetching: `src/hooks/[feature]/use[Entity].ts`
- Pattern: Export related queries/mutations in same file (e.g., `useWorkouts`, `useCreateWorkout`, `useUpdateWorkout`, `useDeleteWorkout`)
- Use React Query with `useQuery`, `useMutation`, and `useQueryClient` for cache management

**New Calculation/Utility:**
- Pure function: `src/utils/[feature]/[actionName].ts`
- Pattern: Typed parameters → computation → typed return
- Example: `calculateBMR(weight, height, age, sex): number`

**New Database Type:**
- Add interface to `src/types/database.ts` matching table schema
- If validation needed: create `src/schemas/[name]Schema.ts` with Zod

**New API Integration:**
- Client instance: Extend `src/lib/supabaseClient.ts` or create new `src/lib/[service]Client.ts`
- Calls: Keep in hooks, not in components
- Error handling: Toast notification + console.error in hook try/catch

## Special Directories

**src/.next/:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Dependencies
- Generated: Yes (from package.json)
- Committed: No (in .gitignore)

**public/:**
- Purpose: Static assets (images, icons, fonts)
- Generated: No
- Committed: Yes

**.env.local:**
- Purpose: Local environment configuration
- Contains: Supabase URL, anon key (public), local overrides
- Committed: No (in .gitignore)

**.planning/:**
- Purpose: GSD (Get Stuff Done) planning documents
- Generated: Yes (by orchestrator)
- Committed: Yes (for documentation)

## Path Aliases

**@/\*:**
- Maps to: `src/*`
- Usage: Import from project root with `@/` prefix
- Examples: `@/hooks/useWorkouts`, `@/components/ui/Button`, `@/lib/supabaseClient`
- Configured in: `tsconfig.json` → `compilerOptions.paths`

---

*Structure analysis: 2026-02-26*
