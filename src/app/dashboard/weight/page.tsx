"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import WeightChart from "@/components/WeightChart";

export default function WeightTrackerPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const {
    logs,
    goalWeight,
    loading: logsLoading,
    addLog,
    deleteLog,
    updateLog,
  } = useWeightLogs();
  const [weightInput, setWeightInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState("");

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
    <main className="max-w-md mx-auto p-6 space-y-6">
      {/* Log Input */}
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Enter today’s weight (kg)"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          className="w-full border p-3 rounded-lg text-sm"
        />
        <button
          onClick={() => {
            addLog(Number(weightInput));
            setWeightInput("");
          }}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Log Weight
        </button>
      </div>

      {/* Logs List */}
      {logsLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">No logs yet.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex justify-between items-center border-b py-2"
            >
              {editingId === log.id ? (
                <>
                  <input
                    type="number"
                    value={editingWeight}
                    onChange={(e) => setEditingWeight(e.target.value)}
                    className="w-20 border px-1 py-0.5 rounded text-sm"
                  />
                  <button
                    onClick={() => {
                      updateLog(log.id, Number(editingWeight));
                      setEditingId(null);
                      setEditingWeight("");
                    }}
                    className="text-green-600 hover:text-green-700"
                    title="Save"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-red-600 hover:text-red-700"
                    title="Cancel"
                  >
                    ❌
                  </button>
                </>
              ) : (
                <>
                  <span>{log.date}</span>
                  <span className="flex gap-2 items-center">
                    <span className="font-semibold">{log.weight_kg} kg</span>
                    <button
                      onClick={() => {
                        setEditingId(log.id);
                        setEditingWeight(log.weight_kg.toString());
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Chart */}
      {!logsLoading && logs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Progress Chart</h2>
          <WeightChart logs={logs} goalWeight={goalWeight ?? undefined} />
        </div>
      )}
    </main>
  );
}
