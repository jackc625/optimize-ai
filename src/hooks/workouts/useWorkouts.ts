import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  WorkoutTemplateSchema,
  WorkoutTemplate,
} from "@/schemas/workoutSchema";

type ExerciseRow = {
  id: string;
  workout_id: string;
  name: string;
  sets_count: number;
  reps: string;
  rest_seconds: number;
  display_order: number;
  created_at: string;
};

/** One workout template row, including nested exercises */
type WorkoutRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  workout_exercises: ExerciseRow[];
};

/** 1) Fetch all workout templates (with exercises) */
export function useWorkouts() {
  return useQuery<WorkoutTemplate[], Error>({
    queryKey: ["workouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          id,
          user_id,
          name,
          created_at,
          workout_exercises (
            id,
            workout_id,
            name,
            sets_count,
            reps,
            rest_seconds,
            display_order,
            created_at
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as WorkoutRow[];
      return rows.map((row) => {
        const result = WorkoutTemplateSchema.safeParse({
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          created_at: row.created_at,
          exercises: row.workout_exercises,
        });
        if (!result.success) {
          throw new Error(
            `Zod validation failed in useWorkouts: ${JSON.stringify(result.error.issues)}`
          );
        }
        return result.data;
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** 2) Fetch a single template by ID */
export function useWorkout(workoutId: string) {
  return useQuery<WorkoutTemplate, Error>({
    queryKey: ["workout", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          id,
          user_id,
          name,
          created_at,
          workout_exercises (
            id,
            workout_id,
            name,
            sets_count,
            reps,
            rest_seconds,
            display_order,
            created_at
          )
        `
        )
        .eq("id", workoutId)
        .single();

      if (error || !data) throw error || new Error("Workout not found");
      const row = data as WorkoutRow;
      const result = WorkoutTemplateSchema.safeParse({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        created_at: row.created_at,
        exercises: row.workout_exercises,
      });
      if (!result.success) {
        throw new Error(
          `Zod validation failed in useWorkout: ${JSON.stringify(result.error.issues)}`
        );
      }
      return result.data;
    },
    enabled: Boolean(workoutId),
  });
}

/** 3) Create a new template */
export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation<WorkoutTemplate, Error, { user_id: string; name: string }>(
    {
      mutationFn: async (vars) => {
        const { data, error } = await supabase
          .from("workouts")
          .insert(vars)
          .select("id, user_id, name, created_at")
          .single();
        if (error || !data) throw error;
        const result = WorkoutTemplateSchema.safeParse({ ...data, exercises: [] });
        if (!result.success) {
          throw new Error(
            `Zod validation failed in useCreateWorkout: ${JSON.stringify(result.error.issues)}`
          );
        }
        return result.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["workouts"] });
      },
    }
  );
}

/** 4) Update a template’s name */
export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation<WorkoutTemplate, Error, { id: string; name: string }>({
    mutationFn: async ({ id, name }) => {
      const { data, error } = await supabase
        .from("workouts")
        .update({ name })
        .eq("id", id)
        .select("id, user_id, name, created_at")
        .single();
      if (error || !data) throw error;
      const result = WorkoutTemplateSchema.safeParse({ ...data, exercises: [] });
      if (!result.success) {
        throw new Error(
          `Zod validation failed in useUpdateWorkout: ${JSON.stringify(result.error.issues)}`
        );
      }
      return result.data;
    },
    onSuccess: (_resp, vars) => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["workout", vars.id] });
    },
  });
}

/** 5) Delete a template */
export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}
