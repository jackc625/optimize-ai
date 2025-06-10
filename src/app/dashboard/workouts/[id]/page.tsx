"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkout, useUpdateWorkout } from "@/hooks/workouts/useWorkouts";
import {
  useCreateWorkoutExercise,
  useUpdateWorkoutExercise,
  useDeleteWorkoutExercise,
} from "@/hooks/workouts/useWorkoutExercises";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function WorkoutTemplatePage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  // Hooks must be called unconditionally
  const workoutQuery = useWorkout(id ?? "");
  const updateWorkout = useUpdateWorkout();
  const createExercise = useCreateWorkoutExercise();
  const updateExercise = useUpdateWorkoutExercise();
  const deleteExercise = useDeleteWorkoutExercise();

  // Local state for workout name
  const [name, setName] = useState("");
  // Local state for new exercise form
  const [newName, setNewName] = useState("");
  const [newSets, setNewSets] = useState(3);
  const [newReps, setNewReps] = useState("");
  const [newRest, setNewRest] = useState(60);

  // Populate name when data arrives
  useEffect(() => {
    if (workoutQuery.data) {
      setName(workoutQuery.data.name);
    }
  }, [workoutQuery.data]);

  const saveName = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    await updateWorkout.mutateAsync({ id, name });
  };

  const addExercise = async () => {
    if (!id || !newName) return;
    await createExercise.mutateAsync({
      workout_id: id,
      name: newName,
      sets_count: newSets,
      reps: newReps,
      rest_seconds: newRest,
      display_order: (workoutQuery.data?.exercises.length ?? 0) + 1,
    });
    setNewName("");
    setNewSets(3);
    setNewReps("");
    setNewRest(60);
  };

  // Early guards
  if (!id) {
    return (
      <main className="p-6">
        <div className="text-sm text-destructive">Invalid workout ID.</div>
      </main>
    );
  }
  if (workoutQuery.isLoading) {
    return (
      <main className="p-6">
        <div className="text-sm text-muted-foreground">Loading template…</div>
      </main>
    );
  }
  if (workoutQuery.error) {
    return (
      <main className="p-6">
        <div className="text-sm text-destructive">
          Error: {workoutQuery.error.message}
        </div>
      </main>
    );
  }

  const workout = workoutQuery.data!;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-grow max-w-3xl mx-auto p-6 space-y-6">
        {/* Edit Workout Name */}
        <Card>
          <form onSubmit={saveName}>
            <CardHeader>
              <h1 className="text-2xl font-semibold">Edit Workout</h1>
            </CardHeader>
            <CardContent>
              <label className="block mb-2 font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  border-border bg-input text-foreground rounded-[var(--radius)]
                  px-3 py-2 focus:outline-none focus:ring focus:ring-primary-300
                  w-full
                "
              />
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button type="submit" disabled={updateWorkout.isPending}>
                {updateWorkout.isPending ? "Saving…" : "Save Name"}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Exercises List */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Exercises</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {workout.exercises.map((ex) => (
              <div key={ex.id} className="grid grid-cols-5 gap-4 items-end">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm">Name</label>
                  <input
                    defaultValue={ex.name}
                    onBlur={(e) =>
                      updateExercise.mutate({
                        id: ex.id!,
                        workout_id: id,
                        name: e.target.value,
                        sets_count: ex.sets_count,
                        reps: ex.reps,
                        rest_seconds: ex.rest_seconds,
                        display_order: ex.display_order,
                      })
                    }
                    className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                  />
                </div>
                {/* Sets */}
                <div>
                  <label className="block text-sm">Sets</label>
                  <input
                    type="number"
                    defaultValue={ex.sets_count}
                    onBlur={(e) =>
                      updateExercise.mutate({
                        id: ex.id!,
                        workout_id: id,
                        name: ex.name,
                        sets_count: Number(e.target.value),
                        reps: ex.reps,
                        rest_seconds: ex.rest_seconds,
                        display_order: ex.display_order,
                      })
                    }
                    className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                  />
                </div>
                {/* Reps */}
                <div>
                  <label className="block text-sm">Reps</label>
                  <input
                    defaultValue={ex.reps}
                    onBlur={(e) =>
                      updateExercise.mutate({
                        id: ex.id!,
                        workout_id: id,
                        name: ex.name,
                        sets_count: ex.sets_count,
                        reps: e.target.value,
                        rest_seconds: ex.rest_seconds,
                        display_order: ex.display_order,
                      })
                    }
                    className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                  />
                </div>
                {/* Rest */}
                <div>
                  <label className="block text-sm">Rest (s)</label>
                  <input
                    type="number"
                    defaultValue={ex.rest_seconds}
                    onBlur={(e) =>
                      updateExercise.mutate({
                        id: ex.id!,
                        workout_id: id,
                        name: ex.name,
                        sets_count: ex.sets_count,
                        reps: ex.reps,
                        rest_seconds: Number(e.target.value),
                        display_order: ex.display_order,
                      })
                    }
                    className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                  />
                </div>
                {/* Delete */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      deleteExercise.mutate({ id: ex.id!, workout_id: id })
                    }
                    disabled={deleteExercise.isPending}
                  >
                    {deleteExercise.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            ))}

            {/* Add New Exercise */}
            <div className="grid grid-cols-5 gap-4 items-end pt-4 border-t">
              <div className="col-span-2">
                <label className="block text-sm">Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Sets</label>
                <input
                  type="number"
                  value={newSets}
                  onChange={(e) => setNewSets(Number(e.target.value))}
                  className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Reps</label>
                <input
                  value={newReps}
                  onChange={(e) => setNewReps(e.target.value)}
                  className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm">Rest (s)</label>
                <input
                  type="number"
                  value={newRest}
                  onChange={(e) => setNewRest(Number(e.target.value))}
                  className="border-border bg-input text-foreground rounded-[var(--radius)] px-2 py-1 w-full"
                />
              </div>
              <div>
                <Button
                  onClick={addExercise}
                  disabled={createExercise.isPending}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
