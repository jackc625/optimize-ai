// src/hooks/workouts/useWorkoutExercises.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  ExerciseTemplate,
  ExerciseTemplateSchema,
} from "@/schemas/workoutSchema";

/**
 * Create a new exercise in a template
 */
export function useCreateWorkoutExercise() {
  const qc = useQueryClient();
  return useMutation<
    ExerciseTemplate,
    Error,
    {
      workout_id: string;
      name: string;
      sets_count: number;
      reps: string;
      rest_seconds: number;
      display_order: number;
    }
  >({
    mutationFn: async (vars) => {
      const { data, error } = await supabase
        .from("workout_exercises")
        .insert(vars)
        .select(
          `
          id,
          workout_id,
          name,
          sets_count,
          reps,
          rest_seconds,
          display_order,
          created_at
        `
        )
        .single();
      if (error || !data) throw error || new Error("Failed to create exercise");
      return ExerciseTemplateSchema.parse(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workout", vars.workout_id] });
    },
  });
}

/**
 * Update an existing exercise
 */
export function useUpdateWorkoutExercise() {
  const qc = useQueryClient();
  return useMutation<
    ExerciseTemplate,
    Error,
    {
      id: string;
      workout_id: string;
      name: string;
      sets_count: number;
      reps: string;
      rest_seconds: number;
      display_order: number;
    }
  >({
    mutationFn: async (vars) => {
      const { id, ...rest } = vars;
      // Build patch without touching workout_id
      const patch = {
        name: rest.name,
        sets_count: rest.sets_count,
        reps: rest.reps,
        rest_seconds: rest.rest_seconds,
        display_order: rest.display_order,
      };
      const { data, error } = await supabase
        .from("workout_exercises")
        .update(patch)
        .eq("id", id)
        .select(
          `
          id,
          workout_id,
          name,
          sets_count,
          reps,
          rest_seconds,
          display_order,
          created_at
        `
        )
        .single();
      if (error || !data) throw error || new Error("Failed to update exercise");
      return ExerciseTemplateSchema.parse(data);
    },
    onSuccess: (_, { workout_id }) => {
      qc.invalidateQueries({ queryKey: ["workout", workout_id] });
    },
  });
}

/**
 * Delete an exercise
 */
export function useDeleteWorkoutExercise() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; workout_id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { workout_id }) => {
      qc.invalidateQueries({ queryKey: ["workout", workout_id] });
    },
  });
}
