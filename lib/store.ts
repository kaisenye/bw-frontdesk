'use client'

import { SEED_KNOWLEDGE, SEED_LOG } from './seed'
import type { ChatMessage, KnowledgeEntry, QuestionLogItem } from './types'

const KB_KEY = 'sunny-sprouts:kb:v1'
const LOG_KEY = 'sunny-sprouts:log:v1'
const THREAD_KEY = 'sunny-sprouts:thread:v1'

/**
 * A parent interrupted mid-question should come back to their thread, but a
 * reviewer opening the demo tomorrow should not meet a stale conversation.
 * sessionStorage splits that difference: it survives reload and navigation to
 * the staff view, and clears when the tab closes.
 */
const THREAD_MAX_AGE_MS = 4 * 60 * 60 * 1000

interface StoredThread {
  savedAt: number
  messages: ChatMessage[]
}

/** Lets the chat page and the admin page react to each other's writes. */
const EVENT = 'sunny-sprouts:store-change'

function isBrowser() {
  return typeof window !== 'undefined'
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
  } catch {
    // Quota or private-mode failure: the in-memory UI state still works.
  }
}

export function subscribe(listener: () => void) {
  if (!isBrowser()) return () => {}
  const handler = () => listener()
  window.addEventListener(EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

/** Seeds on first visit so a reviewer never lands on an empty demo. */
export function ensureSeeded() {
  if (!isBrowser()) return
  if (window.localStorage.getItem(KB_KEY) === null) {
    write(KB_KEY, SEED_KNOWLEDGE)
  }
  if (window.localStorage.getItem(LOG_KEY) === null) {
    write(LOG_KEY, SEED_LOG)
  }
}

export function getKnowledge(): KnowledgeEntry[] {
  return read<KnowledgeEntry[]>(KB_KEY, SEED_KNOWLEDGE)
}

export function saveEntry(entry: KnowledgeEntry) {
  const all = getKnowledge()
  const index = all.findIndex((e) => e.id === entry.id)
  const next = { ...entry, updatedAt: new Date().toISOString() }
  if (index >= 0) {
    all[index] = next
  } else {
    all.push(next)
  }
  write(KB_KEY, all)
  return next
}

export function deleteEntry(id: string) {
  write(
    KB_KEY,
    getKnowledge().filter((e) => e.id !== id),
  )
}

export function getLog(): QuestionLogItem[] {
  return read<QuestionLogItem[]>(LOG_KEY, SEED_LOG)
}

export function addLogItem(item: QuestionLogItem) {
  write(LOG_KEY, [item, ...getLog()])
}

/** Marks a gap as closed once an operator writes the missing entry. */
export function resolveLogItem(logId: string, entryId: string) {
  write(
    LOG_KEY,
    getLog().map((item) =>
      item.id === logId
        ? { ...item, status: 'answered' as const, sourceId: entryId, resolvedByEntryId: entryId }
        : item,
    ),
  )
}

/**
 * Still on the operator's plate: a gap needs an answer written, an escalation
 * needs a person to follow up until one confirms they have. Lives here so the
 * inbox filter and the tab badge cannot drift apart.
 */
export function needsAttention(item: QuestionLogItem): boolean {
  if (item.status === 'gap') return true
  return item.status === 'escalated' && !item.reviewedAt
}

/**
 * Marks an escalation as handled. The status stays "escalated" because that is
 * what happened to the question; only the needs-attention queue changes.
 */
export function markLogItemReviewed(logId: string) {
  write(
    LOG_KEY,
    getLog().map((item) => (item.id === logId ? { ...item, reviewedAt: new Date().toISOString() } : item)),
  )
}

export function resetDemo() {
  write(KB_KEY, SEED_KNOWLEDGE)
  write(LOG_KEY, SEED_LOG)
  clearThread()
}

/**
 * Reads the parent's in-progress conversation. Pending and failed bubbles are
 * dropped on the way out: a request that was in flight when the page reloaded
 * can never resolve, so restoring it would leave a spinner running forever.
 */
export function getThread(): ChatMessage[] {
  if (!isBrowser()) return []
  try {
    const raw = window.sessionStorage.getItem(THREAD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredThread
    if (!parsed || !Array.isArray(parsed.messages)) return []
    if (Date.now() - parsed.savedAt > THREAD_MAX_AGE_MS) {
      window.sessionStorage.removeItem(THREAD_KEY)
      return []
    }
    return parsed.messages.filter((m) => !m.pending && !m.error)
  } catch {
    return []
  }
}

export function saveThread(messages: ChatMessage[]) {
  if (!isBrowser()) return
  try {
    const keep = messages.filter((m) => !m.pending && !m.error)
    if (keep.length === 0) {
      window.sessionStorage.removeItem(THREAD_KEY)
      return
    }
    const payload: StoredThread = { savedAt: Date.now(), messages: keep }
    window.sessionStorage.setItem(THREAD_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key: THREAD_KEY } }))
  } catch {
    // Quota or private-mode failure: the in-memory transcript still works.
  }
}

const EMPTY_THREAD: ChatMessage[] = []
let threadSnapshot: ChatMessage[] = EMPTY_THREAD
let threadRaw: string | null = null

/**
 * Snapshot of the saved transcript for useSyncExternalStore, which is how the
 * chat page reads it without tripping hydration: the server snapshot is empty
 * and the real one arrives after mount. Cached against the serialized value so
 * the reference stays stable between reads.
 */
export function getThreadSnapshot(): ChatMessage[] {
  if (!isBrowser()) return EMPTY_THREAD
  let raw: string | null = null
  try {
    raw = window.sessionStorage.getItem(THREAD_KEY)
  } catch {
    return EMPTY_THREAD
  }
  if (raw !== threadRaw) {
    threadRaw = raw
    threadSnapshot = getThread()
  }
  return threadSnapshot
}

export function getEmptyThread(): ChatMessage[] {
  return EMPTY_THREAD
}

export function clearThread() {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(THREAD_KEY)
  } catch {
    // Nothing to do; the caller only wants the thread gone.
  }
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
