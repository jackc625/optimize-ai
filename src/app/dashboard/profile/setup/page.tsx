"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/useUser";
import { ProfileForm } from "@/components/ProfileForm";

export default function SetupProfilePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 1) Wait until we know the user status
    if (userLoading) return;

    // 2) If not logged in, send to login
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // 3) If logged in, check if profile exists
    const checkProfile = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking profile:", error.message);
        toast.error("Could not check user profile.");
        return;
      }

      if (data) {
        // Profile exists → skip setup
        router.push("/dashboard");
      } else {
        setChecking(false);
      }
    };

    checkProfile();
  }, [user, userLoading, router]);

  if (userLoading || checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Set Up Your Profile</h1>
      <ProfileForm onSuccessRedirect="/dashboard" />
    </main>
  );
}
