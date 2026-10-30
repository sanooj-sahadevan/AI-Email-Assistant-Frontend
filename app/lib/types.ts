export type EmailCategory =
  | 'LINKEDIN_NOTIFICATION'
  | 'JOB_OPPORTUNITY'
  | 'RECRUITER'
  | 'COMPANY'
  | 'PERSONAL'
  | 'OTHER';

export interface EmailRecord {
  id: string;
  gmailMessageId: string;
  threadId: string | null;
  senderEmail: string | null;
  senderName: string | null;
  subject: string;
  snippet: string | null;
  body: string | null;
  receivedAt: string;
  isRead: boolean;
  category: EmailCategory;
  categorySource: 'RULE' | 'MANUAL';
  classificationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCountsResponse {
  total: number;
  unreadTotal: number;
  byCategory: Record<EmailCategory, number>;
}

export interface EmailQueryParams {
  page?: number;
  limit?: number;
  category?: EmailCategory | 'ALL';
  search?: string;
  isRead?: boolean;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedEmails {
  emails: EmailRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GmailStatus {
  connected: boolean;
  accountEmail: string | null;
  connectedAt: string | null;
}

export interface SyncResult {
  fetchedCount: number;
  savedCount: number;
  nextPageToken: string | null;
}

export interface CategorySuggestion {
  category: EmailCategory;
  reason: string;
  confidence: number;
  source: 'ollama' | 'rules';
  currentCategory: EmailCategory;
  currentCategorySource: 'RULE' | 'MANUAL';
  fallback: boolean;
}

export interface CategoryMeta {
  key: EmailCategory;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const CATEGORY_METADATA: Record<EmailCategory, CategoryMeta> = {
  LINKEDIN_NOTIFICATION: {
    key: 'LINKEDIN_NOTIFICATION',
    label: 'LinkedIn',
    color: '#0A66C2',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-400',
    badgeBorder: 'border-sky-200 dark:border-sky-800',
    description: 'Invitations, profile updates & network alerts',
  },
  JOB_OPPORTUNITY: {
    key: 'JOB_OPPORTUNITY',
    label: 'Job Opportunities',
    color: '#059669',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    description: 'Applications, interviews, offers & ATS notices',
  },
  RECRUITER: {
    key: 'RECRUITER',
    label: 'Recruiters',
    color: '#7C3AED',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    description: 'Direct headhunter & talent partner outreach',
  },
  COMPANY: {
    key: 'COMPANY',
    label: 'Company',
    color: '#D97706',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    description: 'Workplace SaaS, billing invoices & company updates',
  },
  PERSONAL: {
    key: 'PERSONAL',
    label: 'Personal',
    color: '#2563EB',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    description: 'Friends, family & personal webmail conversations',
  },
  OTHER: {
    key: 'OTHER',
    label: 'Other',
    color: '#64748B',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    description: 'General newsletters & uncategorized correspondence',
  },
};

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export type NotificationType = 'WHATSAPP_ALERT' | 'TEST';

export interface NotificationRecord {
  id: string;
  emailId: string | null;
  gmailMessageId: string | null;
  type: NotificationType;
  recipient: string;
  sender: string | null;
  subject: string;
  category: EmailCategory | null;
  preview: string;
  status: NotificationStatus;
  retryCount: number;
  maxRetries: number;
  errorDetails: string | null;
  provider: string;
  metadata?: Record<string, unknown> | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  match: {
    categories?: EmailCategory[];
    senderAddresses?: string[];
    senderDomains?: string[];
    keywords?: string[];
  };
  action: 'NOTIFY' | 'IGNORE';
  customRecipient?: string;
}

export interface NotificationConfig {
  enabledCategories: EmailCategory[];
  rules: NotificationRule[];
  recipientPhone: string;
  maxSnippetLength: number;
  initialSyncCutoffHours: number;
  deliveryProvider: 'mock_whatsapp' | 'whatsapp_cloud_api';
}

export interface PaginatedNotifications {
  notifications: NotificationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
