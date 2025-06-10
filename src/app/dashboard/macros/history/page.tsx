"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/profile/useUser";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

type MacroRecord = {
  id: string;
  created_at: string;
  bmr: number;
  maintenance_calories: number;
  target_calories: number;
  protein_grams: number;
  fat_grams: number;
  carb_grams: number;
};

export default function MacroHistoryPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [history, setHistory] = useState<MacroRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Wait for auth check
    if (userLoading) return;

    // 2) If not logged in, send to login
    if (!user) {
      router.push("/auth/login");
      return;
    }

    // 3) Fetch macro history for this user
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_macros")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching macro history:", error.message);
        toast.error("Failed to load macro history");
      } else {
        setHistory((data as MacroRecord[]) || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Macro History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground">
                No history found. Recalculate your macros to start tracking.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        Date
                      </th>
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        BMR (kcal)
                      </th>
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        Maintenance (kcal)
                      </th>
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        Target (kcal)
                      </th>
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        Protein (g)
                      </th>
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        Fat (g)
                      </th>
                      <th className="px-4 py-2 border-border text-sm text-foreground">
                        Carbs (g)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-muted/[.2] transition-colors"
                      >
                        <td className="px-4 py-2 border-border text-sm">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 border-border text-sm">
                          {record.bmr}
                        </td>
                        <td className="px-4 py-2 border-border text-sm">
                          {record.maintenance_calories}
                        </td>
                        <td className="px-4 py-2 border-border text-sm">
                          {record.target_calories}
                        </td>
                        <td className="px-4 py-2 border-border text-sm">
                          {record.protein_grams}
                        </td>
                        <td className="px-4 py-2 border-border text-sm">
                          {record.fat_grams}
                        </td>
                        <td className="px-4 py-2 border-border text-sm">
                          {record.carb_grams}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
