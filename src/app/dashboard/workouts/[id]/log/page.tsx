// src/app/dashboard/workouts/[id]/log/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/profile/useUser";
import { useWorkout } from "@/hooks/workouts/useWorkouts";
import { useCreateWorkoutLog } from "@/hooks/workouts/useWorkoutLogs";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type LogEntry = {
  exercise_name: string;
  set_number: number;
  reps_completed: number;
  weight: number;
};

export default function LogWorkoutPage() {
  // 1) Unconditionally call all hooks
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const workoutQuery = useWorkout(id ?? "");
  const createLog = useCreateWorkoutLog();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [notes, setNotes] = useState("");

  // 2) Initialize entries once template data is loaded
  useEffect(() => {
    if (workoutQuery.data) {
      const list: LogEntry[] = [];
      workoutQuery.data.exercises.forEach((ex) => {
        for (let i = 1; i <= ex.sets_count; i++) {
          list.push({
            exercise_name: ex.name,
            set_number: i,
            reps_completed: 0,
            weight: 0,
          });
        }
      });
      setEntries(list);
    }
  }, [workoutQuery.data]);

  // 3) Guard invalid ID
  if (!id) {
    return (
      <main className="p-6">
        <div className="text-sm text-destructive">Invalid workout ID.</div>
      </main>
    );
  }

  // 4) Loading & error states
  if (userLoading || workoutQuery.isLoading) {
    return (
      <main className="p-6">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }
  if (workoutQuery.error) {
    return (
      <main className="p-6">
        <div className="text-sm text-destructive">
          Error: {workoutQuery.error.message}
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // 5) Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createLog.mutateAsync({
      user_id: user.id,
      workout_id: id,
      log_date: today,
      notes: notes || undefined,
      exercises: entries,
    });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow max-w-3xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-semibold">Log Workout</h1>
              <p className="text-sm text-muted-foreground">
                {workoutQuery.data?.name} — {today}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {entries.map((ent, idx) => (
                <div
                  key={`${ent.exercise_name}-${ent.set_number}-${idx}`}
                  className="grid grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm">Exercise</label>
                    <div className="mt-1">{ent.exercise_name}</div>
                  </div>
                  <div>
                    <label className="block text-sm">Reps</label>
                    <input
                      type="number"
                      min={0}
                      value={ent.reps_completed}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setEntries((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, reps_completed: v } : p
                          )
                        );
                      }}
                      className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Weight</label>
                    <input
                      type="number"
                      min={0}
                      value={ent.weight}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setEntries((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, weight: v } : p
                          )
                        );
                      }}
                      className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block mb-2 font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
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
              <Button type="submit" disabled={createLog.isPending}>
                {createLog.isPending ? "Saving…" : "Save Log"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
