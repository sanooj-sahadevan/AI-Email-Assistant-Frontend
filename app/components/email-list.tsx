import React from 'react';
import { EmailRecord, PaginatedEmails } from '../lib/types';
import { CategoryBadge } from './category-badge';

interface EmailListProps {
  data: PaginatedEmails | null;
  isLoading: boolean;
  error: string | null;
  selectedEmailId: string | null;
  onSelectEmail: (email: EmailRecord) => void;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onSyncTrigger?: () => void;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    });
  } catch {
    return dateString;
  }
}

export function EmailList({
  data,
  isLoading,
  error,
  selectedEmailId,
  onSelectEmail,
  onPageChange,
  onRetry,
  onSyncTrigger,
}: EmailListProps) {
  // Error state
  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-3">
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-rose-900">Unable to load messages</h3>
        <p className="mt-1 text-sm text-rose-700 max-w-md mx-auto">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          Retry request
        </button>
      </div>
    );
  }

  // Loading skeleton state
  if (isLoading && !data) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded" />
            <div className="h-3.5 w-full bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const emails = data?.emails ?? [];

  // Empty state
  if (emails.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-4">
          <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-800">No emails found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          No messages match the current category, search term, or read status.
        </p>
        {onSyncTrigger && (
          <button
            type="button"
            onClick={onSyncTrigger}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync with Gmail
          </button>
        )}
      </div>
    );
  }

  // Active email list
  return (
    <div className="space-y-3">
      <ul className="space-y-2.5" role="list">
        {emails.map((email) => {
          const isSelected = selectedEmailId === email.id;

          return (
            <li key={email.id}>
              <button
                type="button"
                onClick={() => onSelectEmail(email)}
                className={`w-full group text-left rounded-2xl border p-4 sm:p-5 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Top Row: Sender, Unread Dot, Date */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {!email.isRead && (
                      <span
                        className="size-2 rounded-full bg-emerald-500 shrink-0"
                        title="Unread"
                        aria-label="Unread message"
                      />
                    )}
                    <span
                      className={`text-sm truncate ${
                        !email.isRead
                          ? 'font-bold text-slate-950'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {email.senderName || email.senderEmail || 'Unknown sender'}
                    </span>
                    {email.senderEmail && email.senderName && (
                      <span className="text-xs text-slate-400 font-mono truncate hidden sm:inline">
                        &lt;{email.senderEmail}&gt;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <CategoryBadge category={email.category} size="sm" />
                    <time
                      dateTime={email.receivedAt}
                      className="text-xs text-slate-400 font-medium ml-1"
                    >
                      {formatDate(email.receivedAt)}
                    </time>
                  </div>
                </div>

                {/* Middle Row: Subject */}
                <h4
                  className={`mt-2 text-sm leading-snug line-clamp-1 ${
                    !email.isRead
                      ? 'font-bold text-slate-900 group-hover:text-emerald-700'
                      : 'font-semibold text-slate-800 group-hover:text-slate-950'
                  }`}
                >
                  {email.subject || '(no subject)'}
                </h4>

                {/* Bottom Row: Snippet Preview */}
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {email.snippet || email.body || 'No preview available.'}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-semibold text-slate-700">{data.page}</span> of{' '}
            <span className="font-semibold text-slate-700">{data.totalPages}</span> ({data.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
