import React from 'react';

interface StatusBannerProps {
  error: string | null;
  notice: string | null;
  lastSyncedAt: Date | null;
  isStale: boolean;
  onClearError: () => void;
  onClearNotice: () => void;
  onTriggerSync: () => void;
}

export function StatusBanner({
  error,
  notice,
  lastSyncedAt,
  isStale,
  onClearError,
  onClearNotice,
  onTriggerSync,
}: StatusBannerProps) {
  if (!error && !notice && !isStale) return null;

  return (
    <div className="space-y-2.5 mb-4" aria-live="polite">
      {/* Error Banner */}
      {error && (
        <div className="flex items-start justify-between rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <svg
              className="size-5 shrink-0 text-rose-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-rose-900">
                {error === "Internal server error"
                  ? "Backend Server or Database Error"
                  : "Attention Required"}
              </span>
              <span className="text-xs text-rose-700 leading-relaxed">
                {error === "Internal server error"
                  ? "The backend API could not query the database. Ensure the PostgreSQL container (port 5432) and NestJS server (port 3001) are healthy."
                  : error}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="text-rose-500 hover:text-rose-800 font-bold p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success / Info Notice Banner */}
      {notice && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <svg
              className="size-5 shrink-0 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{notice}</span>
          </div>
          <button
            type="button"
            onClick={onClearNotice}
            className="text-emerald-600 hover:text-emerald-900 font-bold p-1 cursor-pointer"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stale Data Warning Banner */}
      {isStale && !error && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <svg
              className="size-4 shrink-0 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Inbox data may be stale (last synchronized{" "}
              {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : "earlier"}).
            </span>
          </div>
          <button
            type="button"
            onClick={onTriggerSync}
            className="font-semibold text-amber-900 underline hover:text-amber-700 cursor-pointer"
          >
            Sync now
          </button>
        </div>
      )}
    </div>
  );
}
