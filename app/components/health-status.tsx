"use client";

import { useState } from "react";
import type { HealthState } from "../lib/health-types";
import { isBackendHealthPayload } from "../lib/health-types";

export default function HealthStatus({
  initialHealth,
}: {
  initialHealth: HealthState;
}) {
  const [health, setHealth] = useState<HealthState>(initialHealth);
  const [showDetails, setShowDetails] = useState(false);
  const isOnline = health.kind === "online";
  const isLoading = health.kind === "loading";

  async function checkHealth() {
    setHealth({ kind: "loading" });

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const payload: unknown = await response.json();

      if (!response.ok || !isBackendHealthPayload(payload)) {
        setHealth({
          kind: "offline",
          message: "The backend is not available. Check that the API and database are running.",
        });
        return;
      }

      setHealth(
        payload.status === "ok"
          ? { kind: "online", timestamp: payload.timestamp }
          : { kind: "offline", message: payload.message },
      );
    } catch {
      setHealth({
        kind: "offline",
        message: "Could not reach the backend. Ensure NestJS (port 3001) is running.",
      });
    }
  }

  return (
    <div className="relative">
      {/* Sleek Compact Header Status Pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-xs cursor-pointer ${
            isOnline
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100/90"
              : isLoading
                ? "border-amber-200 bg-amber-50/90 text-amber-800 hover:bg-amber-100/90"
                : "border-rose-200 bg-rose-50/90 text-rose-800 hover:bg-rose-100/90"
          }`}
          title="Click to view API health details"
          aria-expanded={showDetails}
        >
          <span
            className={`size-2 rounded-full ${
              isOnline
                ? "bg-emerald-500 animate-pulse"
                : isLoading
                  ? "bg-amber-500 animate-ping"
                  : "bg-rose-500"
            }`}
          />
          <span className="font-semibold">
            {isLoading
              ? "Checking API..."
              : isOnline
                ? "Backend Connected"
                : "Backend Offline"}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">▼</span>
        </button>

        <button
          type="button"
          onClick={() => void checkHealth()}
          disabled={isLoading}
          title="Refresh backend status"
          className="size-7 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <svg
            className={`size-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Popover Card for Status Details */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Service Health</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {isOnline ? "Operational" : "Degraded"}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500">NestJS API</span>
                <span className="font-semibold text-slate-900">
                  {isOnline ? "Port 3001 Connected" : "Connection Failed"}
                </span>
              </div>

              {health.kind === "online" ? (
                <div className="flex flex-col text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                  <span>Last verified:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(health.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              ) : null}

              {health.kind === "offline" ? (
                <p className="rounded-lg bg-rose-50 p-2 text-[11px] text-rose-700 leading-relaxed">
                  {health.message}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void checkHealth()}
              disabled={isLoading}
              className="mt-3 w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-1.5 text-xs font-medium text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Checking..." : "Recheck Connection"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
