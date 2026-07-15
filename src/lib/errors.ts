/**
 * Supabase's query/RPC calls (postgrest-js) resolve errors as plain objects
 * with a `message` field — not real `Error` instances — unless the caller
 * explicitly opts into `.throwOnError()`. Since this codebase does
 * `if (error) throw error` on those plain objects, a bare `err instanceof
 * Error` check in a catch block always misses them and silently swallows
 * the real reason (e.g. "Not authorized", a missing RPC function, a
 * foreign-key violation), showing only a generic fallback instead. Route
 * any user-facing error message through this helper rather than checking
 * `instanceof Error` directly.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
