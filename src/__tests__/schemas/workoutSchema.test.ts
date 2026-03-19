import { describe, it, expect } from 'vitest';
import { WorkoutTemplateSchema, ExerciseTemplateSchema } from '@/schemas/workoutSchema';

const validExercise = {
  workout_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Squat',
  sets_count: 5,
  reps: '5x5',
  rest_seconds: 180,
  display_order: 0,
};

const validWorkout = {
  user_id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test Workout',
  exercises: [validExercise],
};

describe('WorkoutTemplateSchema', () => {
  it('accepts valid workout with exercises', () => {
    const result = WorkoutTemplateSchema.safeParse(validWorkout);
    expect(result.success).toBe(true);
  });
  it('rejects workout with empty name', () => {
    const result = WorkoutTemplateSchema.safeParse({ ...validWorkout, name: '' });
    expect(result.success).toBe(false);
  });
  it('rejects workout with non-uuid user_id', () => {
    const result = WorkoutTemplateSchema.safeParse({ ...validWorkout, user_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('ExerciseTemplateSchema', () => {
  it('rejects exercise with negative sets_count', () => {
    const result = ExerciseTemplateSchema.safeParse({ ...validExercise, sets_count: -1 });
    expect(result.success).toBe(false);
  });
  it('rejects exercise with empty name', () => {
    const result = ExerciseTemplateSchema.safeParse({ ...validExercise, name: '' });
    expect(result.success).toBe(false);
  });
});
