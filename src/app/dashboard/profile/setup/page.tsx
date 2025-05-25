"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function SetupProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    age: "",
    height_cm: "",
    weight_kg: "",
    sex: "male",
    goal: "fat_loss",
    activity_level: "moderate",
  });

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile check error:", error.message);
        toast.error("Could not check profile.");
        return;
      }

      if (data) {
        router.push("/dashboard"); // already has profile
      } else {
        setChecking(false); // show the form
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

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { error } = await supabase.from("user_profiles").insert({
      user_id: user.id,
      age: Number(form.age),
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      sex: form.sex,
      goal: form.goal,
      activity_level: form.activity_level,
    });

    if (error) {
      console.error("Insert error:", error.message);
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
        {[
          { label: "Age", name: "age", type: "number" },
          { label: "Height (cm)", name: "height_cm", type: "number" },
          { label: "Weight (kg)", name: "weight_kg", type: "number" },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-sm font-medium">{label}</label>
            <input
              name={name}
              value={form[name as keyof typeof form]}
              onChange={handleChange}
              type={type}
              required
              className="w-full border p-2 rounded"
            />
          </div>
        ))}

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
