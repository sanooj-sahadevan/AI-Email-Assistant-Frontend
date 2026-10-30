import { NextResponse } from "next/server";
import { getBackendHealth } from "../../lib/backend-health";

export async function GET(_request: Request) {
  const result = await getBackendHealth();
  return NextResponse.json(result.payload, { status: result.statusCode });
}
