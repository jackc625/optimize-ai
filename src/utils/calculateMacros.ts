export type ProfileInput = {
  age: number;
  height_cm: number;
  weight_kg: number;
  sex: "male" | "female";
  activity_level: "sedentary" | "moderate" | "active";
  goal: "fat_loss" | "muscle_gain" | "recomp";
};

export type MacroOutput = {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
};

export function calculateMacros(profile: ProfileInput): MacroOutput {
  const { age, height_cm, weight_kg, sex, activity_level, goal } = profile;

  // 1. BMR calculation (Mifflin-St Jeor)
  const bmr =
    sex === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  // 2. Activity multiplier
  const activityMultipliers: Record<ProfileInput["activity_level"], number> = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.75,
  };

  const maintenanceCalories = Math.round(
    bmr * activityMultipliers[activity_level]
  );

  // 3. Goal adjustment
  const goalAdjustments: Record<ProfileInput["goal"], number> = {
    fat_loss: 0.8,
    recomp: 1.0,
    muscle_gain: 1.1,
  };

  const targetCalories = Math.round(
    maintenanceCalories * goalAdjustments[goal]
  );

  // 4. Macros
  const proteinGrams = Math.round(2.2 * weight_kg); // ~1g/lb of bodyweight
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const fatCalories = fatGrams * 9;
  const proteinCalories = proteinGrams * 4;

  const carbCalories = targetCalories - fatCalories - proteinCalories;
  const carbGrams = Math.round(carbCalories / 4);

  return {
    bmr: Math.round(bmr),
    maintenanceCalories,
    targetCalories,
    proteinGrams,
    fatGrams,
    carbGrams,
  };
}
