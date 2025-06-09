import { calculateBMR } from "./calculateBMR";
import { calculateTDEE } from "./calculateTDEE";
import { getMacroSplit } from "./getMacroSplit";

export function calculateMacros(params: ProfileInput): MacroOutput {
  // 1) baseline
  const bmr = calculateBMR(
    params.weightKg,
    params.heightCm,
    params.age,
    params.sex
  );
  const maintenanceCalories = calculateTDEE(bmr, params.activityLevel);

  // 2) adjust for goal
  let targetCalories = maintenanceCalories;
  if (params.goal === "fat_loss") targetCalories -= 400;
  if (params.goal === "muscle_gain") targetCalories += 250;

  // 3) split macros
  const { protein, fat, carbs } = getMacroSplit(targetCalories, params.goal);

  // 4) return everything
  return {
    bmr,
    maintenanceCalories,
    targetCalories,
    proteinGrams: protein,
    fatGrams: fat,
    carbGrams: carbs,
  };
}

export type ProfileInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female";
  activityLevel: number;
  goal: "fat_loss" | "recomp" | "muscle_gain";
};

export type MacroOutput = {
  bmr: number;
  maintenanceCalories: number; // your TDEE
  targetCalories: number; // adjusted for goal
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
};
