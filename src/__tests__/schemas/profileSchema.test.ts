import { describe, it, expect } from 'vitest';
import { ProfileSchema, UserProfileSchema } from '@/schemas/profileSchema';

const validProfile = {
  name: 'Test User',
  age: 30,
  height_cm: 175,
  weight_kg: 80,
  sex: 'male' as const,
  goal: 'recomp' as const,
  activity_level: 'moderate' as const,
};

describe('ProfileSchema', () => {
  it('accepts valid profile', () => {
    const result = ProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });
  it('rejects age below 10', () => {
    const result = ProfileSchema.safeParse({ ...validProfile, age: 5 });
    expect(result.success).toBe(false);
  });
  it('rejects age above 120', () => {
    const result = ProfileSchema.safeParse({ ...validProfile, age: 150 });
    expect(result.success).toBe(false);
  });
  it('rejects invalid sex value', () => {
    const result = ProfileSchema.safeParse({ ...validProfile, sex: 'other' });
    expect(result.success).toBe(false);
  });
  it('rejects invalid goal value', () => {
    const result = ProfileSchema.safeParse({ ...validProfile, goal: 'invalid' });
    expect(result.success).toBe(false);
  });
  it('accepts optional goal_weight_kg', () => {
    const result = ProfileSchema.safeParse({ ...validProfile, goal_weight_kg: 75 });
    expect(result.success).toBe(true);
  });
});

describe('UserProfileSchema', () => {
  it('accepts valid DB row with nullable goal_weight_kg', () => {
    const result = UserProfileSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test User',
      age: 30,
      height_cm: 175,
      weight_kg: 80,
      sex: 'male',
      goal: 'recomp',
      activity_level: 'moderate',
      goal_weight_kg: null,
    });
    expect(result.success).toBe(true);
  });
});
