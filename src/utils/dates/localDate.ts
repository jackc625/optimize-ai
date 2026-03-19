import { format } from "date-fns";

/**
 * Returns today's date as "YYYY-MM-DD" in the user's local timezone.
 * Replaces: new Date().toISOString().split('T')[0]
 */
export function getLocalDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Formats an arbitrary Date as "YYYY-MM-DD" in local timezone.
 */
export function formatLocalDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
