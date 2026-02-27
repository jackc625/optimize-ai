// src/app/auth/login/page.tsx
"use client";

import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const cameFromRedirect = !!redirectTo;
  // Validate redirect is a safe relative path (prevents open redirect)
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setError(error.message);
    // Set cookie before navigation so middleware sees it on the next request
    document.cookie = "sb-authed=true; path=/; SameSite=Lax";
    router.push(safeRedirect);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 w-full max-w-sm bg-card border-border rounded-[var(--radius)] shadow-md p-6"
      >
        <h2 className="text-2xl font-semibold text-foreground text-center">
          Log In
        </h2>
        {cameFromRedirect && (
          <p className="text-sm text-muted-foreground text-center">
            Please sign in to continue
          </p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-border bg-input text-foreground rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:ring focus:ring-primary-300"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-border bg-input text-foreground rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:ring focus:ring-primary-300"
        />
        {error && (
          <p className="text-destructive-foreground text-sm">{error}</p>
        )}
        <Button type="submit" variant="primary" size="md">
          Log In
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/auth/signup")}
          className="justify-center text-primary hover:underline"
        >
          Don&apos;t have an account? Sign up
        </Button>
      </form>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
