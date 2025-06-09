// src/hooks/useMacros.ts

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { calculateMacros } from "@/utils/macros/calculateMacros";
import type { ProfileInput, MacroOutput } from "@/utils/macros/calculateMacros";

/**
 * Fetch the user’s profile, calculate macros, and return the results.
 */
export function useMacros() {
  const [macros, setMacros] = useState<MacroOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      // 1) Get current user
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) {
        setMacros(null);
        setLoading(false);
        return;
      }

      // 2) Fetch profile fields needed for calculation
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("age, height_cm, weight_kg, sex, goal, activity_level")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError || !profileData) {
        toast.error("Failed to load profile.");
        setLoading(false);
        return;
      }

      // 3) Build ProfileInput shape
      const input: ProfileInput = {
        age: profileData.age,
        heightCm: profileData.height_cm,
        weightKg: profileData.weight_kg,
        sex: profileData.sex,
        goal: profileData.goal,
        activityLevel: profileData.activity_level || "moderate",
      };

      // 4) Calculate macros
      const result = calculateMacros(input);
      setMacros(result);
    } catch (err) {
      console.error("useMacros refresh error:", err);
      toast.error("Failed to calculate macros");
      setMacros(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { macros, loading, refresh };
}
