const SENSITIVE = /token|authorization|password|secret|api.?key|cookie|bearer/i;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE.test(key)) {
    return "[redacted]";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return redact(value as Record<string, unknown>);
  }
  return value;
}

export function redact(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

export function log(
  event: string,
  fields: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...redact(fields),
    })
  );
}
