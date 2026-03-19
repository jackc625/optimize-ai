import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://kmavbjhdieeddxybaccj.supabase.co';

export const handlers = [
  http.get(`${SUPABASE_URL}/rest/v1/workouts`, () => {
    return HttpResponse.json([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Workout',
        created_at: '2026-01-01T00:00:00.000Z',
        workout_exercises: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            workout_id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Squat',
            sets_count: 5,
            reps: '5x5',
            rest_seconds: 180,
            display_order: 0,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ]);
  }),
];
