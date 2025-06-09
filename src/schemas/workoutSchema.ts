import { z } from "zod";

/**
 * A single exercise inside a workout template
 */
export const ExerciseTemplateSchema = z.object({
  id: z.string().uuid().optional(), // will be set by Supabase
  workout_id: z.string().uuid(), // parent template
  name: z.string().min(1), // e.g. “Squat”
  sets_count: z.number().int().positive(), // number of sets
  reps: z.string().min(1), // e.g. “5x5” or “8–12”
  rest_seconds: z.number().int().nonnegative(), // rest between sets
  display_order: z.number().int().nonnegative(), // ordering within the workout
  created_at: z.string().optional(), // ISO timestamp from DB
});
export type ExerciseTemplate = z.infer<typeof ExerciseTemplateSchema>;

/**
 * The workout‐template itself, with an array of exercises
 */
export const WorkoutTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(), // ties back to profiles.id
  name: z.string().min(1), // e.g. “5×5 Strength”
  created_at: z.string().optional(),
  exercises: z.array(ExerciseTemplateSchema), // nested templates
});
export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>;

/**
 * One set’s log entry inside a workout log
 */
export const WorkoutLogExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  workout_log_id: z.string().uuid(), // parent log
  exercise_name: z.string().min(1),
  set_number: z.number().int().positive(),
  reps_completed: z.number().int().nonnegative(),
  weight: z.number().nonnegative(), // use user’s preferred unit
  created_at: z.string().optional(),
});
export type WorkoutLogExercise = z.infer<typeof WorkoutLogExerciseSchema>;

/**
 * A logged workout instance, with all its sets
 */
export const WorkoutLogSchema = z.object({
  id: z.string().uuid().optional(),
  workout_id: z.string().uuid().nullable(), // null for ad-hoc logs
  user_id: z.string().uuid(),
  log_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date string",
  }),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  exercises: z.array(WorkoutLogExerciseSchema),
});
export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;
