"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { ZodError } from "zod";
import type { UserProfile } from "@/types/database";
import { ProfileSchema } from "@/schemas/profileSchema";
import { Button } from "@/components/ui/Button";

type ProfileFormProps = {
  initialData?: UserProfile;
  onSuccessRedirect?: string;
};

export function ProfileForm({
  initialData,
  onSuccessRedirect = "/dashboard",
}: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    age: initialData?.age.toString() ?? "",
    height_cm: initialData?.height_cm.toString() ?? "",
    weight_kg: initialData?.weight_kg.toString() ?? "",
    sex: initialData?.sex ?? "male",
    goal: initialData?.goal ?? "fat_loss",
    activity_level: initialData?.activity_level ?? "moderate",
    goal_weight_kg: initialData?.goal_weight_kg?.toString() ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1) Convert string inputs to correct types
    const parsedInput = {
      name: form.name.trim(),
      age: Number(form.age),
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      sex: form.sex as "male" | "female",
      goal: form.goal as "fat_loss" | "muscle_gain" | "recomp",
      activity_level: form.activity_level as
        | "sedentary"
        | "moderate"
        | "active",
      goal_weight_kg:
        form.goal_weight_kg.trim() !== ""
          ? Number(form.goal_weight_kg)
          : undefined,
    };

    // 2) Validate with Zod
    try {
      ProfileSchema.parse(parsedInput);
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Validation failed");
      }
      setLoading(false);
      return;
    }

    // 3) Fetch current user
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) {
      toast.error("You must be logged in.");
      setLoading(false);
      return;
    }

    // 4) Build payload for Supabase
    const payload = {
      user_id: user.id,
      name: parsedInput.name,
      age: parsedInput.age,
      height_cm: parsedInput.height_cm,
      weight_kg: parsedInput.weight_kg,
      sex: parsedInput.sex,
      goal: parsedInput.goal,
      activity_level: parsedInput.activity_level,
      goal_weight_kg: parsedInput.goal_weight_kg ?? null,
    };

    // 5) Insert or update
    let resultError = null;
    if (initialData) {
      const { error } = await supabase
        .from("user_profiles")
        .update(payload)
        .eq("user_id", user.id);
      resultError = error;
    } else {
      const { error } = await supabase.from("user_profiles").insert(payload);
      resultError = error;
    }

    if (resultError) {
      console.error("Profile save error:", resultError.message);
      toast.error("Failed to save profile");
      setLoading(false);
      return;
    }

    toast.success("Profile saved!");
    router.push(onSuccessRedirect);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="flex flex-col">
        <label
          htmlFor="name"
          className="text-sm font-medium text-foreground mb-1"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
          required
        />
      </div>

      {/* Age */}
      <div className="flex flex-col">
        <label
          htmlFor="age"
          className="text-sm font-medium text-foreground mb-1"
        >
          Age
        </label>
        <input
          id="age"
          name="age"
          type="number"
          value={form.age}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
          required
        />
      </div>

      {/* Height (cm) */}
      <div className="flex flex-col">
        <label
          htmlFor="height_cm"
          className="text-sm font-medium text-foreground mb-1"
        >
          Height (cm)
        </label>
        <input
          id="height_cm"
          name="height_cm"
          type="number"
          value={form.height_cm}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
          required
        />
      </div>

      {/* Weight (kg) */}
      <div className="flex flex-col">
        <label
          htmlFor="weight_kg"
          className="text-sm font-medium text-foreground mb-1"
        >
          Current Weight (kg)
        </label>
        <input
          id="weight_kg"
          name="weight_kg"
          type="number"
          value={form.weight_kg}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
          required
        />
      </div>

      {/* Sex */}
      <div className="flex flex-col">
        <label
          htmlFor="sex"
          className="text-sm font-medium text-foreground mb-1"
        >
          Sex
        </label>
        <select
          id="sex"
          name="sex"
          value={form.sex}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* Goal */}
      <div className="flex flex-col">
        <label
          htmlFor="goal"
          className="text-sm font-medium text-foreground mb-1"
        >
          Fitness Goal
        </label>
        <select
          id="goal"
          name="goal"
          value={form.goal}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
        >
          <option value="fat_loss">Fat Loss</option>
          <option value="muscle_gain">Muscle Gain</option>
          <option value="recomp">Body Recomposition</option>
        </select>
      </div>

      {/* Activity Level */}
      <div className="flex flex-col">
        <label
          htmlFor="activity_level"
          className="text-sm font-medium text-foreground mb-1"
        >
          Activity Level
        </label>
        <select
          id="activity_level"
          name="activity_level"
          value={form.activity_level}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
        >
          <option value="sedentary">Sedentary</option>
          <option value="moderate">Moderately Active</option>
          <option value="active">Highly Active</option>
        </select>
      </div>

      {/* Goal Weight (kg) */}
      <div className="flex flex-col">
        <label
          htmlFor="goal_weight_kg"
          className="text-sm font-medium text-foreground mb-1"
        >
          Target Weight (kg) (optional)
        </label>
        <input
          id="goal_weight_kg"
          name="goal_weight_kg"
          type="number"
          value={form.goal_weight_kg}
          onChange={handleChange}
          className="
            border-border
            bg-input
            text-foreground
            rounded-[var(--radius)]
            px-3 py-2
            focus:outline-none focus:ring focus:ring-primary-300
          "
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={loading}
        className="w-full"
      >
        {loading
          ? "Saving..."
          : initialData
          ? "Save Changes"
          : "Set Up Profile"}
      </Button>
    </form>
  );
}
