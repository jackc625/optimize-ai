"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import MacroSummary from "@/components/MacroSummary";

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");

  // Redirect if not logged in
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  // Fetch profile name once we have a user
  useEffect(() => {
    if (!user) return;
    const loadProfileName = async () => {
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
    };
    loadProfileName();
  }, [user]);

  // While checking auth or loading name, show a loading state
  if (userLoading || !user || !userName) {
    return (
      <main className="p-4 text-center text-gray-500">
        Loading your dashboard...
      </main>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

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
        {/* e.g., <YourNextModule /> */}
      </main>
    </div>
  );
}
