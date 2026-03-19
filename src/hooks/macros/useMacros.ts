import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { calculateMacros } from "@/utils/macros/calculateMacros";
import type { MacroOutput } from "@/utils/macros/calculateMacros";
import { UserProfileSchema } from "@/schemas/profileSchema";

/**
 * Activity level string-to-multiplier mapping.
 * calculateTDEE expects a numeric multiplier, not the string enum.
 */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  moderate: 1.55,
  active: 1.9,
};

/**
 * Fetch the user's profile, validate with Zod, calculate macros, return results.
 * Uses React Query for caching and state management.
 */
export function useMacros() {
  return useQuery<MacroOutput, Error>({
    queryKey: ["macros"],
    queryFn: async () => {
      // 1) Get current user
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) throw new Error("Not authenticated");

      // 2) Fetch profile fields needed for calculation
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, name, age, height_cm, weight_kg, sex, goal, activity_level, goal_weight_kg")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profileData) throw new Error("Profile not found");

      // 3) Validate profile data with Zod
      const parsed = UserProfileSchema.safeParse(profileData);
      if (!parsed.success) {
        throw new Error(
          `Zod validation failed in useMacros: ${JSON.stringify(parsed.error.issues)}`
        );
      }

      // 4) Map activity_level string enum to numeric multiplier
      const activityMultiplier = ACTIVITY_MULTIPLIERS[parsed.data.activity_level] ?? 1.55;

      // 5) Build ProfileInput and calculate
      return calculateMacros({
        age: parsed.data.age,
        heightCm: parsed.data.height_cm,
        weightKg: parsed.data.weight_kg,
        sex: parsed.data.sex,
        goal: parsed.data.goal,
        activityLevel: activityMultiplier,
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}
