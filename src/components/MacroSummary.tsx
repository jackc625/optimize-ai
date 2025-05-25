"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  calculateMacros,
  type MacroOutput,
  type ProfileInput,
} from "@/utils/calculateMacros";
import toast from "react-hot-toast";

export default function MacroSummary() {
  const [macros, setMacros] = useState<MacroOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileAndCalculate = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) {
        toast.error("Failed to load profile.");
        return;
      }

      const formattedProfile: ProfileInput = {
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        sex: profile.sex,
        goal: profile.goal,
        activity_level: profile.activity_level || "moderate",
      };

      const result = calculateMacros(formattedProfile);
      setMacros(result);
      setLoading(false);
    };

    loadProfileAndCalculate();
  }, []);

  if (loading || !macros) {
    return (
      <div className="border p-4 rounded shadow-sm animate-pulse bg-white">
        <p className="text-sm text-gray-500">Calculating macros...</p>
      </div>
    );
  }

  return (
    <div className="border p-6 rounded-xl shadow bg-white max-w-md space-y-2">
      <h2 className="text-lg font-semibold mb-2 text-blue-600">
        Macro Breakdown
      </h2>

      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <div className="font-medium text-gray-700">BMR:</div>
        <div>{macros.bmr} kcal</div>

        <div className="font-medium text-gray-700">Maintenance:</div>
        <div>{macros.maintenanceCalories} kcal</div>

        <div className="font-medium text-gray-700">Target Calories:</div>
        <div>{macros.targetCalories} kcal</div>

        <div className="font-medium text-gray-700">Protein:</div>
        <div>{macros.proteinGrams} g</div>

        <div className="font-medium text-gray-700">Fat:</div>
        <div>{macros.fatGrams} g</div>

        <div className="font-medium text-gray-700">Carbs:</div>
        <div>{macros.carbGrams} g</div>
      </div>
    </div>
  );
}
