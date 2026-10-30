"use client";

import React, { useCallback, useEffect, useState } from "react";
import { emailApi } from "../lib/api";
import {
  CategoryCountsResponse,
  EmailCategory,
  EmailRecord,
  GmailStatus,
  PaginatedEmails,
} from "../lib/types";
import { EmailDetailModal } from "./email-detail-modal";
import { EmailList } from "./email-list";
import { NotificationsView } from "./notifications-view";
import { OverviewCards } from "./overview-cards";
import { Sidebar } from "./sidebar";
import { StatusBanner } from "./status-banner";

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

export function Dashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // View state: 'inbox' or 'notifications'
  const [currentSection, setCurrentSection] = useState<'inbox' | 'notifications'>('inbox');

  // Data states
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [counts, setCounts] = useState<CategoryCountsResponse | null>(null);
  const [emailData, setEmailData] = useState<PaginatedEmails | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);

  // Filter & Query states
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Action & Feedback states
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check staleness timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSyncedAt && Date.now() - lastSyncedAt.getTime() > STALE_THRESHOLD_MS) {
        setIsStale(true);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  // Load email list & counts
  const loadEmails = useCallback(async () => {
    setIsLoadingEmails(true);
    try {
      const [emailsRes, countsRes] = await Promise.all([
        emailApi.getEmails({
          page: currentPage,
          limit: 15,
          category: selectedCategory,
          search: debouncedSearch,
          isRead: unreadOnly ? false : undefined,
          sortOrder,
        }),
        emailApi.getEmailCounts(),
      ]);

      setEmailData(emailsRes);
      setCounts(countsRes);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load emails.");
    } finally {
      setIsLoadingEmails(false);
    }
  }, [currentPage, selectedCategory, debouncedSearch, unreadOnly, sortOrder]);

  // Load Gmail status
  const loadGmailStatus = useCallback(async () => {
    try {
      const status = await emailApi.getGmailStatus();
      setGmailStatus(status);
    } catch {
      // Non-fatal, status will show disconnected
    }
  }, []);

  // Check auth session on mount
  useEffect(() => {
    let active = true;
    emailApi
      .getSession()
      .then(async ({ authenticated: isAuth }) => {
        if (!active) return;
        setAuthenticated(isAuth);
        if (isAuth) {
          await loadGmailStatus();
          setLastSyncedAt(new Date());

          const params = new URLSearchParams(window.location.search);
          if (params.get("gmail") === "connected") {
            setNotice("Gmail account connected successfully!");
          } else if (params.get("gmail") === "error") {
            setError("Google OAuth authorization did not complete.");
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setError("Could not reach backend API. Ensure the backend server is running.");
      });

    return () => {
      active = false;
    };
  }, [loadGmailStatus]);

  // Load emails when filters or authentication state change
  useEffect(() => {
    if (!authenticated) return;
    let active = true;

    void (async () => {
      try {
        const [emailsRes, countsRes] = await Promise.all([
          emailApi.getEmails({
            page: currentPage,
            limit: 15,
            category: selectedCategory,
            search: debouncedSearch,
            isRead: unreadOnly ? false : undefined,
            sortOrder,
          }),
          emailApi.getEmailCounts(),
        ]);
        if (!active) return;
        setEmailData(emailsRes);
        setCounts(countsRes);
        setError(null);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load emails.");
      }
    })();

    return () => {
      active = false;
    };
  }, [authenticated, currentPage, selectedCategory, debouncedSearch, unreadOnly, sortOrder]);

  // Sign In
  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthBusy(true);
    setError(null);
    try {
      await emailApi.login(passphrase);
      setAuthenticated(true);
      setPassphrase("");
      await loadGmailStatus();
      await loadEmails();
      setLastSyncedAt(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed.");
      setAuthenticated(false);
    } finally {
      setAuthBusy(false);
    }
  }

  // Sign Out
  async function handleSignOut() {
    await emailApi.logout();
    setAuthenticated(false);
    setEmailData(null);
    setCounts(null);
    setGmailStatus(null);
  }

  // Connect Gmail
  async function handleConnectGmail() {
    setError(null);
    try {
      const url = await emailApi.getGmailAuthUrl();
      window.location.assign(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to initiate Gmail authorization.");
    }
  }

  // Disconnect Gmail
  async function handleDisconnectGmail() {
    if (!window.confirm("Disconnect Gmail and remove all stored emails from database?")) {
      return;
    }
    setError(null);
    try {
      await emailApi.disconnectGmail();
      setGmailStatus(null);
      await loadEmails();
      setNotice("Gmail disconnected and stored messages cleared.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to disconnect Gmail.");
    }
  }

  // Manual Gmail Sync
  async function handleManualSync() {
    setIsSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const result = await emailApi.syncGmail(25);
      await loadEmails();
      setLastSyncedAt(new Date());
      setIsStale(false);
      setNotice(
        `Gmail synced successfully! Fetched ${result.fetchedCount} messages, saved ${result.savedCount} new.`
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `Synchronization failed: ${cause.message}`
          : "Gmail synchronization failed."
      );
    } finally {
      setIsSyncing(false);
    }
  }

  // Reclassify Emails
  async function handleReclassify() {
    setIsReclassifying(true);
    setError(null);
    try {
      const result = await emailApi.reclassifyEmails();
      await loadEmails();
      setNotice(`Reclassification completed for ${result.updatedCount} emails.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reclassification failed.");
    } finally {
      setIsReclassifying(false);
    }
  }

  // Manual category update from modal
  async function handleUpdateCategory(id: string, newCategory: EmailCategory) {
    const updated = await emailApi.updateCategory(id, newCategory);
    // Update local state
    if (selectedEmail?.id === id) {
      setSelectedEmail(updated);
    }
    await loadEmails();
  }

  // Toggle read/unread status
  async function handleToggleRead(id: string, isRead: boolean) {
    const updated = await emailApi.updateReadStatus(id, isRead);
    if (selectedEmail?.id === id) {
      setSelectedEmail(updated);
    }
    await loadEmails();
  }

  // Unauthenticated screen
  if (authenticated === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-600">Initializing workspace...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white shadow-md">
              I
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Inbox Signal</h2>
              <p className="text-xs text-emerald-700 font-medium">Categorization & Filtering</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-900">Sign in to workspace</h3>
          <p className="mt-1 text-xs text-slate-500">
            Enter the private application passphrase configured on your backend server.
          </p>

          <form onSubmit={(e) => void handleSignIn(e)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="passphrase"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
              >
                Passphrase
              </label>
              <input
                id="passphrase"
                type="password"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md disabled:opacity-60 cursor-pointer"
            >
              {authBusy ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>

          {error && <p className="mt-4 text-xs font-medium text-rose-600 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Detail Modal */}
      <EmailDetailModal
        key={selectedEmail?.id ?? 'closed'}
        isOpen={selectedEmail !== null}
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onUpdateCategory={handleUpdateCategory}
        onToggleRead={handleToggleRead}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left Column: Sidebar Navigation */}
          <Sidebar
            currentSection={currentSection}
            onChangeSection={setCurrentSection}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            unreadOnly={unreadOnly}
            onToggleUnreadOnly={(val) => {
              setUnreadOnly(val);
              setCurrentPage(1);
            }}
            counts={counts}
            gmailStatus={gmailStatus}
            onConnectGmail={handleConnectGmail}
            onDisconnectGmail={handleDisconnectGmail}
            onReclassify={handleReclassify}
            onSignOut={handleSignOut}
            isReclassifying={isReclassifying}
            isSyncing={isSyncing}
          />

          {/* Right Column: Main Content Dashboard */}
          <main className="flex flex-col space-y-6">
            {currentSection === 'notifications' ? (
              <NotificationsView />
            ) : (
              <>
                {/* Top Bar: Search, Sort, Manual Sync Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
              {/* Search Box */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails by sender, subject, or content..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-9 text-xs sm:text-sm text-slate-900 outline-none transition focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Buttons: Sort & Sync */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Toggle received date sort order"
                >
                  Date: {sortOrder === "desc" ? "Newest" : "Oldest"}
                </button>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing || !gmailStatus?.connected}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg
                    className={`size-3.5 ${isSyncing ? "animate-spin text-white" : ""}`}
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
                  {isSyncing ? "Syncing Gmail..." : "Sync Gmail"}
                </button>
              </div>
            </div>

            {/* Notification / Alert / Stale Status Banners */}
            <StatusBanner
              error={error}
              notice={notice}
              lastSyncedAt={lastSyncedAt}
              isStale={isStale}
              onClearError={() => setError(null)}
              onClearNotice={() => setNotice(null)}
              onTriggerSync={handleManualSync}
            />

            {/* Overview Cards (Total and Category breakdown) */}
            <OverviewCards
              counts={counts}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              isLoading={isLoadingEmails}
            />

            {/* Email List Section */}
            <section
              className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
              aria-label="Filtered email list"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    {selectedCategory === "ALL"
                      ? "All Inbox Messages"
                      : `${selectedCategory.replace(/_/g, " ")} Messages`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {emailData ? `${emailData.total} messages match criteria` : "Loading..."}
                    {unreadOnly ? " (showing unread only)" : ""}
                  </p>
                </div>

                {debouncedSearch && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 font-medium">
                    Search: &ldquo;{debouncedSearch}&rdquo;
                  </span>
                )}
              </div>

              <EmailList
                data={emailData}
                isLoading={isLoadingEmails}
                error={error}
                selectedEmailId={selectedEmail?.id ?? null}
                onSelectEmail={(email) => setSelectedEmail(email)}
                onPageChange={(page) => setCurrentPage(page)}
                onRetry={loadEmails}
                onSyncTrigger={handleManualSync}
              />
            </section>
          </>
        )}
      </main>
        </div>
      </div>
    </div>
  );
}
