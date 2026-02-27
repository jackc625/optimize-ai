-- RLS policies for all Supabase tables
-- Phase 1 Critical Safety: SAFE-03
-- Idempotent: policies are dropped before creation (safe to re-run)
-- Pattern: (SELECT auth.uid()) = user_id on SELECT, INSERT, UPDATE, DELETE
-- Applied: 2026-02-26

-- === user_profiles ===

DROP POLICY IF EXISTS "user_profiles: users can select own rows" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: users can insert own rows" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: users can update own rows" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: users can delete own rows" ON public.user_profiles;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: users can select own rows"
ON public.user_profiles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles: users can insert own rows"
ON public.user_profiles FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles: users can update own rows"
ON public.user_profiles FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_profiles: users can delete own rows"
ON public.user_profiles FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === habits ===

DROP POLICY IF EXISTS "habits: users can select own rows" ON public.habits;
DROP POLICY IF EXISTS "habits: users can insert own rows" ON public.habits;
DROP POLICY IF EXISTS "habits: users can update own rows" ON public.habits;
DROP POLICY IF EXISTS "habits: users can delete own rows" ON public.habits;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits: users can select own rows"
ON public.habits FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "habits: users can insert own rows"
ON public.habits FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "habits: users can update own rows"
ON public.habits FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "habits: users can delete own rows"
ON public.habits FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === habit_logs ===

DROP POLICY IF EXISTS "habit_logs: users can select own rows" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs: users can insert own rows" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs: users can update own rows" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs: users can delete own rows" ON public.habit_logs;

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs: users can select own rows"
ON public.habit_logs FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "habit_logs: users can insert own rows"
ON public.habit_logs FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "habit_logs: users can update own rows"
ON public.habit_logs FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "habit_logs: users can delete own rows"
ON public.habit_logs FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === weight_logs ===

DROP POLICY IF EXISTS "weight_logs: users can select own rows" ON public.weight_logs;
DROP POLICY IF EXISTS "weight_logs: users can insert own rows" ON public.weight_logs;
DROP POLICY IF EXISTS "weight_logs: users can update own rows" ON public.weight_logs;
DROP POLICY IF EXISTS "weight_logs: users can delete own rows" ON public.weight_logs;

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_logs: users can select own rows"
ON public.weight_logs FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "weight_logs: users can insert own rows"
ON public.weight_logs FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "weight_logs: users can update own rows"
ON public.weight_logs FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "weight_logs: users can delete own rows"
ON public.weight_logs FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === user_macros ===

DROP POLICY IF EXISTS "user_macros: users can select own rows" ON public.user_macros;
DROP POLICY IF EXISTS "user_macros: users can insert own rows" ON public.user_macros;
DROP POLICY IF EXISTS "user_macros: users can update own rows" ON public.user_macros;
DROP POLICY IF EXISTS "user_macros: users can delete own rows" ON public.user_macros;

ALTER TABLE public.user_macros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_macros: users can select own rows"
ON public.user_macros FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_macros: users can insert own rows"
ON public.user_macros FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_macros: users can update own rows"
ON public.user_macros FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_macros: users can delete own rows"
ON public.user_macros FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === workouts ===

DROP POLICY IF EXISTS "workouts: users can select own rows" ON public.workouts;
DROP POLICY IF EXISTS "workouts: users can insert own rows" ON public.workouts;
DROP POLICY IF EXISTS "workouts: users can update own rows" ON public.workouts;
DROP POLICY IF EXISTS "workouts: users can delete own rows" ON public.workouts;

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts: users can select own rows"
ON public.workouts FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "workouts: users can insert own rows"
ON public.workouts FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workouts: users can update own rows"
ON public.workouts FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workouts: users can delete own rows"
ON public.workouts FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === workout_exercises ===
-- No direct user_id column — ownership via parent workouts.user_id

DROP POLICY IF EXISTS "workout_exercises: users can select own rows" ON public.workout_exercises;
DROP POLICY IF EXISTS "workout_exercises: users can insert own rows" ON public.workout_exercises;
DROP POLICY IF EXISTS "workout_exercises: users can update own rows" ON public.workout_exercises;
DROP POLICY IF EXISTS "workout_exercises: users can delete own rows" ON public.workout_exercises;

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_exercises: users can select own rows"
ON public.workout_exercises FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workouts
  WHERE id = workout_exercises.workout_id
  AND user_id = (SELECT auth.uid())
));

CREATE POLICY "workout_exercises: users can insert own rows"
ON public.workout_exercises FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workouts
  WHERE id = workout_exercises.workout_id
  AND user_id = (SELECT auth.uid())
));

CREATE POLICY "workout_exercises: users can update own rows"
ON public.workout_exercises FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workouts
  WHERE id = workout_exercises.workout_id
  AND user_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workouts
  WHERE id = workout_exercises.workout_id
  AND user_id = (SELECT auth.uid())
));

CREATE POLICY "workout_exercises: users can delete own rows"
ON public.workout_exercises FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workouts
  WHERE id = workout_exercises.workout_id
  AND user_id = (SELECT auth.uid())
));

-- === workout_logs ===

DROP POLICY IF EXISTS "workout_logs: users can select own rows" ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs: users can insert own rows" ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs: users can update own rows" ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs: users can delete own rows" ON public.workout_logs;

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_logs: users can select own rows"
ON public.workout_logs FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_logs: users can insert own rows"
ON public.workout_logs FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_logs: users can update own rows"
ON public.workout_logs FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_logs: users can delete own rows"
ON public.workout_logs FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- === workout_log_exercises ===
-- No direct user_id column — ownership via parent workout_logs.user_id

DROP POLICY IF EXISTS "workout_log_exercises: users can select own rows" ON public.workout_log_exercises;
DROP POLICY IF EXISTS "workout_log_exercises: users can insert own rows" ON public.workout_log_exercises;
DROP POLICY IF EXISTS "workout_log_exercises: users can update own rows" ON public.workout_log_exercises;
DROP POLICY IF EXISTS "workout_log_exercises: users can delete own rows" ON public.workout_log_exercises;

ALTER TABLE public.workout_log_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_log_exercises: users can select own rows"
ON public.workout_log_exercises FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE id = workout_log_exercises.workout_log_id
  AND user_id = (SELECT auth.uid())
));

CREATE POLICY "workout_log_exercises: users can insert own rows"
ON public.workout_log_exercises FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE id = workout_log_exercises.workout_log_id
  AND user_id = (SELECT auth.uid())
));

CREATE POLICY "workout_log_exercises: users can update own rows"
ON public.workout_log_exercises FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE id = workout_log_exercises.workout_log_id
  AND user_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE id = workout_log_exercises.workout_log_id
  AND user_id = (SELECT auth.uid())
));

CREATE POLICY "workout_log_exercises: users can delete own rows"
ON public.workout_log_exercises FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE id = workout_log_exercises.workout_log_id
  AND user_id = (SELECT auth.uid())
));
