import React from 'react';
import { CATEGORY_METADATA, EmailCategory } from '../lib/types';

interface CategoryBadgeProps {
  category: EmailCategory;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'md',
  showDot = true,
  className = '',
}: CategoryBadgeProps) {
  const meta = CATEGORY_METADATA[category] || CATEGORY_METADATA.OTHER;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${sizeClasses} ${className}`}
      title={meta.description}
    >
      {showDot && (
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
          aria-hidden="true"
        />
      )}
      {meta.label}
    </span>
  );
}
