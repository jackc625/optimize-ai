// src/components/MacroSummary.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { useUser } from "@/hooks/useUser";
import { useMacros } from "@/hooks/useMacros";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function MacroSummary() {
  const { user, loading: userLoading } = useUser();
  const { macros, loading: macrosLoading, refresh } = useMacros();

  // Local state for editable fields (all strings so that inputs remain controlled)
  const [targetCalories, setTargetCalories] = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [fatGrams, setFatGrams] = useState("");
  const [carbGrams, setCarbGrams] = useState("");

  // Loading flags
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // When macros arrive, populate override fields:
  useEffect(() => {
    if (macros) {
      setTargetCalories(macros.targetCalories.toString());
      setProteinGrams(macros.proteinGrams.toString());
      setFatGrams(macros.fatGrams.toString());
      setCarbGrams(macros.carbGrams.toString());
    }
  }, [macros]);

  // 1) Auth check in progress
  if (userLoading) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader>
          <CardTitle className="text-foreground">
            Calculating Macros...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </CardContent>
      </Card>
    );
  }

  // 2) User not logged in
  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader>
          <CardTitle className="text-foreground">
            Calculating Macros...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Waiting for login...</p>
        </CardContent>
      </Card>
    );
  }

  // 3) Macros loading or not ready
  if (macrosLoading || !macros) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader>
          <CardTitle className="text-foreground">
            Calculating Macros...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Loading profile data...
          </p>
        </CardContent>
      </Card>
    );
  }

  // “Recalculate” button handler
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await refresh();
    setIsRecalculating(false);
  };

  // “Save” button handler
  const handleSave = async () => {
    // Convert overrides to numbers
    const tc = Number(targetCalories);
    const p = Number(proteinGrams);
    const f = Number(fatGrams);
    const c = Number(carbGrams);

    // Basic validation
    if ([tc, p, f, c].some((v) => isNaN(v))) {
      toast.error("Please enter valid numeric values before saving.");
      return;
    }

    setIsSaving(true);

    // Build payload (note: bmr and maintenance are read-only from macros)
    const payload = {
      user_id: user.id,
      bmr: macros.bmr,
      maintenance_calories: macros.maintenanceCalories,
      target_calories: tc,
      protein_grams: p,
      fat_grams: f,
      carb_grams: c,
    };

    // Insert into user_macros
    const { error } = await supabase.from("user_macros").insert(payload);

    if (error) {
      console.error("Error saving macros:", error.message);
      toast.error("Failed to save macros.");
    } else {
      toast.success("Macros saved!");
    }
    setIsSaving(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md bg-card rounded-[var(--radius)] border-border">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-foreground">Macro Breakdown</CardTitle>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className={`
            text-sm px-3 py-1 rounded-[var(--radius)]
            ${
              isRecalculating
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary-600"
            }
            disabled:opacity-50
          `}
        >
          {isRecalculating ? "Recalculating…" : "Recalculate"}
        </button>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-3 text-sm text-foreground">
        {/* BMR (read-only display) */}
        <div className="font-medium">BMR (kcal):</div>
        <div>{macros.bmr}</div>

        {/* Maintenance (read-only display) */}
        <div className="font-medium">Maintenance (kcal):</div>
        <div>{macros.maintenanceCalories}</div>

        {/* Target Calories (editable) */}
        <div className="font-medium">Target Calories (kcal):</div>
        <input
          type="number"
          value={targetCalories}
          onChange={(e) => setTargetCalories(e.target.value)}
          className={`
            border-border bg-input text-foreground rounded-[var(--radius)]
            px-2 py-1 focus:outline-none focus:ring focus:ring-primary-300 w-full
          `}
        />

        {/* Protein (editable) */}
        <div className="font-medium">Protein (g):</div>
        <input
          type="number"
          value={proteinGrams}
          onChange={(e) => setProteinGrams(e.target.value)}
          className={`
            border-border bg-input text-foreground rounded-[var(--radius)]
            px-2 py-1 focus:outline-none focus:ring focus:ring-primary-300 w-full
          `}
        />

        {/* Fat (editable) */}
        <div className="font-medium">Fat (g):</div>
        <input
          type="number"
          value={fatGrams}
          onChange={(e) => setFatGrams(e.target.value)}
          className={`
            border-border bg-input text-foreground rounded-[var(--radius)]
            px-2 py-1 focus:outline-none focus:ring focus:ring-primary-300 w-full
          `}
        />

        {/* Carbs (editable) */}
        <div className="font-medium">Carbs (g):</div>
        <input
          type="number"
          value={carbGrams}
          onChange={(e) => setCarbGrams(e.target.value)}
          className={`
            border-border bg-input text-foreground rounded-[var(--radius)]
            px-2 py-1 focus:outline-none focus:ring focus:ring-primary-300 w-full
          `}
        />
      </CardContent>

      <CardFooter className="flex justify-end border-border">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`
            px-4 py-1 rounded-[var(--radius)]
            ${
              isSaving
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary-600"
            }
            disabled:opacity-50
          `}
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </CardFooter>
    </Card>
  );
}
