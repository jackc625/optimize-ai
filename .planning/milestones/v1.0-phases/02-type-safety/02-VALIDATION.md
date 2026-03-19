---
phase: 2
slug: type-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Vitest planned for Phase 3 (QUAL-01); not yet installed |
| **Config file** | None — no test infrastructure exists |
| **Quick run command** | `npm run type-check && npm run lint` |
| **Full suite command** | `npm run build && npm run lint && npm run type-check` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run type-check && npm run lint`
- **After every plan wave:** Run `npm run build && npm run lint && npm run type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-XX | 01 | 1 | TYPE-01 | Static (grep) | `grep -rn "as [A-Z]" src --include="*.ts" --include="*.tsx"` | ✅ | ⬜ pending |
| 02-01-XX | 01 | 1 | TYPE-01 | TypeCheck | `npm run type-check` | ✅ | ⬜ pending |
| 02-02-XX | 02 | 2 | TYPE-04 | Static (grep) | `grep -rn "useState\|useEffect" src/hooks/habits src/hooks/macros` | ✅ | ⬜ pending |
| 02-02-XX | 02 | 2 | TYPE-03 | TypeCheck | `npm run type-check` | ✅ | ⬜ pending |
| 02-02-XX | 02 | 2 | TYPE-02 | Lint | `npm run lint` | ✅ | ⬜ pending |
| 02-02-XX | 02 | 2 | BUG-01 | Static (grep) | `grep -rn "toISOString\|\.slice(0, 10)" src` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements via static analysis (grep), TypeScript type-checking, and ESLint linting
- No unit test framework needed — Phase 2 is a hardening/refactoring phase verified by static tools
- Vitest deferred to Phase 3 (QUAL-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Habit streak shows correct local date | BUG-01 | Timezone-dependent display logic requires browser context | 1. Set system timezone to UTC+12, 2. Create habit completion near midnight, 3. Verify streak date reflects local date |
| ProfileForm rejects invalid enums | TYPE-03 | Form validation UX requires browser interaction | 1. Attempt to submit ProfileForm with manipulated enum values, 2. Verify form rejects invalid inputs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
