import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  WorkoutLogSchema,
  WorkoutLog,
  WorkoutLogExercise,
} from "@/schemas/workoutSchema";

// --- Row types for runtime casting ---
type LogExerciseRow = {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  set_number: number;
  reps_completed: number;
  weight: number;
  created_at: string;
};

type LogRow = {
  id: string;
  workout_id: string | null;
  user_id: string;
  log_date: string;
  notes: string | null;
  created_at: string;
  workout_log_exercises: LogExerciseRow[];
};

// --- 1) Fetch workout logs ---
export function useWorkoutLogs() {
  return useQuery<WorkoutLog[], Error>({
    queryKey: ["workoutLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select(
          `
          id,
          workout_id,
          user_id,
          log_date,
          notes,
          created_at,
          workout_log_exercises (
            id,
            workout_log_id,
            exercise_name,
            set_number,
            reps_completed,
            weight,
            created_at
          )
        `
        )
        .order("log_date", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as LogRow[];
      return rows.map((row) =>
        WorkoutLogSchema.parse({
          id: row.id,
          workout_id: row.workout_id,
          user_id: row.user_id,
          log_date: row.log_date,
          notes: row.notes ?? undefined,
          created_at: row.created_at,
          exercises: row.workout_log_exercises as WorkoutLogExercise[],
        })
      );
    },
    staleTime: 1000 * 60 * 5, // cache 5m
  });
}

// --- 2) Create a workout log (with its exercises) ---
export function useCreateWorkoutLog() {
  const qc = useQueryClient();
  return useMutation<
    WorkoutLog,
    Error,
    {
      user_id: string;
      workout_id: string | null;
      log_date: string;
      notes?: string;
      exercises: Array<{
        exercise_name: string;
        set_number: number;
        reps_completed: number;
        weight: number;
      }>;
    }
  >({
    mutationFn: async (vars) => {
      // 2a) Insert the log row
      const { data: logData, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          user_id: vars.user_id,
          workout_id: vars.workout_id,
          log_date: vars.log_date,
          notes: vars.notes,
        })
        .select("id, workout_id, user_id, log_date, notes, created_at")
        .single();

      if (logError || !logData)
        throw logError || new Error("Failed to create workout log");

      // 2b) Insert the exercises referencing that log
      const exRows = vars.exercises.map((e) => ({
        ...e,
        workout_log_id: logData.id,
      }));

      const { data: exData, error: exError } = await supabase
        .from("workout_log_exercises")
        .insert(exRows).select(`
          id,
          workout_log_id,
          exercise_name,
          set_number,
          reps_completed,
          weight,
          created_at
        `);

      if (exError || !exData)
        throw exError || new Error("Failed to create log exercises");

      // 2c) Parse into our typed schema
      return WorkoutLogSchema.parse({
        id: logData.id,
        workout_id: logData.workout_id,
        user_id: logData.user_id,
        log_date: logData.log_date,
        notes: logData.notes ?? undefined,
        created_at: logData.created_at,
        exercises: exData as WorkoutLogExercise[],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workoutLogs"] });
    },
  });
}

// --- 3) Delete a workout log (cascades its exercises) ---
export function useDeleteWorkoutLog() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workoutLogs"] });
    },
  });
}
