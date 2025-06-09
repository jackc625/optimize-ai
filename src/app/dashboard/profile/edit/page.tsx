// src/app/dashboard/profile/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/profile/useUser";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { UserProfile } from "@/types/database";

export default function EditProfilePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [initialData, setInitialData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Wait for auth status
    if (userLoading) return;

    // 2) If not logged in, redirect to login
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // 3) If logged in, fetch profile data
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      setInitialData(data as UserProfile);
      setLoading(false);
    };

    fetchProfile();
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </main>
    );
  }

  if (!initialData) {
    // If no profile was found, send the user to setup
    router.push("/dashboard/profile/setup");
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialData={initialData}
              onSuccessRedirect="/dashboard"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
