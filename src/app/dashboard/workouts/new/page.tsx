"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { useCreateWorkout } from "@/hooks/workouts/useWorkouts";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/hooks/profile/useUser";

export default function NewWorkoutPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const create = useCreateWorkout();
  const [name, setName] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    try {
      const workout = await create.mutateAsync({
        user_id: user.id,
        name,
      });
      router.push(`/dashboard/workouts/${workout.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Create workout error:", err.message);
      } else {
        console.error("Unexpected error:", String(err));
      }
    }
  };

  if (loading || !user) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Loading user…</div>
      </main>
    );
  }

  const isSubmitting = create.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow max-w-3xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold text-foreground">
              New Workout
            </h1>
          </CardHeader>

          <form id="new-workout-form" onSubmit={handleSubmit}>
            <CardContent>
              <div>
                <label
                  htmlFor="workout-name"
                  className="block mb-2 font-medium text-foreground"
                >
                  Workout Name
                </label>
                <input
                  id="workout-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="
                    border-border bg-input text-foreground rounded-[var(--radius)]
                    px-3 py-2 focus:outline-none focus:ring focus:ring-primary-300
                    w-full
                  "
                />
              </div>
            </CardContent>

            <CardFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Workout"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {create.error && (
          <p className="mt-2 text-sm text-destructive">
            Error:{" "}
            {create.error instanceof Error
              ? create.error.message
              : String(create.error)}
          </p>
        )}
      </main>
    </div>
  );
}
