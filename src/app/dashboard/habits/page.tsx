// src/app/dashboard/habits/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useHabits, type HabitWithStreak } from "@/hooks/useHabits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HabitsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const {
    habits,
    todayCompleted,
    loading: habitsLoading,
    addHabit,
    completeHabit,
    deleteHabit,
  } = useHabits();
  const [newHabit, setNewHabit] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="p-4 bg-background text-foreground min-h-screen">
      {/* Add New Habit */}
      <Card className="max-w-md mx-auto mb-6">
        <CardHeader>
          <CardTitle>Your Habits</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit"
            className="
              flex-1
              border-border
              bg-input
              text-foreground
              rounded-[var(--radius)]
              px-3 py-2
              focus:outline-none focus:ring focus:ring-primary-300
            "
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (newHabit.trim()) {
                addHabit(newHabit);
                setNewHabit("");
              }
            }}
          >
            Add
          </Button>
        </CardContent>
      </Card>

      {habitsLoading ? (
        // Skeleton loader
        <ul className="max-w-md mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="flex items-center animate-pulse space-x-4">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-4 w-12 bg-muted rounded"></div>
              <div className="h-5 w-5 bg-muted rounded-full"></div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="max-w-md mx-auto divide-y divide-border">
          {habits.map((habit: HabitWithStreak) => {
            const isDone = todayCompleted.has(habit.id);
            return (
              <li
                key={habit.id}
                className="flex items-center justify-between py-4"
              >
                <span className="text-foreground">
                  {habit.title}
                  <span className="ml-2 text-sm text-muted-foreground">
                    🔥 {habit.streak}
                  </span>
                </span>
                <div className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={isDone}
                    onChange={() => completeHabit(habit.id)}
                    className="
                      w-5 h-5
                      border-border
                      bg-input
                      focus:outline-none focus:ring focus:ring-primary-300
                      disabled:opacity-50
                    "
                  />
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-destructive-foreground hover:text-destructive-foreground/80 text-sm"
                    title="Delete habit"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
