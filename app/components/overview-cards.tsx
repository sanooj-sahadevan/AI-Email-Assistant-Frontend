import React from 'react';
import { CATEGORY_METADATA, CategoryCountsResponse, EmailCategory } from '../lib/types';

interface OverviewCardsProps {
  counts: CategoryCountsResponse | null;
  selectedCategory: EmailCategory | 'ALL';
  onSelectCategory: (category: EmailCategory | 'ALL') => void;
  isLoading?: boolean;
}

const CATEGORY_ORDER: EmailCategory[] = [
  'LINKEDIN_NOTIFICATION',
  'JOB_OPPORTUNITY',
  'RECRUITER',
  'COMPANY',
  'PERSONAL',
  'OTHER',
];

export function OverviewCards({
  counts,
  selectedCategory,
  onSelectCategory,
  isLoading = false,
}: OverviewCardsProps) {
  const total = counts?.total ?? 0;
  const unreadTotal = counts?.unreadTotal ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
      {/* Total Card */}
      <button
        type="button"
        onClick={() => onSelectCategory('ALL')}
        aria-pressed={selectedCategory === 'ALL'}
        className={`col-span-2 sm:col-span-1 lg:col-span-1 group relative flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 text-left transition-all duration-200 cursor-pointer ${
          selectedCategory === 'ALL'
            ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-600/20'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Inbox
          </span>
          {unreadTotal > 0 && (
            <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-200">
              {unreadTotal} new
            </span>
          )}
        </div>
        <div className="mt-2.5">
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isLoading ? '...' : total.toLocaleString()}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">All monitored</p>
        </div>
      </button>

      {/* Category Cards */}
      {CATEGORY_ORDER.map((catKey) => {
        const meta = CATEGORY_METADATA[catKey];
        const count = counts?.byCategory[catKey] ?? 0;
        const isSelected = selectedCategory === catKey;

        return (
          <button
            key={catKey}
            type="button"
            onClick={() => onSelectCategory(catKey)}
            aria-pressed={isSelected}
            title={meta.label}
            className={`group relative flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'shadow-xs ring-2'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
            style={
              isSelected
                ? {
                    borderColor: meta.color,
                    boxShadow: `0 0 0 2px ${meta.color}25`,
                    backgroundColor: `${meta.color}0d`,
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: meta.color }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                Filter
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isLoading ? '...' : count.toLocaleString()}
              </span>
              <p className="text-[11px] font-semibold truncate mt-0.5 text-slate-700 leading-tight">
                {meta.label}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
