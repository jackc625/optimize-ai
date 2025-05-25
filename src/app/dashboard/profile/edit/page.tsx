"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    sex: "male",
    goal: "fat_loss",
    activity_level: "moderate",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error.message);
        toast.error("Could not load profile.");
        return;
      }

      if (!data) {
        toast.error("No profile found.");
        router.push("/dashboard/profile/setup");
        return;
      }

      setForm({
        name: data.name ?? "",
        age: data.age.toString(),
        height_cm: data.height_cm.toString(),
        weight_kg: data.weight_kg.toString(),
        sex: data.sex,
        goal: data.goal,
        activity_level: data.activity_level ?? "moderate",
      });

      setLoading(false);
    };

    loadProfile();
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

    const { error } = await supabase
      .from("user_profiles")
      .update({
        name: form.name,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        sex: form.sex,
        goal: form.goal,
        activity_level: form.activity_level,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Update error:", error.message);
      toast.error("Failed to update profile.");
      return;
    }

    toast.success("Profile updated!");
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Your Profile</h1>

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
          Update Profile
        </button>
      </form>
    </main>
  );
}
