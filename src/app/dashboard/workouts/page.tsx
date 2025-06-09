// src/app/workouts/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useWorkouts, useDeleteWorkout } from "@/hooks/workouts/useWorkouts";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function WorkoutsPage() {
  const router = useRouter();
  const { data: workouts = [], isLoading, error } = useWorkouts();
  const deleteWorkout = useDeleteWorkout();

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this workout? This cannot be undone."
      )
    ) {
      deleteWorkout.mutate(id, {
        onError: (err) => {
          console.error("Failed to delete workout:", err.message);
          toast.error("Could not delete workout.");
        },
        onSuccess: () => {
          toast.success("Workout deleted.");
        },
      });
    }
  };

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Loading workouts…</div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-sm text-destructive">Error: {error.message}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow max-w-3xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">
              My Workouts
            </h1>
            <Button onClick={() => router.push("/dashboard/workouts/new")}>
              + New Workout
            </Button>
          </CardHeader>

          <CardContent>
            {workouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven’t created any workouts yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workouts.map((w) => (
                  <Card
                    key={w.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <h2 className="text-lg font-medium text-foreground">
                        {w.name}
                      </h2>
                    </CardHeader>

                    <div className="px-6 pb-4 text-sm text-muted-foreground">
                      Created{" "}
                      {w.created_at
                        ? new Date(w.created_at).toLocaleDateString()
                        : "—"}
                    </div>

                    <CardFooter className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/workouts/${w.id}`)
                        }
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard//workouts/${w.id}/log`)
                        }
                      >
                        Log Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(w.id!)}
                        disabled={deleteWorkout.isPending}
                      >
                        {deleteWorkout.isPending ? "Deleting…" : "Delete"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
