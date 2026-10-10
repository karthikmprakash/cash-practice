const SENSITIVE_KEY = /email|phone|name|dob|diagnosis|body|npi|tax|ssn|address|token|password|secret|authorization|cookie|payload/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

const lines: string[] = [];

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(EMAIL, "[redacted]").replace(PHONE, "[redacted]");
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redact(inner);
    }
    return out;
  }
  return value;
}

export function logInfo(message: string, meta?: unknown): void {
  const line = JSON.stringify({ level: "info", message: redact(message), meta: meta === undefined ? undefined : redact(meta) });
  lines.push(line);
  if (process.env.LOG_TO_STDOUT === "1") {
    console.log(line);
  }
}

export function recentLogs(): string[] {
  return [...lines];
}

export function clearLogs(): void {
  lines.length = 0;
}
