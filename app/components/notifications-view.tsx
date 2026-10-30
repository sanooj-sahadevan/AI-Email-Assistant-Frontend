import React, { useCallback, useEffect, useState } from "react";
import { emailApi } from "../lib/api";
import {
  CATEGORY_METADATA,
  EmailCategory,
  NotificationConfig,
  NotificationRule,
  NotificationStatus,
  PaginatedNotifications,
} from "../lib/types";
import { CategoryBadge } from "./category-badge";

const ALL_CATEGORIES: EmailCategory[] = [
  "JOB_OPPORTUNITY",
  "RECRUITER",
  "COMPANY",
  "LINKEDIN_NOTIFICATION",
  "PERSONAL",
  "OTHER",
];

export function NotificationsView() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [history, setHistory] = useState<PaginatedNotifications | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Loading & Action states
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Feedback alerts
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Rule form state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePriority, setNewRulePriority] = useState(10);
  const [newRuleAction, setNewRuleAction] = useState<"NOTIFY" | "IGNORE">("NOTIFY");
  const [newRuleDomains, setNewRuleDomains] = useState("");
  const [newRuleKeywords, setNewRuleKeywords] = useState("");

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const data = await emailApi.getNotificationConfig();
      setConfig(data);
    } catch {
      setFeedback({ type: "error", text: "Failed to load notification settings." });
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await emailApi.getNotificationHistory({
        page: currentPage,
        limit: 15,
        status: activeTab === "ALL" ? undefined : activeTab,
      });
      setHistory(data);
    } catch {
      setFeedback({ type: "error", text: "Failed to load notification history." });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentPage, activeTab]);

  useEffect(() => {
    let active = true;
    void emailApi.getNotificationConfig().then((data) => {
      if (active) setConfig(data);
    }).catch(() => {
      if (active) setFeedback({ type: "error", text: "Failed to load notification settings." });
    }).finally(() => {
      if (active) setIsLoadingConfig(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void emailApi.getNotificationHistory({
      page: currentPage,
      limit: 15,
      status: activeTab === "ALL" ? undefined : activeTab,
    }).then((data) => {
      if (active) setHistory(data);
    }).catch(() => {
      if (active) setFeedback({ type: "error", text: "Failed to load notification history." });
    }).finally(() => {
      if (active) setIsLoadingHistory(false);
    });
    return () => { active = false; };
  }, [currentPage, activeTab]);

  // Toggle Category
  async function handleToggleCategory(category: EmailCategory) {
    if (!config || isSavingConfig) return;
    const current = new Set(config.enabledCategories);
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }

    const updatedCategories = Array.from(current);
    setConfig({ ...config, enabledCategories: updatedCategories });

    try {
      await emailApi.updateNotificationConfig({ enabledCategories: updatedCategories });
      setFeedback({ type: "success", text: "Category preferences updated." });
    } catch {
      setFeedback({ type: "error", text: "Failed to update category setting." });
      void loadConfig();
    }
  }

  // Update Recipient Phone
  async function handleUpdateRecipientPhone(phone: string) {
    if (!config) return;
    setConfig({ ...config, recipientPhone: phone });
  }

  async function handleSaveGeneralSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!config || isSavingConfig) return;
    setIsSavingConfig(true);
    setFeedback(null);
    try {
      const saved = await emailApi.updateNotificationConfig({
        recipientPhone: config.recipientPhone,
        initialSyncCutoffHours: config.initialSyncCutoffHours,
        maxSnippetLength: config.maxSnippetLength,
      });
      setConfig(saved);
      setFeedback({ type: "success", text: "Notification settings saved successfully." });
    } catch {
      setFeedback({ type: "error", text: "Failed to save settings." });
    } finally {
      setIsSavingConfig(false);
    }
  }

  // Add Custom Rule
  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!config || !newRuleName.trim()) return;

    const domains = newRuleDomains
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const keywords = newRuleKeywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const newRule: NotificationRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      enabled: true,
      priority: Number(newRulePriority) || 10,
      action: newRuleAction,
      match: {
        senderDomains: domains.length > 0 ? domains : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      },
    };

    const updatedRules = [...config.rules, newRule];
    setConfig({ ...config, rules: updatedRules });
    setShowRuleModal(false);

    // Reset inputs
    setNewRuleName("");
    setNewRuleDomains("");
    setNewRuleKeywords("");

    try {
      await emailApi.updateNotificationConfig({ rules: updatedRules });
      setFeedback({ type: "success", text: `Rule "${newRule.name}" created.` });
    } catch {
      setFeedback({ type: "error", text: "Failed to save rule." });
      void loadConfig();
    }
  }

  // Remove Rule
  async function handleRemoveRule(id: string) {
    if (!config) return;
    const updatedRules = config.rules.filter((r) => r.id !== id);
    setConfig({ ...config, rules: updatedRules });
    try {
      await emailApi.updateNotificationConfig({ rules: updatedRules });
      setFeedback({ type: "success", text: "Rule deleted." });
    } catch {
      setFeedback({ type: "error", text: "Failed to delete rule." });
      void loadConfig();
    }
  }

  // Send Manual Test Notification
  async function handleSendTest() {
    setIsSendingTest(true);
    setFeedback(null);
    try {
      await emailApi.sendTestNotification({
        recipient: config?.recipientPhone,
        message: "🔔 *Manual Test Alert* from Inbox Signal!\nThis is a test of the configured WhatsApp notification delivery.",
      });
      setFeedback({
        type: "success",
        text: config?.deliveryProvider === "mock_whatsapp"
          ? "Test recorded in history. Mock mode does not send a WhatsApp message."
          : "Test message accepted by the WhatsApp Cloud API.",
      });
      await loadHistory();
    } catch (cause) {
      setFeedback({
        type: "error",
        text: cause instanceof Error ? cause.message : "Failed to send test notification.",
      });
    } finally {
      setIsSendingTest(false);
    }
  }

  // Retry Failed Notification
  async function handleRetry(id: string) {
    setRetryingId(id);
    setFeedback(null);
    try {
      await emailApi.retryNotification(id);
      setFeedback({ type: "success", text: "Notification successfully retried and delivered!" });
      await loadHistory();
    } catch (cause) {
      setFeedback({
        type: "error",
        text: cause instanceof Error ? cause.message : "Notification retry failed.",
      });
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-medium border shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Meta WhatsApp Cloud API Production Notice */}
      <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50/80 to-blue-50/40 p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0 mt-0.5">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs text-sky-950 space-y-1">
            <h4 className="font-bold text-sm text-sky-950">
                {config?.deliveryProvider === "whatsapp_cloud_api"
                  ? "Meta WhatsApp Cloud API active"
                  : "Mock WhatsApp mode · no real messages are sent"}
            </h4>
            <p className="leading-relaxed text-sky-800">
                {config?.deliveryProvider === "whatsapp_cloud_api"
                  ? "New matching emails are checked automatically once per minute and sent using your approved Meta WhatsApp template."
                  : "New matching emails are checked automatically once per minute. Mock mode records simulated deliveries in PostgreSQL and does not send WhatsApp messages. Configure Meta credentials to enable real delivery."}
            </p>
            <p className="leading-relaxed text-sky-800">
              <span className="font-semibold text-sky-900">Official WhatsApp Notice:</span> Live delivery requires a Meta Developer App, Meta Business Manager verification, a registered business number, pre-approved message templates, and applicable Meta conversation fees. Real WhatsApp business delivery is not free.
            </p>
          </div>
        </div>
      </div>

      {/* Top Header Card: Actions & Recipient Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-950">WhatsApp Notifications</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure rules, toggle category alerts, and review simulated delivery logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSendTest()}
            disabled={isSendingTest}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <svg
              className={`size-3.5 ${isSendingTest ? "animate-spin text-white" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {isSendingTest ? "Sending Test..." : "Test Notification"}
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Notification Toggles */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Notification Toggles</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable or disable instant WhatsApp alerts for specific email categories
            </p>
          </div>

          {isLoadingConfig ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading preferences...</div>
          ) : (
            <div className="space-y-2.5">
              {ALL_CATEGORIES.map((catKey) => {
                const meta = CATEGORY_METADATA[catKey];
                const isEnabled = config?.enabledCategories.includes(catKey) ?? false;

                return (
                  <label
                    key={catKey}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                        aria-hidden="true"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{meta.label}</span>
                        <p className="text-[11px] text-slate-400">{meta.description}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => void handleToggleCategory(catKey)}
                      className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* General Settings: Phone & Cutoff */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Delivery & Eligibility Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure recipient number and cutoff windows to prevent historical notification spam
            </p>
          </div>

          <form onSubmit={(e) => void handleSaveGeneralSettings(e)} className="space-y-4 text-xs">
            <div>
              <label htmlFor="recipientPhone" className="block font-semibold text-slate-700 mb-1">
                Recipient WhatsApp Phone (E.164 format)
              </label>
              <input
                id="recipientPhone"
                type="text"
                required
                value={config?.recipientPhone ?? ""}
                onChange={(e) => void handleUpdateRecipientPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Use the full international number, including country code. This is the destination for matching new email alerts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cutoffHours" className="block font-semibold text-slate-700 mb-1">
                  Initial Sync Cutoff (Hours)
                </label>
                <input
                  id="cutoffHours"
                  type="number"
                  min="1"
                  max="168"
                  value={config?.initialSyncCutoffHours ?? 24}
                  onChange={(e) =>
                    config &&
                    setConfig({ ...config, initialSyncCutoffHours: Number(e.target.value) || 24 })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Emails older than this cutoff are skipped.
                </p>
              </div>

              <div>
                <label htmlFor="maxSnippet" className="block font-semibold text-slate-700 mb-1">
                  Max Snippet Length (chars)
                </label>
                <input
                  id="maxSnippet"
                  type="number"
                  min="50"
                  max="300"
                  value={config?.maxSnippetLength ?? 150}
                  onChange={(e) =>
                    config &&
                    setConfig({ ...config, maxSnippetLength: Number(e.target.value) || 150 })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Caps preview to keep messages concise.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingConfig ? "Saving..." : "Save Delivery Settings"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Sender/Domain Rule Editor */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sender & Domain Notification Rules</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific rules with priority ordering to explicitly send or ignore alerts
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRuleModal(true)}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            + Add Rule
          </button>
        </div>

        {config?.rules && config.rules.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {config.rules.map((rule) => (
              <div key={rule.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.action === "NOTIFY"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {rule.action}
                    </span>
                    <span className="font-bold text-slate-900">{rule.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Priority: {rule.priority}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {rule.match.senderDomains && (
                      <span>Domains: {rule.match.senderDomains.join(", ")}</span>
                    )}
                    {rule.match.keywords && (
                      <span>Keywords: {rule.match.keywords.join(", ")}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRemoveRule(rule.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            No custom sender/domain rules yet. Default category rules will apply.
          </p>
        )}

        {/* Simple Add Rule Inline Modal */}
        {showRuleModal && (
          <form
            onSubmit={(e) => void handleAddRule(e)}
            className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3 text-xs"
          >
            <h4 className="font-bold text-slate-900">Create New Notification Rule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Client Alert"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Action</label>
                <select
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value as "NOTIFY" | "IGNORE")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5"
                >
                  <option value="NOTIFY">NOTIFY (Send Alert)</option>
                  <option value="IGNORE">IGNORE (Suppress Alert)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority (1 = highest)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newRulePriority}
                  onChange={(e) => setNewRulePriority(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Domains (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. greenhouse.io, lever.co"
                  value={newRuleDomains}
                  onChange={(e) => setNewRuleDomains(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. urgent, offer, final round"
                  value={newRuleKeywords}
                  onChange={(e) => setNewRuleKeywords(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-700 text-white px-4 py-1.5 font-semibold"
              >
                Add Rule
              </button>
            </div>
          </form>
        )}
      </section>

      {/* WhatsApp Notification History */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-950">WhatsApp Delivery History</h3>
            <p className="text-xs text-slate-500">
              Audit log of all prepared, delivered, skipped, or failed WhatsApp messages
            </p>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs">
            {(["ALL", "SENT", "FAILED", "SKIPPED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "ALL" ? "All" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        {isLoadingHistory && !history ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
        ) : history?.notifications && history.notifications.length > 0 ? (
          <div className="space-y-3">
            {history.notifications.map((notif) => {
              const statusBadges: Record<NotificationStatus, { bg: string; text: string; label: string }> = {
                SENT: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-800", label: "Accepted" },
                FAILED: { bg: "bg-rose-100 border-rose-200", text: "text-rose-800", label: "Failed" },
                SKIPPED: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", label: "Skipped" },
                PENDING: { bg: "bg-amber-100 border-amber-200", text: "text-amber-800", label: "Pending" },
              };

              const badge = statusBadges[notif.status] ?? statusBadges.PENDING;

              return (
                <div
                  key={notif.id}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      {notif.category && <CategoryBadge category={notif.category} size="sm" />}
                      <span className="text-xs font-semibold text-slate-800">
                        {notif.recipient}
                      </span>
                    </div>
                    <time className="text-[11px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </time>
                  </div>

                  {/* Subject and Sender */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{notif.subject}</h4>
                    {notif.sender && (
                      <p className="text-[11px] text-slate-500">From: {notif.sender}</p>
                    )}
                  </div>

                  {/* Simulated WhatsApp Bubble preview */}
                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                    {notif.preview}
                  </div>

                  {/* Error & Retry Row */}
                  {notif.errorDetails && (
                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center justify-between gap-2">
                      <span>Reason: {notif.errorDetails}</span>
                      {notif.status === "FAILED" && notif.retryCount < notif.maxRetries && (
                        <button
                          type="button"
                          onClick={() => void handleRetry(notif.id)}
                          disabled={retryingId === notif.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-[10px] shrink-0 cursor-pointer"
                        >
                          {retryingId === notif.id ? "Retrying..." : `Retry (${notif.retryCount}/${notif.maxRetries})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {history.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Page {history.page} of {history.totalPages} ({history.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={history.page <= 1}
                    onClick={() => setCurrentPage(history.page - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={history.page >= history.totalPages}
                    onClick={() => setCurrentPage(history.page + 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">
            No notifications recorded in history yet. Use &ldquo;Test Notification&rdquo; to verify the configured delivery mode.
          </div>
        )}
      </section>
    </div>
  );
}
