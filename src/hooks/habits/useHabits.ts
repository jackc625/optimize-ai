// src/hooks/useHabits.ts

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

/**
 * Represents a habit with its current streak.
 */
export type HabitWithStreak = {
  id: string;
  title: string;
  streak: number;
};

/**
 * Calculate a consecutive-day streak given ISO dates (YYYY-MM-DD).
 */
function calculateStreak(logDates: string[]): number {
  // Sort descending (most recent first)
  const normalized = logDates
    .map((d) => d.split("T")[0])
    .sort((a, b) => (a > b ? -1 : 1));

  let streak = 0;
  const current = new Date();

  for (const dateString of normalized) {
    const isoToday = current.toISOString().split("T")[0];
    if (dateString === isoToday) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Return today in “YYYY-MM-DD” format. */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1) Fetch all habits: { id, title }
      const { data: habitData, error: habitError } = await supabase
        .from("habits")
        .select("id, title")
        .order("created_at");
      if (habitError) throw habitError;

      // habitData is any[]; each element has shape { id, title }
      const habitRows: { id: string; title: string }[] = habitData || [];
      const ids = habitRows.map((h) => h.id);

      // 2) Fetch all completed logs for those habits: { habit_id, date }
      const { data: logData, error: logError } = await supabase
        .from("habit_logs")
        .select("habit_id, date")
        .in("habit_id", ids)
        .eq("completed", true);
      if (logError) throw logError;

      const logRows: { habit_id: string; date: string }[] = logData || [];

      // 3) Group log dates by habit_id
      const grouped: Record<string, string[]> = {};
      logRows.forEach((log) => {
        if (!grouped[log.habit_id]) grouped[log.habit_id] = [];
        grouped[log.habit_id].push(log.date);
      });

      // 4) Build HabitWithStreak array
      const computed: HabitWithStreak[] = habitRows.map((h) => ({
        id: h.id,
        title: h.title,
        streak: calculateStreak(grouped[h.id] || []),
      }));
      setHabits(computed);

      // 5) Fetch today’s completed logs: { habit_id }
      const today = getTodayDate();
      const { data: todayLogs, error: todayError } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("date", today)
        .eq("completed", true);
      if (todayError) throw todayError;

      const todayRows: { habit_id: string }[] = todayLogs || [];
      setTodayCompleted(new Set(todayRows.map((l) => l.habit_id)));
    } catch (err) {
      console.error("useHabits fetchAll error:", err);
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addHabit = async (title: string) => {
    if (!title.trim()) return;
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    const { error } = await supabase
      .from("habits")
      .insert({ title, user_id: user.id });
    if (error) {
      console.error("Error adding habit:", error.message);
      toast.error("Failed to add habit");
    } else {
      toast.success("Habit added");
      fetchAll();
    }
  };

  const completeHabit = async (habitId: string) => {
    const today = getTodayDate();
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: user.id,
      date: today,
      completed: true,
    });
    if (error) {
      console.error("Error completing habit:", error.message);
      toast.error("Failed to complete habit");
    } else {
      toast.success("Habit completed!");
      fetchAll();
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from("habits").delete().eq("id", habitId);
    if (error) {
      console.error("Error deleting habit:", error.message);
      toast.error("Failed to delete habit");
    } else {
      toast.success("Habit deleted");
      fetchAll();
    }
  };

  return {
    habits,
    todayCompleted,
    loading,
    addHabit,
    completeHabit,
    deleteHabit,
  };
}
