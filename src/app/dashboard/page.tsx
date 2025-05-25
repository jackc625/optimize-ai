"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import MacroSummary from "@/components/MacroSummary";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      const user = authData?.user;

      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load profile name:", profileError.message);
        setUserName("User");
      } else {
        setUserName(profile?.name ?? "User");
      }

      setLoading(false);
    };

    loadUserProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <main className="p-4 text-center text-gray-500">
        Loading your dashboard...
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="max-w-3xl mx-auto p-6 space-y-6 flex-grow">
        {/* Greeting & Logout */}
        <div className="flex justify-between items-center bg-white border shadow-sm rounded-xl px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-sm text-gray-500">
              Here&apos;s your progress and targets.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>

        {/* Macro Summary */}
        <MacroSummary />

        {/* Future modules go here */}
        {/* <YourNextModule /> */}
      </main>
    </div>
  );
}
