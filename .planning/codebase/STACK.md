# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- TypeScript 5.x - Full codebase implementation, strict mode enabled

**Secondary:**
- JavaScript (JSX/TSX) - React component syntax throughout

## Runtime

**Environment:**
- Node.js (no specific version pinned - uses system default)

**Package Manager:**
- npm (based on package-lock.json)
- Lockfile: `package-lock.json` present (229KB)

## Frameworks

**Core:**
- Next.js 15.3.2 - Full-stack React framework with server/client components
- React 19.0.0 - UI library with hooks and strict mode

**State Management:**
- TanStack React Query 5.80.6 - Server state management, caching, and synchronization

**Styling:**
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- PostCSS 8.x - CSS processing pipeline

**UI Utilities:**
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.3.0 - Merge Tailwind classes intelligently
- tailwindcss-animate 1.0.7 - Animation plugin for Tailwind

**Icons:**
- lucide-react 0.513.0 - Icon library for React

**Typography:**
- @fontsource/inter 5.2.5 - Inter font imported for use in styles

**Charts:**
- chart.js 4.4.9 - Chart library for data visualization
- react-chartjs-2 5.3.0 - React wrapper for Chart.js

**Validation:**
- zod 3.25.56 - Runtime schema validation and type inference

**Notifications:**
- react-hot-toast 2.5.2 - Toast notification library

## Testing Framework

**Not detected** - No test runners or testing frameworks configured in dependencies

## Build/Dev Tools

**Linting:**
- ESLint 9.x - Code quality analysis
- @eslint/eslintrc 3.x - ESLint config compatibility layer
- eslint-config-next 15.1.8 - Next.js ESLint configuration

**Type Checking:**
- TypeScript compiler - `tsc --noEmit` command available

**Development Server:**
- Next.js dev server - Included in Next.js framework

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.50.0 - Supabase SDK (currently in devDependencies but used throughout)
- @tanstack/react-query 5.80.6 - Essential for all server state management

**Infrastructure:**
- next 15.3.2 - Core framework
- react 19.0.0, react-dom 19.0.0 - React runtime
- typescript 5.x - Type checking

## Configuration

**Environment:**
- `.env.local` file present - Contains environment configuration
- NEXT_PUBLIC_SUPABASE_URL - Required (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Required (public)

**Build Configuration:**
- `next.config.ts` - Next.js configuration (minimal, no custom options)
- `tsconfig.json` - TypeScript configuration with path aliases
  - Strict mode: enabled
  - Target: ES2017
  - Module resolution: bundler
  - Path alias: `@/*` → `./src/*`

**Styling Configuration:**
- `tailwind.config.ts` - Custom color palette with primary, secondary, neutral colors
- `postcss.config.mjs` - PostCSS pipeline with Tailwind integration

**Linting Configuration:**
- `eslint.config.mjs` - Flat config format using ESLint with Next.js + TypeScript rules

## Platform Requirements

**Development:**
- Node.js (version not specified)
- npm package manager
- Modern browser with ES2017 support

**Production:**
- Node.js runtime (for Next.js server)
- Deployment platform supporting Node.js (Vercel, AWS, etc.)

---

*Stack analysis: 2026-02-26*
