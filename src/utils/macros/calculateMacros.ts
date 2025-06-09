import { calculateBMR } from "./calculateBMR";
import { calculateTDEE } from "./calculateTDEE";
import { getMacroSplit } from "./getMacroSplit";

export function calculateMacros(params: ProfileInput): MacroOutput {
  const bmr = calculateBMR(
    params.weightKg,
    params.heightCm,
    params.age,
    params.sex
  );
  const tdee = calculateTDEE(bmr, params.activityLevel);

  let calories = tdee;
  if (params.goal === "fat_loss") calories -= 400;
  if (params.goal === "muscle_gain") calories += 250;

  const { protein, fat, carbs } = getMacroSplit(calories, params.goal);

  return { calories, protein, fat, carbs };
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
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
