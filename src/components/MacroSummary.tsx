"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useMacros } from "@/hooks/useMacros";

export default function MacroSummary() {
  const { user, loading: userLoading } = useUser();
  const { macros, loading: macrosLoading } = useMacros();

  // 1) Wait for auth check
  if (userLoading) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader>
          <CardTitle>Calculating Macros...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Checking authentication...</p>
        </CardContent>
      </Card>
    );
  }

  // 2) If not logged in, show placeholder (this component should only be rendered on dashboard once guard passes)
  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader>
          <CardTitle>Calculating Macros...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Waiting for login...</p>
        </CardContent>
      </Card>
    );
  }

  // 3) While macros are loading (or not yet available), show skeleton
  if (macrosLoading || !macros) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader>
          <CardTitle>Calculating Macros...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading profile data...</p>
        </CardContent>
      </Card>
    );
  }

  // 4) Display final macro values
  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader>
        <CardTitle>Macro Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
        <div className="font-medium text-gray-700">BMR:</div>
        <div>{macros.bmr} kcal</div>

        <div className="font-medium text-gray-700">Maintenance:</div>
        <div>{macros.maintenanceCalories} kcal</div>

        <div className="font-medium text-gray-700">Target Calories:</div>
        <div>{macros.targetCalories} kcal</div>

        <div className="font-medium text-gray-700">Protein:</div>
        <div>{macros.proteinGrams} g</div>

        <div className="font-medium text-gray-700">Fat:</div>
        <div>{macros.fatGrams} g</div>

        <div className="font-medium text-gray-700">Carbs:</div>
        <div>{macros.carbGrams} g</div>
      </CardContent>
    </Card>
  );
}
