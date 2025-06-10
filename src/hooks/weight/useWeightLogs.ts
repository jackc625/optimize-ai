import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

/**
 * Represents a row in `weight_logs`
 */
export interface WeightLog {
  id: string;
  user_id: string;
  date: string; // “YYYY-MM-DD”
  weight_kg: number;
}

export function useWeightLogs() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .order("date", { ascending: false });
    if (error) {
      toast.error("Failed to load weight logs");
      console.error(error.message);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  const fetchGoal = async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("goal_weight_kg")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error(error.message);
    } else {
      setGoalWeight(data?.goal_weight_kg ?? null);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchGoal();
  }, []);

  const addLog = async (weightValue: number) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // Prevent duplicate per day
    const { data: existing, error: checkError } = await supabase
      .from("weight_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();
    if (checkError) {
      toast.error("Error checking existing entry");
      console.error(checkError.message);
      return;
    }
    if (existing) {
      toast.error("Already logged today");
      return;
    }

    const { error } = await supabase.from("weight_logs").insert({
      user_id: user.id,
      date: today,
      weight_kg: weightValue,
    });
    if (error) {
      toast.error("Error saving weight log");
      console.error(error.message);
    } else {
      toast.success("Weight logged!");
      fetchLogs();
    }
  };

  const deleteLog = async (logId: string) => {
    const { error } = await supabase
      .from("weight_logs")
      .delete()
      .eq("id", logId);
    if (error) {
      toast.error("Failed to delete entry");
      console.error(error.message);
    } else {
      toast.success("Entry deleted");
      fetchLogs();
    }
  };

  const updateLog = async (logId: string, newWeight: number) => {
    const { error } = await supabase
      .from("weight_logs")
      .update({ weight_kg: newWeight })
      .eq("id", logId);
    if (error) {
      toast.error("Update failed");
      console.error(error.message);
    } else {
      toast.success("Weight updated");
      fetchLogs();
    }
  };

  return {
    logs,
    goalWeight,
    loading,
    addLog,
    deleteLog,
    updateLog,
  };
}
