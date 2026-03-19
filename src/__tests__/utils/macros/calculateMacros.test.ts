import { describe, it, expect } from 'vitest';
import { calculateBMR } from '@/utils/macros/calculateBMR';
import { calculateTDEE } from '@/utils/macros/calculateTDEE';
import { getMacroSplit } from '@/utils/macros/getMacroSplit';
import { calculateMacros, type ProfileInput } from '@/utils/macros/calculateMacros';

const baseInput: ProfileInput = {
  weightKg: 80,
  heightCm: 175,
  age: 30,
  sex: 'male',
  activityLevel: 1.55,
  goal: 'recomp',
};

describe('calculateBMR', () => {
  it('male: 10*80 + 6.25*175 - 5*30 + 5 = 1748.75', () => {
    expect(calculateBMR(80, 175, 30, 'male')).toBe(1748.75);
  });
  it('female: 10*60 + 6.25*165 - 5*25 - 161 = 1345.25', () => {
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345.25);
  });
});

describe('calculateTDEE', () => {
  it('multiplies BMR by activityLevel', () => {
    expect(calculateTDEE(1748.75, 1.55)).toBeCloseTo(1748.75 * 1.55, 5);
  });
});

describe('getMacroSplit', () => {
  it('recomp: protein=35%, fat=27%', () => {
    const result = getMacroSplit(2710, 'recomp');
    expect(result.protein).toBe(Math.round((2710 * 0.35) / 4));
    expect(result.fat).toBe(Math.round((2710 * 0.27) / 9));
  });
  it('fat_loss: protein=40%, fat=30%', () => {
    const result = getMacroSplit(2310, 'fat_loss');
    expect(result.protein).toBe(Math.round((2310 * 0.40) / 4));
    expect(result.fat).toBe(Math.round((2310 * 0.30) / 9));
  });
  it('muscle_gain: protein=30%, fat=25%', () => {
    const result = getMacroSplit(2960, 'muscle_gain');
    expect(result.protein).toBe(Math.round((2960 * 0.30) / 4));
    expect(result.fat).toBe(Math.round((2960 * 0.25) / 9));
  });
  it('returns non-negative grams for all goals', () => {
    for (const goal of ['fat_loss', 'recomp', 'muscle_gain'] as const) {
      const result = getMacroSplit(2000, goal);
      expect(result.protein).toBeGreaterThan(0);
      expect(result.fat).toBeGreaterThan(0);
      expect(result.carbs).toBeGreaterThan(0);
    }
  });
});

describe('calculateMacros', () => {
  it('recomp: targetCalories equals maintenanceCalories', () => {
    const result = calculateMacros({ ...baseInput, goal: 'recomp' });
    expect(result.targetCalories).toBe(result.maintenanceCalories);
  });
  it('fat_loss: subtracts 400 from TDEE', () => {
    const result = calculateMacros({ ...baseInput, goal: 'fat_loss' });
    expect(result.targetCalories).toBe(result.maintenanceCalories - 400);
  });
  it('muscle_gain: adds 250 to TDEE', () => {
    const result = calculateMacros({ ...baseInput, goal: 'muscle_gain' });
    expect(result.targetCalories).toBe(result.maintenanceCalories + 250);
  });
  it('integrates BMR, TDEE, and macro split correctly', () => {
    const result = calculateMacros(baseInput);
    expect(result.bmr).toBe(1748.75);
    expect(result.maintenanceCalories).toBeCloseTo(1748.75 * 1.55, 1);
    expect(result.proteinGrams).toBeGreaterThan(0);
    expect(result.fatGrams).toBeGreaterThan(0);
    expect(result.carbGrams).toBeGreaterThan(0);
  });
});
