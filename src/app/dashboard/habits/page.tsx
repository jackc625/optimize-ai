"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

type Habit = {
  id: string;
  title: string;
  streak: number;
};

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function calculateStreak(logDates: string[]): number {
  const normalizedDates = logDates
    .map((date) => new Date(date).toISOString().split("T")[0])
    .sort((a, b) => (a > b ? -1 : 1));

  let streak = 0;
  const currentDate = new Date();

  for (const dateString of normalizedDates) {
    const expected = new Date(currentDate).toISOString().split("T")[0];
    if (dateString === expected) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabitIds, setCompletedHabitIds] = useState<string[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    setLoading(true);

    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .order("created_at");

    if (habitsError) {
      console.error("Error fetching habits:", habitsError.message);
      toast.error("Failed to load habits");
      setLoading(false);
      return;
    }

    const updatedHabits = await Promise.all(
      (habitsData ?? []).map(async (habit) => {
        const { data: logs, error: logError } = await supabase
          .from("habit_logs")
          .select("date")
          .eq("habit_id", habit.id)
          .eq("completed", true);

        if (logError) {
          console.error(
            `Error fetching logs for habit ${habit.id}:`,
            logError.message
          );
          return { ...habit, streak: 0 };
        }

        const logDates = logs?.map((log) => log.date) ?? [];
        const streak = calculateStreak(logDates);

        return {
          id: habit.id,
          title: habit.title,
          streak,
        };
      })
    );

    setHabits(updatedHabits);
    setLoading(false);
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    const fetchTodayLogs = async () => {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("date", today)
        .eq("completed", true);

      if (error) {
        console.error("Error fetching today's habit logs:", error.message);
        toast.error("Failed to load today's logs");
        return;
      }

      setCompletedHabitIds(data?.map((log) => log.habit_id) ?? []);
    };

    fetchTodayLogs();
  }, []);

  const addHabit = async () => {
    if (!newHabit.trim()) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("habits")
      .insert({ title: newHabit, user_id: user.id })
      .select();

    if (error) {
      console.error("Error adding habit:", error.message);
      toast.error("Failed to add habit");
      return;
    }

    setHabits((prev) => [...prev, ...(data ?? [])]);
    setNewHabit("");
    toast.success("Habit added");
  };

  const handleCheck = async (habitId: string) => {
    const today = getTodayDate();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      date: today,
      completed: true,
    });

    if (error) {
      console.error("Error checking off habit:", error.message);
      toast.error("Failed to complete habit");
      return;
    }

    setCompletedHabitIds((prev) => [...prev, habitId]);
    fetchHabits();
    toast.success("Habit completed!");
  };

  const handleDelete = async (habitId: string) => {
    const { error } = await supabase.from("habits").delete().eq("id", habitId);

    if (error) {
      console.error("Error deleting habit:", error.message);
      toast.error("Failed to delete habit");
      return;
    }

    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCompletedHabitIds((prev) => prev.filter((id) => id !== habitId));
    toast.success("Habit deleted");
  };

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Your Habits</h1>

      {/* Add new habit */}
      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 rounded w-full"
          placeholder="New habit"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
        />
        <button
          onClick={addHabit}
          className="bg-green-500 text-white px-4 rounded hover:bg-green-600"
        >
          Add
        </button>
      </div>

      {/* Habit List */}

      {loading ? (
        <ul className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <li
              key={index}
              className="flex items-center justify-between border-b py-2 animate-pulse"
            >
              <div className="flex flex-col gap-1 w-3/4">
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul>
          {habits.map((habit) => {
            const isCompleted = completedHabitIds.includes(habit.id);
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    disabled={isCompleted}
                    onChange={() => handleCheck(habit.id)}
                    className="w-5 h-5"
                  />
                  <button
                    onClick={() => handleDelete(habit.id)}
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
