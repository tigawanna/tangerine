/**
 * Normalize Eden Treaty `{ error }` payloads into a readable message.
 */
export function treatyErrorMessage(error: { value?: unknown; status?: unknown }): string {
  if (typeof error.value === "string") return error.value;
  if (error.value != null) return JSON.stringify(error.value);
  if (typeof error.status === "string" || typeof error.status === "number") {
    return String(error.status);
  }
  if (error.status != null) return JSON.stringify(error.status);
  return "request failed";
}
