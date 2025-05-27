"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import WeightChart from "@/components/WeightChart";

type WeightLog = {
  id: string;
  date: string;
  weight_kg: number;
};

export default function WeightTrackerPage() {
  const [weight, setWeight] = useState("");
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState<number | null>(null);

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

  const fetchGoalWeight = async () => {
    const user = (await supabase.auth.getUser()).data.user;
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

  const handleLog = async () => {
    if (!weight.trim()) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: existing, error: checkError } = await supabase
      .from("weight_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (checkError) {
      toast.error("Error checking for existing entry");
      console.error(checkError.message);
      return;
    }

    if (existing) {
      toast.error("You’ve already logged your weight for today.");
      return;
    }

    const { error } = await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: Number(weight),
      date: today,
    });

    if (error) {
      toast.error("Error saving weight log");
      console.error(error.message);
    } else {
      toast.success("Weight logged!");
      setWeight("");
      fetchLogs();
    }
  };

  const handleDelete = async (logId: string) => {
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

  const handleUpdate = async () => {
    if (!editingId || !editingWeight.trim()) return;

    const { error } = await supabase
      .from("weight_logs")
      .update({ weight_kg: Number(editingWeight) })
      .eq("id", editingId);

    if (error) {
      toast.error("Update failed");
      console.error(error.message);
    } else {
      toast.success("Weight updated");
      setEditingId(null);
      setEditingWeight("");
      fetchLogs();
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchGoalWeight();
  }, []);

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl border shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Weight Tracker</h1>
        <p className="text-sm text-gray-500">
          Log your current weight to track your progress over time.
        </p>

        <div className="space-y-2">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter today’s weight (kg)"
            className="w-full border p-3 rounded-lg text-sm"
          />
          <button
            onClick={handleLog}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Log Weight
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Recent Logs</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No logs yet.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="text-sm flex justify-between items-center border-b pb-1 text-gray-800"
              >
                <span>{log.date}</span>
                <span className="flex items-center gap-2">
                  {editingId === log.id ? (
                    <>
                      <input
                        type="number"
                        value={editingWeight}
                        onChange={(e) => setEditingWeight(e.target.value)}
                        className="w-20 text-sm border px-1 py-0.5 rounded"
                      />
                      <button
                        onClick={handleUpdate}
                        className="text-green-600 text-xs hover:text-green-800"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingWeight("");
                        }}
                        className="text-gray-400 text-xs hover:text-gray-600"
                      >
                        ❌
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{log.weight_kg} kg</span>
                      <button
                        onClick={() => {
                          setEditingId(log.id);
                          setEditingWeight(log.weight_kg.toString());
                        }}
                        className="text-blue-500 text-xs hover:text-blue-700"
                        title="Edit entry"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-500 text-xs hover:text-red-700"
                        title="Delete entry"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {logs.length >= 1 && (
        <div className="bg-white rounded-xl border shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Progress Chart</h2>
          <WeightChart logs={logs} goalWeight={goalWeight ?? undefined} />
        </div>
      )}
    </main>
  );
}
