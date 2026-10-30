import { connection } from "next/server";
import HealthStatus from "./health-status";
import { getBackendHealth } from "../lib/backend-health";

export default async function HealthPanel() {
  await connection();
  const result = await getBackendHealth();

  const initialHealth =
    result.payload.status === "ok"
      ? { kind: "online" as const, timestamp: result.payload.timestamp }
      : { kind: "offline" as const, message: result.payload.message };

  return <HealthStatus initialHealth={initialHealth} />;
}
