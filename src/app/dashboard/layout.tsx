// src/app/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/profile/useUser";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // ─── Unconditional Hook ──────────────────────────────────────────────────────
  useEffect(() => {
    // Only run once userLoading is false and user is non-null
    if (userLoading || !user) return;

    // Check if the user has a profile; if not, send them to setup
    const checkProfile = async () => {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking profile:", error.message);
        toast.error("Error checking profile.");
        return;
      }
      if (!profile && pathname !== "/dashboard/profile/setup") {
        router.push("/dashboard/profile/setup");
      }
    };

    checkProfile();
  }, [user, userLoading, pathname, router]);
  // ──────────────────────────────────────────────────────────────────────────────

  // While Supabase is checking auth, show a loading spinner
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not logged in, redirect to login immediately
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/habits", label: "Habits" },
    { href: "/dashboard/weight", label: "Weight" },
    { href: "/dashboard/macros/history", label: "Macro History" },
    { href: "/dashboard/profile/edit", label: "Edit Profile" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="border-b border-border bg-card px-6 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-primary">
          optimize.ai
        </h1>
        <div className="flex items-center gap-6">
          <ul className="flex gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    text-sm font-medium 
                    ${
                      pathname === link.href
                        ? "text-primary border-b-2 border-primary pb-1"
                        : "text-muted-foreground hover:text-primary hover:border-b-2 hover:border-primary pb-1"
                    }
                    transition-all
                  `}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive-foreground"
          >
            Log Out
          </Button>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
