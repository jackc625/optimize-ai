import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { getLocalDate, formatLocalDate } from "@/utils/dates/localDate";

export type HabitWithStreak = {
  id: string;
  title: string;
  streak: number;
};

export type HabitsQueryData = {
  habits: HabitWithStreak[];
  todayCompleted: string[];
};

/**
 * Calculate a consecutive-day streak given date strings (YYYY-MM-DD).
 * Uses local-timezone dates instead of UTC.
 */
function calculateStreak(logDates: string[]): number {
  const sorted = [...logDates].sort((a, b) => (a > b ? -1 : 1));

  let streak = 0;
  const current = new Date();

  for (const dateString of sorted) {
    const localToday = formatLocalDate(current);
    if (dateString === localToday) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Composite query: fetches habits + logs + today's completions */
export function useHabits() {
  return useQuery<HabitsQueryData, Error>({
    queryKey: ["habits"],
    queryFn: async () => {
      // 1) Fetch all habits
      const { data: habitData, error: habitError } = await supabase
        .from("habits")
        .select("id, title")
        .order("created_at");
      if (habitError) throw habitError;

      const habitRows: { id: string; title: string }[] = habitData || [];
      const ids = habitRows.map((h) => h.id);

      // 2) Fetch all completed logs
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

      // 5) Fetch today's completed logs
      const today = getLocalDate();
      const { data: todayLogs, error: todayError } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("date", today)
        .eq("completed", true);
      if (todayError) throw todayError;

      const todayRows: { habit_id: string }[] = todayLogs || [];

      return {
        habits: computed,
        todayCompleted: todayRows.map((l) => l.habit_id),
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Add a new habit */
export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (title) => {
      if (!title.trim()) throw new Error("Habit title cannot be empty");
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("habits")
        .insert({ title, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Habit added");
      qc.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (err) => {
      console.error("Error adding habit:", err.message);
      toast.error("Failed to add habit");
    },
  });
}

/** Mark a habit as completed for today */
export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (habitId) => {
      const today = getLocalDate();
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("habit_logs").insert({
        habit_id: habitId,
        user_id: user.id,
        date: today,
        completed: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Habit completed!");
      qc.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (err) => {
      console.error("Error completing habit:", err.message);
      toast.error("Failed to complete habit");
    },
  });
}

/** Delete a habit */
export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (habitId) => {
      const { error } = await supabase.from("habits").delete().eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Habit deleted");
      qc.invalidateQueries({ queryKey: ["habits"] });
    },
    onError: (err) => {
      console.error("Error deleting habit:", err.message);
      toast.error("Failed to delete habit");
    },
  });
}
