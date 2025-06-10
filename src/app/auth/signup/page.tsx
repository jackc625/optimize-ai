"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // This will be called by the form's onSubmit
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    router.push("/dashboard");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <Card className="w-full max-w-sm bg-card border-border rounded-[var(--radius)] shadow-md">
        <CardContent className="flex flex-col gap-4 p-6">
          <h2 className="text-2xl font-semibold text-foreground text-center">
            Sign Up
          </h2>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
              Sign Up
            </Button>
          </form>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/auth/login")}
            className="justify-center text-primary hover:underline mt-2"
          >
            Already have an account? Log in
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
