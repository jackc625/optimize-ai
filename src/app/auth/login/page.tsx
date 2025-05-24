"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
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
    router.push("/dashboard");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold text-center">Log In</h2>
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600">
          Log In
        </button>
        <button
          type="button"
          onClick={() => router.push("/auth/signup")}
          className="text-sm text-blue-600 hover:underline mt-2"
        >
          Don&apos;t have an account? Sign up
        </button>
      </form>
    </main>
  );
}
