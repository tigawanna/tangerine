/**
 * Collects human-readable error text from nested server-fn, fetch, and Error shapes.
 *
 * @param err - Unknown error value from a catch block or rejected promise.
 */
export function collectErrorMessages(err: unknown): string[] {
  const messages: string[] = [];
  const seen = new Set<unknown>();

  const visit = (value: unknown, depth = 0) => {
    if (value == null || depth > 5 || seen.has(value)) {
      return;
    }
    seen.add(value);

    if (typeof value === "string") {
      messages.push(value);
      return;
    }

    if (value instanceof Error) {
      messages.push(value.message);
      if (value.cause != null) {
        visit(value.cause, depth + 1);
      }
      return;
    }

    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
      messages.push(String(value));
      return;
    }

    if (typeof value === "symbol") {
      messages.push(value.toString());
      return;
    }

    if (typeof value === "function") {
      messages.push(value.name || "[function]");
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const record = value as Record<string, unknown>;

    for (const key of ["message", "error", "cause", "data", "s", "result"]) {
      if (key in record) {
        visit(record[key], depth + 1);
      }
    }
  };

  visit(err);
  return messages;
}

/**
 * Normalizes unknown errors into an `Error` with a useful message.
 *
 * Handles TanStack Start server-fn payloads that deserialize as plain objects
 * instead of `Error` instances.
 */
export function unwrapUnknownError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }

  const messages = collectErrorMessages(err).filter(Boolean);
  if (messages.length > 0) {
    return new Error(messages.join(" · "));
  }

  return new Error(String(err));
}
