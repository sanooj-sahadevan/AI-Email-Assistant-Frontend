import {
  CategoryCountsResponse,
  CategorySuggestion,
  EmailCategory,
  EmailQueryParams,
  EmailRecord,
  GmailStatus,
  NotificationConfig,
  NotificationRecord,
  NotificationStatus,
  PaginatedEmails,
  PaginatedNotifications,
  SyncResult,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as { message?: unknown };
      if (typeof data.message === 'string') {
        message = data.message;
      } else if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      }
    } catch {
      // JSON parse failed, use fallback message
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export const emailApi = {
  async getCategorySuggestion(id: string): Promise<CategorySuggestion> {
    const res = await fetch(
      `${API_BASE}/api/ai/emails/${encodeURIComponent(id)}/category-suggestion`,
      { method: 'POST' },
    );
    return handleResponse<CategorySuggestion>(res);
  },

  async summarizeEmail(id: string): Promise<{ summary: string; source: 'ollama' }> {
    const res = await fetch(
      `${API_BASE}/api/ai/emails/${encodeURIComponent(id)}/summary`,
      { method: 'POST' },
    );
    return handleResponse<{ summary: string; source: 'ollama' }>(res);
  },

  async getSession(): Promise<{ authenticated: boolean }> {
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      cache: 'no-store',
    });
    return { authenticated: res.ok };
  },

  async login(passphrase: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    });
    await handleResponse(res);
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new ApiError('Sign out failed.', res.status);
    }
  },

  async getGmailStatus(): Promise<GmailStatus> {
    const res = await fetch(`${API_BASE}/api/gmail/status`, {
      cache: 'no-store',
    });
    return handleResponse<GmailStatus>(res);
  },

  async getGmailAuthUrl(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/gmail/connect`, {
      cache: 'no-store',
    });
    const data = await handleResponse<{ authorizationUrl: string }>(res);
    return data.authorizationUrl;
  },

  async syncGmail(limit = 25, pageToken?: string): Promise<SyncResult> {
    const res = await fetch(`${API_BASE}/api/gmail/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit,
        ...(pageToken ? { pageToken } : {}),
      }),
    });
    return handleResponse<SyncResult>(res);
  },

  async disconnectGmail(): Promise<{ deletedMessages: number; googleAccessRevoked: boolean }> {
    const res = await fetch(`${API_BASE}/api/gmail/disconnect`, {
      method: 'DELETE',
    });
    return handleResponse<{ deletedMessages: number; googleAccessRevoked: boolean }>(res);
  },

  async getEmails(params: EmailQueryParams = {}): Promise<PaginatedEmails> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.category && params.category !== 'ALL') {
      query.set('category', params.category);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (typeof params.isRead === 'boolean') {
      query.set('isRead', String(params.isRead));
    }
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryStr = query.toString();
    const endpoint = `${API_BASE}/api/emails${queryStr ? `?${queryStr}` : ''}`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    return handleResponse<PaginatedEmails>(res);
  },

  async getEmailCounts(): Promise<CategoryCountsResponse> {
    const res = await fetch(`${API_BASE}/api/emails/counts`, {
      cache: 'no-store',
    });
    return handleResponse<CategoryCountsResponse>(res);
  },

  async getEmailById(id: string): Promise<EmailRecord> {
    const res = await fetch(`${API_BASE}/api/emails/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    return handleResponse<EmailRecord>(res);
  },

  async updateCategory(
    id: string,
    category: EmailCategory,
  ): Promise<EmailRecord> {
    const res = await fetch(
      `${API_BASE}/api/emails/${encodeURIComponent(id)}/category`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      },
    );
    return handleResponse<EmailRecord>(res);
  },

  async updateReadStatus(
    id: string,
    isRead: boolean,
  ): Promise<EmailRecord> {
    const res = await fetch(
      `${API_BASE}/api/emails/${encodeURIComponent(id)}/read`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      },
    );
    return handleResponse<EmailRecord>(res);
  },

  async reclassifyEmails(): Promise<{ updatedCount: number }> {
    const res = await fetch(`${API_BASE}/api/emails/reclassify`, {
      method: 'POST',
    });
    return handleResponse<{ updatedCount: number }>(res);
  },

  async getNotificationHistory(params: {
    page?: number;
    limit?: number;
    status?: NotificationStatus;
  } = {}): Promise<PaginatedNotifications> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);

    const queryStr = query.toString();
    const endpoint = `${API_BASE}/api/notifications${queryStr ? `?${queryStr}` : ''}`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    return handleResponse<PaginatedNotifications>(res);
  },

  async getNotificationConfig(): Promise<NotificationConfig> {
    const res = await fetch(`${API_BASE}/api/notifications/config`, {
      cache: 'no-store',
    });
    return handleResponse<NotificationConfig>(res);
  },

  async updateNotificationConfig(
    config: Partial<NotificationConfig>,
  ): Promise<NotificationConfig> {
    const res = await fetch(`${API_BASE}/api/notifications/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse<NotificationConfig>(res);
  },

  async sendTestNotification(dto: {
    recipient?: string;
    message?: string;
  } = {}): Promise<NotificationRecord> {
    const res = await fetch(`${API_BASE}/api/notifications/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handleResponse<NotificationRecord>(res);
  },

  async retryNotification(id: string): Promise<NotificationRecord> {
    const res = await fetch(
      `${API_BASE}/api/notifications/${encodeURIComponent(id)}/retry`,
      {
        method: 'POST',
      },
    );
    return handleResponse<NotificationRecord>(res);
  },
};
