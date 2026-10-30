import React, { useEffect, useState } from 'react';
import { CATEGORY_METADATA, EmailCategory, EmailRecord } from '../lib/types';
import { CategoryBadge } from './category-badge';
import { emailApi } from '../lib/api';
import type { CategorySuggestion } from '../lib/types';

interface EmailDetailModalProps {
  email: EmailRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (id: string, newCategory: EmailCategory) => Promise<void>;
  onToggleRead: (id: string, isRead: boolean) => Promise<void>;
}

const ALL_CATEGORIES: EmailCategory[] = [
  'LINKEDIN_NOTIFICATION',
  'JOB_OPPORTUNITY',
  'RECRUITER',
  'COMPANY',
  'PERSONAL',
  'OTHER',
];

export function EmailDetailModal({
  email,
  isOpen,
  onClose,
  onUpdateCategory,
  onToggleRead,
}: EmailDetailModalProps) {
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isUpdatingRead, setIsUpdatingRead] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<'suggestion' | 'summary' | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !email) return null;

  async function handleCategoryChange(newCategory: EmailCategory) {
    if (!email || newCategory === email.category || isUpdatingCategory) return;
    setIsUpdatingCategory(true);
    setCategoryFeedback(null);
    try {
      await onUpdateCategory(email.id, newCategory);
      setCategoryFeedback(`Category updated to ${CATEGORY_METADATA[newCategory].label}`);
      setTimeout(() => setCategoryFeedback(null), 3000);
    } catch {
      setCategoryFeedback('Failed to update category.');
    } finally {
      setIsUpdatingCategory(false);
    }
  }

  async function handleToggleRead() {
    if (!email || isUpdatingRead) return;
    setIsUpdatingRead(true);
    try {
      await onToggleRead(email.id, !email.isRead);
    } finally {
      setIsUpdatingRead(false);
    }
  }

  async function requestSuggestion() {
    if (!email || aiBusy) return;
    setAiBusy('suggestion');
    setAiError(null);
    try {
      setSuggestion(await emailApi.getCategorySuggestion(email.id));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Category suggestion failed.');
    } finally {
      setAiBusy(null);
    }
  }

  async function requestSummary() {
    if (!email || aiBusy) return;
    setAiBusy('summary');
    setAiError(null);
    try {
      const result = await emailApi.summarizeEmail(email.id);
      setSummary(result.summary);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Summarization failed.');
    } finally {
      setAiBusy(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-subject"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="space-y-1.5 max-w-[85%]">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={email.category} size="md" />
              <button
                type="button"
                onClick={() => void handleToggleRead()}
                disabled={isUpdatingRead}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors cursor-pointer ${
                  email.isRead
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold'
                }`}
              >
                {isUpdatingRead ? 'Updating...' : email.isRead ? 'Mark as Unread' : 'Mark as Read'}
              </button>
            </div>
            <h2 id="modal-subject" className="text-xl font-bold text-slate-950 leading-snug">
              {email.subject || '(No subject)'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sender & Metadata Bar */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-semibold text-slate-900 text-sm">
              {email.senderName || email.senderEmail || 'Unknown sender'}
            </p>
            {email.senderEmail && (
              <p className="text-slate-500 font-mono mt-0.5">{email.senderEmail}</p>
            )}
          </div>
          <div className="text-right text-slate-500">
            <time dateTime={email.receivedAt}>
              {new Date(email.receivedAt).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </time>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Classification Reason Callout */}
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-emerald-50/20 p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 text-xs">
                <span className="font-semibold text-slate-900">Classification Details: </span>
                <span className="text-slate-700 font-medium">
                  {email.classificationReason || 'Classified by rule match'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gmail Message ID: {email.gmailMessageId}
                </p>
              </div>
            </div>
          </div>

          {/* Email Body Content */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void requestSuggestion()} disabled={aiBusy !== null} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-50">
              {aiBusy === 'suggestion' ? 'Checking category…' : 'Suggest category'}
            </button>
            <button type="button" onClick={() => void requestSummary()} disabled={aiBusy !== null} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
              {aiBusy === 'summary' ? 'Summarizing locally…' : 'Summarize with local AI'}
            </button>
          </div>
          {aiError ? <p role="alert" className="text-xs text-rose-700">{aiError}</p> : null}
          {suggestion ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-950">Suggested: {CATEGORY_METADATA[suggestion.category].label} ({suggestion.source === 'ollama' ? 'Ollama' : 'rule fallback'})</p>
            <p className="mt-1 text-emerald-900">{suggestion.reason} · {Math.round(suggestion.confidence * 100)}% confidence</p>
            {suggestion.currentCategorySource === 'MANUAL' ? <p className="mt-2 text-xs text-emerald-900">Your current category was set manually and has not been changed.</p> : null}
            {suggestion.category !== email.category ? <button type="button" disabled={isUpdatingCategory} onClick={() => void handleCategoryChange(suggestion.category)} className="mt-3 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Apply suggestion</button> : <p className="mt-2 text-xs text-emerald-900">This matches the current category.</p>}
          </div> : null}
          {summary ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Local AI summary</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{summary}</p></div> : null}
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 min-h-[160px]">
            {email.body || email.snippet || '(No content available for this email.)'}
          </div>

          {/* Manual Category Reassignment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Change Category Manually
                </p>
                <p className="text-[11px] text-slate-500">
                  Select a category below to reclassify this email immediately
                </p>
              </div>
              {categoryFeedback && (
                <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                  {categoryFeedback}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((catKey) => {
                const meta = CATEGORY_METADATA[catKey];
                const isCurrent = email.category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    disabled={isUpdatingCategory || isCurrent}
                    onClick={() => void handleCategoryChange(catKey)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: isCurrent ? '#fff' : meta.color }}
                      aria-hidden="true"
                    />
                    {meta.label}
                    {isCurrent && <span className="text-[10px] opacity-80">(Current)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
