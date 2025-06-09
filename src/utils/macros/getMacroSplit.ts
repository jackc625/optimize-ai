interface MacroSplit {
  protein: number;
  fat: number;
  carbs: number;
}

export function getMacroSplit(
  calories: number,
  goal: "fat_loss" | "muscle_gain" | "recomp"
): MacroSplit {
  let proteinRatio = 0.35;
  let fatRatio = 0.27;

  if (goal === "muscle_gain") {
    proteinRatio = 0.3;
    fatRatio = 0.25;
  } else if (goal === "fat_loss") {
    proteinRatio = 0.4;
    fatRatio = 0.3;
  }

  const protein = Math.round((calories * proteinRatio) / 4);
  const fat = Math.round((calories * fatRatio) / 9);
  const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);

  return { protein, fat, carbs };
}
