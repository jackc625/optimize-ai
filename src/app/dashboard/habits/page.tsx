"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useHabits, type HabitWithStreak } from "@/hooks/useHabits";

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
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      {/* Add New Habit */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="New habit"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={() => {
            addHabit(newHabit);
            setNewHabit("");
          }}
          className="bg-green-500 text-white px-4 rounded hover:bg-green-600 transition"
        >
          Add
        </button>
      </div>

      {habitsLoading ? (
        // Skeleton loader
        <ul className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="flex items-center animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mr-4"></div>
              <div className="h-4 w-12 bg-gray-200 rounded mr-4"></div>
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
            </li>
          ))}
        </ul>
      ) : (
        <ul>
          {habits.map((habit: HabitWithStreak) => {
            const isDone = todayCompleted.has(habit.id);
            return (
              <li
                key={habit.id}
                className="flex items-center justify-between border-b py-2"
              >
                <span>
                  {habit.title}
                  <span className="text-sm text-gray-500 ml-2">
                    🔥 {habit.streak}
                  </span>
                </span>
                <div className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={isDone}
                    onChange={() => completeHabit(habit.id)}
                    className="w-5 h-5"
                  />
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
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
