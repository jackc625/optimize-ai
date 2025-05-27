"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function SetupProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    sex: "male",
    goal: "fat_loss",
    activity_level: "moderate",
    goal_weight_kg: "",
  });

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          "name, age, height_cm, weight_kg, sex, goal, activity_level, goal_weight_kg"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking profile:", error.message);
        toast.error("Could not check user profile.");
        return;
      }

      if (data) {
        setForm({
          name: data.name ?? "",
          age: data.age.toString(),
          height_cm: data.height_cm.toString(),
          weight_kg: data.weight_kg.toString(),
          sex: data.sex,
          goal: data.goal,
          activity_level: data.activity_level,
          goal_weight_kg: data.goal_weight_kg?.toString() ?? "",
        });
        router.push("/dashboard");
      } else {
        setChecking(false); // No profile exists, show the form
      }
    };

    checkProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from("user_profiles").insert({
      user_id: user.id,
      name: form.name,
      age: Number(form.age),
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      sex: form.sex,
      goal: form.goal,
      activity_level: form.activity_level,
      goal_weight_kg: form.goal_weight_kg ? Number(form.goal_weight_kg) : null,
    });

    if (error) {
      console.error(error.message);
      toast.error("Failed to save profile");
      return;
    }

    toast.success("Profile saved!");
    router.push("/dashboard");
  };

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Set Up Your Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            type="text"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Age</label>
          <input
            name="age"
            value={form.age}
            onChange={handleChange}
            type="number"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Height (cm)</label>
          <input
            name="height_cm"
            value={form.height_cm}
            onChange={handleChange}
            type="number"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Weight (kg)</label>
          <input
            name="weight_kg"
            value={form.weight_kg}
            onChange={handleChange}
            type="number"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Goal Weight (kg)</label>
          <input
            name="goal_weight_kg"
            value={form.goal_weight_kg}
            onChange={handleChange}
            type="number"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Sex</label>
          <select
            name="sex"
            value={form.sex}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Goal</label>
          <select
            name="goal"
            value={form.goal}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="fat_loss">Fat Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="recomp">Body Recomp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Activity Level</label>
          <select
            name="activity_level"
            value={form.activity_level}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="sedentary">Sedentary</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Save Profile
        </button>
      </form>
    </main>
  );
}
