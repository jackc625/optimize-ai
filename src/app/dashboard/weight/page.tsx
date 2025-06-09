// src/app/dashboard/weight/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/profile/useUser";
import { useWeightLogs } from "@/hooks/weight/useWeightLogs";
import WeightChart from "@/components/weight/WeightChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Log Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Log Your Weight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="number"
              placeholder="Enter today’s weight (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="
                w-full
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
                if (weightInput.trim()) {
                  addLog(Number(weightInput));
                  setWeightInput("");
                }
              }}
            >
              Log Weight
            </Button>
          </CardContent>
        </Card>

        {/* Logs List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Weight Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logsLoading ? (
              <p className="text-muted-foreground text-center">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground text-center">No logs yet.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="flex justify-between items-center border-b border-border py-2"
                  >
                    {editingId === log.id ? (
                      <>
                        <input
                          type="number"
                          value={editingWeight}
                          onChange={(e) => setEditingWeight(e.target.value)}
                          className="
                            w-20
                            border-border
                            bg-input
                            text-foreground
                            rounded-[var(--radius)]
                            px-2 py-1
                            focus:outline-none focus:ring focus:ring-primary-300
                          "
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              updateLog(log.id, Number(editingWeight));
                              setEditingId(null);
                              setEditingWeight("");
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="text-destructive-foreground hover:text-destructive-foreground/80"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{log.date}</span>
                        <span className="flex gap-2 items-center">
                          <span className="font-semibold">
                            {log.weight_kg} kg
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(log.id);
                              setEditingWeight(log.weight_kg.toString());
                            }}
                            className="text-primary hover:underline"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLog(log.id)}
                            className="text-destructive-foreground hover:text-destructive-foreground/80"
                          >
                            Delete
                          </Button>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Chart Section */}
        {!logsLoading && logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Progress Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChart logs={logs} goalWeight={goalWeight ?? undefined} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
