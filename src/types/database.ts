// src/types/database.ts

/**
 * Represents the “user_profiles” table
 * (each column must match exactly what your Supabase schema uses)
 */
export interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  sex: "male" | "female";
  goal: "fat_loss" | "muscle_gain" | "recomp";
  activity_level: "sedentary" | "moderate" | "active";
  goal_weight_kg: number | null;
}

/**
 * Represents a row in “habits”
 */
export interface Habit {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

/**
 * Represents a row in “habit_logs”
 */
export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // stored in "YYYY-MM-DD" format
  completed: boolean;
}

/**
 * Represents a row in “weight_logs”
 */
export interface WeightLog {
  id: string;
  user_id: string;
  date: string; // stored in "YYYY-MM-DD" format
  weight_kg: number;
}

/**
 * Represents a row in “user_macros”
 */
export interface UserMacro {
  id: string;
  user_id: string;
  calories: number;
  protein_grams: number;
  fat_grams: number;
  carb_grams: number;
  created_at: string;
}
