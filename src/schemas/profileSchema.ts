// src/schemas/profileSchema.ts
import { z } from "zod";

/**
 * Zod schema for validating user profile input.
 */
export const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z
    .number({ invalid_type_error: "Age must be a number" })
    .int("Age must be an integer")
    .min(10, "Age must be at least 10")
    .max(120, "Age must be 120 or less"),
  height_cm: z
    .number({ invalid_type_error: "Height must be a number" })
    .int("Height must be an integer")
    .min(50, "Height must be at least 50 cm")
    .max(300, "Height cannot exceed 300 cm"),
  weight_kg: z
    .number({ invalid_type_error: "Weight must be a number" })
    .int("Weight must be an integer")
    .min(30, "Weight must be at least 30 kg")
    .max(300, "Weight cannot exceed 300 kg"),
  sex: z.enum(["male", "female"]),
  goal: z.enum(["fat_loss", "muscle_gain", "recomp"]),
  activity_level: z.enum(["sedentary", "moderate", "active"]),
  goal_weight_kg: z
    .number({ invalid_type_error: "Goal weight must be a number" })
    .int("Goal weight must be an integer")
    .min(30, "Goal weight must be at least 30 kg")
    .max(300, "Goal weight cannot exceed 300 kg")
    .optional(),
});
