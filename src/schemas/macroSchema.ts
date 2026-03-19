import { z } from "zod";

/**
 * Zod schema for a macro history record from user_macros table.
 */
export const MacroRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  bmr: z.number(),
  maintenance_calories: z.number(),
  target_calories: z.number(),
  protein_grams: z.number(),
  fat_grams: z.number(),
  carb_grams: z.number(),
});
export type MacroRecord = z.infer<typeof MacroRecordSchema>;

export const MacroRecordArraySchema = z.array(MacroRecordSchema);
