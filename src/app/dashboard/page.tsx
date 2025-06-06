// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import MacroSummary from "@/components/MacroSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
      <main className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-sm text-muted-foreground">
          Loading your dashboard...
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow max-w-3xl mx-auto p-6 space-y-6">
        {/* Greeting & Logout */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-1">
                Welcome back, {userName} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Here’s your progress and targets.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive-foreground"
            >
              Log Out
            </Button>
          </CardHeader>
        </Card>

        {/* Macro Summary */}
        <MacroSummary />

        {/* Future modules go here */}
        {/* e.g., <YourNextModule /> */}
      </main>
    </div>
  );
}
