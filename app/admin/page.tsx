"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { InboxTab } from "@/components/admin/InboxTab";
import { KnowledgeTab } from "@/components/admin/KnowledgeTab";
import { CENTER } from "@/lib/seed";
import { ensureSeeded, getKnowledge, getLog, resetDemo, subscribe } from "@/lib/store";

type Tab = "knowledge" | "inbox";

const EMPTY: never[] = [];

/**
 * Caches snapshots outside of render. The store's readers build a fresh array on
 * every call, and returning a new reference each read would spin
 * useSyncExternalStore forever, so each snapshot is memoized against its
 * serialized form and only swapped when the contents actually change.
 */
function createSnapshotCache<T>(read: () => T[]) {
  let cachedKey: string | null = null;
  let cached: T[] = EMPTY;

  return {
    getSnapshot: () => {
      const next = read();
      const key = JSON.stringify(next);
      if (key !== cachedKey) {
        cachedKey = key;
        cached = next;
      }
      return cached;
    },
    // Nothing is readable on the server; the client re-reads after hydration.
    getServerSnapshot: () => EMPTY as T[],
  };
}

const knowledgeCache = createSnapshotCache(getKnowledge);
const logCache = createSnapshotCache(getLog);

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("knowledge");
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Seeding only touches the external store, so it triggers no render cascade —
  // the resulting write is picked up by the subscriptions below.
  useEffect(() => {
    ensureSeeded();
  }, []);

  // Reading through the store keeps this view live when the parent chat page
  // logs a question.
  const entries = useSyncExternalStore(
    subscribe,
    knowledgeCache.getSnapshot,
    knowledgeCache.getServerSnapshot,
  );
  const log = useSyncExternalStore(
    subscribe,
    logCache.getSnapshot,
    logCache.getServerSnapshot,
  );

  // Server render and the first client paint both have nothing yet; the seed
  // effect fills the store immediately after hydration.
  const ready = entries.length > 0 || log.length > 0;

  const needsAttention = log.filter(
    (i) => i.status === "escalated" || i.status === "gap",
  ).length;

  function handleReset() {
    resetDemo();
    setConfirmingReset(false);
  }

  return (
    <div className="min-h-full flex-1 bg-stone-50 font-sans text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-700 uppercase">
                Control Center
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
                {CENTER.name}
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                Manage what the front desk knows, and see what it could not answer.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:outline-none"
              >
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.5 5 7.5 10l5 5" />
                </svg>
                Parent view
              </Link>
            </div>
          </div>

          <nav
            className="flex w-full gap-1.5 rounded-xl border border-stone-200 bg-stone-100 p-1.5 sm:w-auto sm:self-start"
            aria-label="Control center sections"
          >
            <TabButton
              active={tab === "knowledge"}
              onClick={() => setTab("knowledge")}
              controls="panel-knowledge"
              id="tab-knowledge"
            >
              Knowledge
              <TabCount active={tab === "knowledge"}>{entries.length}</TabCount>
            </TabButton>
            <TabButton
              active={tab === "inbox"}
              onClick={() => setTab("inbox")}
              controls="panel-inbox"
              id="tab-inbox"
            >
              Inbox
              {needsAttention > 0 ? (
                <span
                  className={`inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                    tab === "inbox" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
                  }`}
                  title={`${needsAttention} need attention`}
                >
                  {needsAttention}
                </span>
              ) : (
                <TabCount active={tab === "inbox"}>{log.length}</TabCount>
              )}
            </TabButton>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {!ready ? (
          <p className="py-16 text-center text-sm text-stone-500">Loading your center…</p>
        ) : tab === "knowledge" ? (
          <section id="panel-knowledge" role="tabpanel" aria-labelledby="tab-knowledge">
            <KnowledgeTab entries={entries} />
          </section>
        ) : (
          <section id="panel-inbox" role="tabpanel" aria-labelledby="tab-inbox">
            <InboxTab log={log} entries={entries} />
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5">
          <p className="text-xs text-stone-500">
            {CENTER.director} · {CENTER.phone}
          </p>
          {confirmingReset ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-stone-600">Restore the demo data?</span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-400 bg-white px-3 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                Yes, reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-xs font-semibold text-stone-500 transition hover:text-stone-800"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-800"
            >
              Reset demo data
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  controls,
  id,
  children,
}: {
  active: boolean;
  onClick: () => void;
  controls: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition sm:flex-none ${
        active
          ? "bg-stone-800 text-white shadow-sm"
          : "text-stone-600 hover:bg-white hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function TabCount({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
        active ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
      }`}
    >
      {children}
    </span>
  );
}
