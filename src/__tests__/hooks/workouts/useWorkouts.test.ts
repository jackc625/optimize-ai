import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkouts } from '@/hooks/workouts/useWorkouts';
import { createWrapper } from '@/__tests__/helpers/renderWithProviders';

// Mock the supabase client because @supabase/node-fetch bypasses MSW's global fetch interception.
// The factory must not reference variables declared outside (vi.mock is hoisted).
vi.mock('@/lib/supabaseClient', () => {
  const mockOrder = vi.fn();
  const mockSelect = vi.fn(() => ({ order: mockOrder }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return {
    supabase: { from: mockFrom },
    __mockOrder: mockOrder,
    __mockSelect: mockSelect,
  };
});

// Import the mocked module to access mock helpers
import * as supabaseModule from '@/lib/supabaseClient';

const VALID_WORKOUT_ROW = {
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
};

function getMockOrder() {
  return (supabaseModule as any).__mockOrder as ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.clearAllMocks();
  const mockOrder = getMockOrder();
  // Default: reset chain — select returns an object with order
  const mockSelect = vi.fn(() => ({ order: mockOrder }));
  (supabaseModule.supabase.from as any).mockImplementation(() => ({ select: mockSelect }));
  // Default: successful response
  mockOrder.mockResolvedValue({ data: [VALID_WORKOUT_ROW], error: null });
});

describe('useWorkouts', () => {
  it('returns parsed workout list on success', async () => {
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Test Workout');
  });

  it('returns workout with exercises array', async () => {
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].exercises).toHaveLength(1);
    expect(result.current.data![0].exercises[0].name).toBe('Squat');
  });

  it('returns error when Supabase returns 500', async () => {
    const mockOrder = getMockOrder();
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Internal Server Error', code: '500' } });
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('starts in loading state', () => {
    const mockOrder = getMockOrder();
    mockOrder.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useWorkouts(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });
});
