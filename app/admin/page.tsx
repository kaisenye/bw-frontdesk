'use client'

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { InboxTab } from '@/components/admin/InboxTab'
import { KnowledgeTab } from '@/components/admin/KnowledgeTab'
import { Toaster } from '@/components/admin/Toaster'
import { CENTER } from '@/lib/seed'
import { ensureSeeded, getKnowledge, getLog, needsAttention, resetDemo, subscribe } from '@/lib/store'

type Tab = 'knowledge' | 'inbox'

const EMPTY: never[] = []

/**
 * Caches snapshots outside of render. The store's readers build a fresh array on
 * every call, and returning a new reference each read would spin
 * useSyncExternalStore forever, so each snapshot is memoized against its
 * serialized form and only swapped when the contents actually change.
 */
function createSnapshotCache<T>(read: () => T[]) {
  let cachedKey: string | null = null
  let cached: T[] = EMPTY

  return {
    getSnapshot: () => {
      const next = read()
      const key = JSON.stringify(next)
      if (key !== cachedKey) {
        cachedKey = key
        cached = next
      }
      return cached
    },
    // Nothing is readable on the server; the client re-reads after hydration.
    getServerSnapshot: () => EMPTY as T[],
  }
}

const knowledgeCache = createSnapshotCache(getKnowledge)
const logCache = createSnapshotCache(getLog)

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('knowledge')
  const [confirmingReset, setConfirmingReset] = useState(false)

  // Seeding only touches the external store, so it triggers no render cascade.
  // The resulting write is picked up by the subscriptions below.
  useEffect(() => {
    ensureSeeded()
  }, [])

  // Reading through the store keeps this view live when the parent chat page
  // logs a question.
  const entries = useSyncExternalStore(subscribe, knowledgeCache.getSnapshot, knowledgeCache.getServerSnapshot)
  const log = useSyncExternalStore(subscribe, logCache.getSnapshot, logCache.getServerSnapshot)

  // Server render and the first client paint both have nothing yet; the seed
  // effect fills the store immediately after hydration.
  const ready = entries.length > 0 || log.length > 0

  const attentionCount = log.filter(needsAttention).length

  function handleReset() {
    resetDemo()
    setConfirmingReset(false)
  }

  return (
    <Toaster>
      <div className="min-h-full flex-1 bg-bg font-sans text-ink">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-5 pb-4">
              <div className="min-w-0">
                <h1 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">{CENTER.name}</h1>
                <p className="mt-0.5 text-[13px] text-ink-secondary">What the front desk knows, and what stumped it.</p>
              </div>

              <Link
                href="/"
                className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink-secondary transition-[background-color,color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover hover:text-ink sm:h-8 sm:min-h-0"
              >
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
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

            {/* Underlined tabs sit on the header's bottom border, Linear style. */}
            <nav className="-mb-px flex gap-1" aria-label="Control center sections">
              <TabButton
                active={tab === 'knowledge'}
                onClick={() => setTab('knowledge')}
                controls="panel-knowledge"
                id="tab-knowledge"
              >
                Knowledge
                <TabCount active={tab === 'knowledge'}>{entries.length}</TabCount>
              </TabButton>
              <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')} controls="panel-inbox" id="tab-inbox">
                Inbox
                {attentionCount > 0 ? (
                  <span className="tabular-nums text-gap-text" title={`${attentionCount} need attention`}>
                    {attentionCount}
                  </span>
                ) : (
                  <TabCount active={tab === 'inbox'}>{log.length}</TabCount>
                )}
              </TabButton>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {!ready ? (
            <p className="py-16 text-center text-[13px] text-ink-muted">Loading your center…</p>
          ) : tab === 'knowledge' ? (
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-[12px] text-ink-muted">
              {CENTER.director} · {CENTER.phone}
            </p>
            {confirmingReset ? (
              <span className="flex items-center gap-2">
                <span className="text-[12px] text-ink-secondary">Put the demo data back?</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[var(--radius-sm)] border border-line-strong bg-surface px-2.5 text-[12px] font-medium text-ink transition-[background-color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover sm:h-7 sm:min-h-0"
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium text-ink-muted transition-colors duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover hover:text-ink sm:h-7 sm:min-h-0"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="inline-flex min-h-[44px] cursor-pointer items-center rounded-[var(--radius-sm)] px-2.5 text-[12px] text-ink-muted transition-colors duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover hover:text-ink-secondary sm:h-7 sm:min-h-0"
              >
                Reset demo data
              </button>
            )}
          </div>
        </footer>
      </div>
    </Toaster>
  )
}

function TabButton({
  active,
  onClick,
  controls,
  id,
  children,
}: {
  active: boolean
  onClick: () => void
  controls: string
  id: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 border-b-2 px-2.5 text-[13px] font-medium transition-[color,border-color] duration-[140ms] [transition-timing-function:var(--ease)] sm:h-9 sm:min-h-0 ${
        active
          ? 'border-accent text-ink'
          : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink-secondary'
      }`}
    >
      {children}
    </button>
  )
}

function TabCount({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`tabular-nums ${active ? 'text-ink-secondary' : 'text-ink-muted'}`}>{children}</span>
}
