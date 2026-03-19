interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
}

function isSupabaseError(err: unknown): err is SupabaseError {
  return typeof err === "object" && err !== null && "code" in err;
}

/**
 * Structured error logger. Replaces bare console.error() calls.
 * Logs operation context, ISO timestamp, and Supabase error codes when available.
 */
export function logError(context: string, err: unknown): void {
  const timestamp = new Date().toISOString();
  const supabaseCode = isSupabaseError(err) ? err.code : undefined;

  console.error({
    context,
    timestamp,
    ...(supabaseCode && { supabaseCode }),
    error: err,
  });
}
