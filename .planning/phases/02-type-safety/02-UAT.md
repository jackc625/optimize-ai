---
status: diagnosed
phase: 02-type-safety
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-03-18T12:00:00Z
updated: 2026-03-18T12:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Macro Calculations Display (NaN Bug Fix)
expected: Navigate to the dashboard. BMR, maintenance calories, and target calories should display as real numbers (e.g., 1800, 2200, 1900) — NOT "NaN" or blank values.
result: pass

### 2. Macro Recalculate
expected: On the dashboard, find the macro summary section. Click the recalculate button. Macros should refresh and display updated values. A success toast should appear.
result: issue
reported: "the recalculate button isnt doing anything"
severity: major

### 3. Habits Page Loading
expected: Navigate to the habits page. Your habits list should load and display. Each habit should show its name and streak count.
result: pass

### 4. Add a Habit
expected: On the habits page, add a new habit. It should appear in the list immediately. A success toast should confirm the addition.
result: pass

### 5. Complete a Habit
expected: Click to mark a habit as complete for today. The UI should update to show it as completed (e.g., checkmark, visual change). It should persist on page refresh.
result: pass

### 6. Delete a Habit
expected: Delete a habit from the list. It should be removed immediately. A toast should confirm deletion.
result: pass

### 7. Profile Edit
expected: Go to profile edit page. Change activity level (sedentary/moderate/active), goal, or gender. Save. The form should submit without errors and the updated values should persist on reload.
result: pass

### 8. Date Display (Timezone Correctness)
expected: Check dates across the app (habits streak dates, workout logs, weight logs). Dates should show today's correct local date — not yesterday's or tomorrow's date due to UTC offset issues.
result: pass

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Macro recalculate button refreshes macros and shows success toast"
  status: failed
  reason: "User reported: the recalculate button isnt doing anything"
  severity: major
  test: 2
  root_cause: "handleRecalculate in MacroSummary.tsx lacks toast feedback and error handling. Refetch completes in ~50-100ms with no visible confirmation. Identical data triggers no re-render due to React Query structuralSharing. No try/catch means errors leave button stuck in disabled state."
  artifacts:
    - path: "src/components/macros/MacroSummary.tsx"
      issue: "handleRecalculate (lines 99-103) missing toast.success, try/catch, and minimum loading duration"
  missing:
    - "Add toast.success('Macros recalculated!') after refetch"
    - "Wrap in try/catch with toast.error on failure"
    - "Use finally block for setIsRecalculating(false)"
  debug_session: ".planning/debug/macro-recalculate-noop.md"
