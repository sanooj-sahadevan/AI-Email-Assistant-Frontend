export type BackendHealthPayload =
  | { status: "ok"; timestamp: string }
  | { status: "unavailable"; message: string };

export type HealthState =
  | { kind: "loading" }
  | { kind: "online"; timestamp: string }
  | { kind: "offline"; message: string };

export function isBackendHealthPayload(
  value: unknown,
): value is BackendHealthPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    (payload.status === "ok" && typeof payload.timestamp === "string") ||
    (payload.status === "unavailable" && typeof payload.message === "string")
  );
}
