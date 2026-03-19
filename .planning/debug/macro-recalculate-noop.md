---
status: diagnosed
trigger: "Investigate why the macro recalculate button on the dashboard isn't doing anything"
created: 2026-03-18T00:00:00Z
updated: 2026-03-18T00:00:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

hypothesis: refetch() returns cached data because calculateMacros is a pure function of DB profile data — if profile hasn't changed, the re-fetched data is identical, so useEffect does not fire and UI appears unchanged
test: Trace the full data flow — refetch -> queryFn -> supabase fetch -> calculateMacros -> returned data -> useEffect dependency check
expecting: If refetch returns identical data to what's already cached, React Query won't trigger a re-render with "new" data, and even if it does, useEffect([macros]) won't fire because the object reference may be the same or the fmt() values are identical
next_action: Analyze React Query refetch behavior and the data flow for staleness

## Symptoms

expected: Clicking "Recalculate" button should visibly refresh macro data (show loading state, fetch fresh data from server, update displayed values)
actual: Button click has no visible effect — no data refresh, no toast, no loading state change
errors: None reported (no console errors mentioned)
reproduction: Click the Recalculate button on the MacroSummary card
started: After phase 02-type-safety migration from custom useMacros to React Query

## Eliminated

## Evidence

- timestamp: 2026-03-18T00:01:00Z
  checked: MacroSummary.tsx button wiring
  found: Button onClick={handleRecalculate} is correctly wired (line 149). handleRecalculate calls setIsRecalculating(true), await refetch(), setIsRecalculating(false). This looks correct syntactically.
  implication: The button handler IS being called and IS calling refetch(). The issue is not in event wiring.

- timestamp: 2026-03-18T00:02:00Z
  checked: useMacros hook return value and destructuring
  found: useMacros returns useQuery result directly. MacroSummary destructures { data: macros, isLoading: macrosLoading, refetch }. This is correct — refetch is a standard React Query function.
  implication: refetch is properly available in the component.

- timestamp: 2026-03-18T00:03:00Z
  checked: useMacros queryFn and staleTime
  found: queryFn fetches profile from Supabase, validates with Zod, runs calculateMacros (pure function). staleTime is 5 minutes. The queryFn fetches live data from Supabase every time it runs.
  implication: refetch() WILL execute the queryFn regardless of staleTime (refetch bypasses staleTime). The data WILL be fresh from DB.

- timestamp: 2026-03-18T00:04:00Z
  checked: calculateMacros pure function behavior
  found: calculateMacros is deterministic — same profile inputs always produce same MacroOutput. Unless the user has changed their profile (weight, height, age, sex, goal, activity_level), the recalculated values will be IDENTICAL to the current values.
  implication: refetch works correctly but returns identical data. The "nothing happens" is actually correct behavior — there's nothing new to display.

- timestamp: 2026-03-18T00:05:00Z
  checked: isRecalculating loading state visibility
  found: setIsRecalculating(true) is called, then await refetch(), then setIsRecalculating(false). The button text changes to "Recalculating..." and style changes to bg-muted. HOWEVER — refetch() on a query that just hits Supabase and does pure math will complete in milliseconds. The loading state flashes so briefly it's invisible to the user.
  implication: PRIMARY ISSUE — the loading state IS shown but too briefly to be perceived. There is no toast/feedback confirming the recalculation completed.

- timestamp: 2026-03-18T00:06:00Z
  checked: What user expects vs what happens
  found: The user expects visible feedback (toast, data change, loading spinner). What actually happens: (1) isRecalculating flips true->false in ~50-100ms (imperceptible), (2) refetch returns same data (profile unchanged), (3) no toast on success, (4) useEffect([macros]) may or may not fire but fmt() values are identical. Net result: zero visible change.
  implication: This is a UX feedback problem compounded by the fact that recalculation of unchanged profile data produces identical results.

## Resolution

root_cause: Two compounding issues cause the "button does nothing" appearance. (1) NO USER FEEDBACK: handleRecalculate has no success toast and no minimum loading duration. The isRecalculating state flips true->false in ~50-100ms (imperceptible to humans). There is no toast.success("Macros recalculated!") or similar confirmation. (2) IDENTICAL DATA: calculateMacros is a pure function of the user's profile data (weight, height, age, sex, goal, activity_level). Unless the user has edited their profile since the last calculation, refetch returns structurally identical data. React Query's structuralSharing (enabled by default) detects this and preserves the same object reference, so no re-render occurs and the useEffect([macros]) on line 37-44 does not re-fire. (3) NO ERROR HANDLING: handleRecalculate has no try/catch — if refetch throws (e.g., network error, auth expired), the error is silently swallowed and isRecalculating gets stuck at true forever (the setIsRecalculating(false) on line 102 is never reached). The button DOES work mechanically — refetch fires, queryFn executes, data returns — but the user cannot perceive any effect.
fix:
verification:
files_changed: []
