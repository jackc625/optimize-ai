"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  // 🔐 Check auth on load
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth/login");
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // 🔌 Log out handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/habits", label: "Habits" },
  ];

  // ⏳ Show loading screen during auth check
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // ✅ Main layout
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <nav className="border-b bg-white px-6 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-blue-600">
          optimize.ai
        </h1>

        <div className="flex items-center gap-6">
          <ul className="flex gap-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium ${
                    pathname === link.href
                      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                      : "text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-300 pb-1"
                  } transition-all`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-600 font-medium border border-red-300 px-3 py-1 rounded hover:bg-red-50 transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  );
}
