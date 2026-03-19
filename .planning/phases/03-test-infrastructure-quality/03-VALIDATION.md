---
phase: 3
slug: test-infrastructure-quality
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` — Wave 0 creates this |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run test:ci` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run test:ci`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | QUAL-01 | unit | `npx vitest run src/__tests__/utils/macros` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | QUAL-01 | unit | `npx vitest run src/__tests__/utils/macros` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | QUAL-01 | integration | `npx vitest run src/__tests__/hooks` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | QUAL-02 | grep | `grep -rn "console.error" src/` — 0 matches in hooks/pages | n/a | ⬜ pending |
| 03-02-02 | 02 | 1 | QUAL-03 | grep | `grep -rn "window.confirm" src/` — 0 matches | n/a | ⬜ pending |
| 03-02-03 | 02 | 1 | QUAL-04 | grep | `grep -rn '"Loading' src/app/dashboard` — 0 in target pages | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test configuration with vite-tsconfig-paths, jsdom, env vars
- [ ] `src/__tests__/setup.ts` — jest-dom matchers + MSW server lifecycle
- [ ] `src/__tests__/mocks/server.ts` — setupServer export
- [ ] `src/__tests__/mocks/handlers.ts` — base Supabase PostgREST handlers
- [ ] `src/__tests__/helpers/renderWithProviders.tsx` — React Query wrapper (retry: false)
- [ ] `src/__tests__/utils/macros/calculateMacros.test.ts` — unit test stubs
- [ ] `src/__tests__/hooks/workouts/useWorkouts.test.ts` — integration test stubs
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom @testing-library/dom msw jsdom vite-tsconfig-paths @vitest/coverage-v8`
- [ ] `npm install @radix-ui/react-alert-dialog`
- [ ] `package.json` scripts: `test`, `test:watch`, `test:ci`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No bare console.error in hooks/pages | QUAL-02 | Code pattern check | `grep -rn "console.error" src/` — verify 0 matches in hooks/pages |
| Delete uses ConfirmDialog, not window.confirm | QUAL-03 | Code pattern check | `grep -rn "window.confirm" src/` — verify 0 matches |
| No "Loading..." text in target pages | QUAL-04 | Code pattern check | `grep -rn '"Loading' src/app/dashboard` — verify 0 matches in workouts/weight/habits |
| ConfirmDialog keyboard accessible | QUAL-03 | Requires browser | Tab to Cancel/Confirm, Enter to activate, Escape to dismiss |
| Skeleton matches final layout shape | QUAL-04 | Visual check | Load pages with throttled network — no layout shift on data arrival |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
