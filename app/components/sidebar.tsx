import React from 'react';
import {
  CATEGORY_METADATA,
  CategoryCountsResponse,
  EmailCategory,
  GmailStatus,
} from '../lib/types';

interface SidebarProps {
  currentSection: 'inbox' | 'notifications';
  onChangeSection: (section: 'inbox' | 'notifications') => void;
  selectedCategory: EmailCategory | 'ALL';
  onSelectCategory: (category: EmailCategory | 'ALL') => void;
  unreadOnly: boolean;
  onToggleUnreadOnly: (unreadOnly: boolean) => void;
  counts: CategoryCountsResponse | null;
  gmailStatus: GmailStatus | null;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  onReclassify: () => void;
  onSignOut: () => void;
  isReclassifying?: boolean;
  isSyncing?: boolean;
}

const CATEGORY_ITEMS: { key: EmailCategory; label: string }[] = [
  { key: 'LINKEDIN_NOTIFICATION', label: 'LinkedIn' },
  { key: 'JOB_OPPORTUNITY', label: 'Job Opportunities' },
  { key: 'RECRUITER', label: 'Recruiters' },
  { key: 'COMPANY', label: 'Company' },
  { key: 'PERSONAL', label: 'Personal' },
  { key: 'OTHER', label: 'Other' },
];

export function Sidebar({
  currentSection,
  onChangeSection,
  selectedCategory,
  onSelectCategory,
  unreadOnly,
  onToggleUnreadOnly,
  counts,
  gmailStatus,
  onConnectGmail,
  onDisconnectGmail,
  onReclassify,
  onSignOut,
  isReclassifying = false,
  isSyncing = false,
}: SidebarProps) {
  const total = counts?.total ?? 0;
  const unreadTotal = counts?.unreadTotal ?? 0;

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-3xl p-5 shadow-xl border border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Inbox Signal</h2>
            <p className="text-[10px] text-emerald-400 font-medium">Assistant Controls</p>
          </div>
        </div>
      </div>

      {/* Gmail Connection Status Card */}
      <div className="mt-4 rounded-2xl bg-slate-800/60 p-3.5 border border-slate-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                gmailStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-slate-300">
              {gmailStatus?.connected ? 'Gmail Connected' : 'Gmail Disconnected'}
            </span>
          </div>
          {isSyncing && (
            <span className="text-[10px] text-emerald-400 font-medium">Syncing...</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400 truncate">
          {gmailStatus?.connected
            ? gmailStatus.accountEmail
            : 'Link Google account to import'}
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          {gmailStatus?.connected ? (
            <button
              type="button"
              onClick={onDisconnectGmail}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectGmail}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-all shadow-xs cursor-pointer"
            >
              Connect Gmail
            </button>
          )}
        </div>
      </div>

      {/* Primary Section Switcher */}
      <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60">
        <button
          type="button"
          onClick={() => onChangeSection('inbox')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentSection === 'inbox'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Inbox
        </button>

        <button
          type="button"
          onClick={() => onChangeSection('notifications')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentSection === 'notifications'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Alerts
        </button>
      </div>

      {/* Navigation & Category Filters */}
      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Categories">
        {currentSection === 'inbox' ? (
          <>
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Views & Filters
            </div>

            {/* All Emails */}
            <button
              type="button"
              onClick={() => onSelectCategory('ALL')}
              aria-current={selectedCategory === 'ALL' ? 'page' : undefined}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-700/60 text-white border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <svg
                  className="size-4 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                All Messages
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                {total}
              </span>
            </button>

            {/* Categories */}
            <div className="pt-3 pb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Categories
            </div>
            {CATEGORY_ITEMS.map((item) => {
              const meta = CATEGORY_METADATA[item.key];
              const count = counts?.byCategory[item.key] ?? 0;
              const isSelected = selectedCategory === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectCategory(item.key)}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white border'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: meta.color,
                          backgroundColor: `${meta.color}20`,
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{meta.label}</span>
                  </span>
                  <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-400 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Read / Unread Status Filter Toggle */}
            <div className="pt-4 pb-2 px-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                  Unread only ({unreadTotal})
                </span>
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => onToggleUnreadOnly(e.target.checked)}
                  className="size-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer accent-emerald-500"
                />
              </label>
            </div>
          </>
        ) : (
          <div className="p-3 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-200">WhatsApp Alert Rules</p>
            <p className="text-[11px] leading-relaxed">
              Manage target recipient, category alerts, and review simulated delivery logs.
            </p>
          </div>
        )}
      </nav>

      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onReclassify}
          disabled={isReclassifying || total === 0}
          title="Re-evaluates all saved emails against your classification rules"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg
            className={`size-3.5 ${isReclassifying ? 'animate-spin text-emerald-400' : 'text-slate-400'}`}
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
          {isReclassifying ? 'Reclassifying...' : 'Re-run Rules'}
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full text-center py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
