import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '"[unserializable]"';
  }
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? ` ${safeJson(meta)}` : "";
  console[level](`${message}${payload}`);
}
