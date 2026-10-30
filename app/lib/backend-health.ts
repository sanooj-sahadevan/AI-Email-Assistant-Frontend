import type { BackendHealthPayload } from "./health-types";
import { isBackendHealthPayload } from "./health-types";

export interface BackendHealthResult {
  statusCode: number;
  payload: BackendHealthPayload;
}

export async function getBackendHealth(): Promise<BackendHealthResult> {
  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");

  if (!backendUrl) {
    console.error("BACKEND_API_URL is not configured.");
    return {
      statusCode: 503,
      payload: {
        status: "unavailable",
        message: "Backend API URL is not configured.",
      },
    };
  }

  try {
    const response = await fetch(`${backendUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const body: unknown = await response.json();

    if (!response.ok || !isBackendHealthPayload(body)) {
      return {
        statusCode: 502,
        payload: {
          status: "unavailable",
          message: "Backend health check returned an invalid response.",
        },
      };
    }

    return {
      statusCode: response.status,
      payload: body,
    };
  } catch (error) {
    console.error("Backend health request failed.", error);
    return {
      statusCode: 503,
      payload: {
        status: "unavailable",
        message: "Backend health request failed.",
      },
    };
  }
}
