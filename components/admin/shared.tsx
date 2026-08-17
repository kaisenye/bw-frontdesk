'use client'

import { KNOWLEDGE_CATEGORIES } from '@/lib/types'
import type { AnswerStatus, KnowledgeCategory } from '@/lib/types'

/** Re-exported so selects keep importing from one place. */
export const CATEGORIES: readonly KnowledgeCategory[] = KNOWLEDGE_CATEGORIES

export const CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  hours: 'Hours',
  tuition: 'Tuition',
  health: 'Health',
  food: 'Food',
  enrollment: 'Enrollment',
  policies: 'Policies',
  contact: 'Contact',
}

/**
 * Categories are an organizing device, not a signal. Seven tinted badges would
 * spend the whole palette on taxonomy, so all of them get one quiet neutral
 * chip and the semantic colors stay meaningful where they do appear.
 */
export function CategoryBadge({ category }: { category: KnowledgeCategory }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border border-line bg-surface-sunken px-1.5 py-px text-[11px] font-medium text-ink-secondary">
      {CATEGORY_LABEL[category]}
    </span>
  )
}

export function OperatorBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-accent-border bg-accent-quiet px-1.5 py-px text-[11px] font-medium text-accent-text">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-2.5 w-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10.5 8 14.5 16 6" />
      </svg>
      Added from a parent question
    </span>
  )
}

const STATUS_META: Record<AnswerStatus, { label: string; className: string; dot: string }> = {
  answered: {
    label: 'Answered',
    className: 'border-line bg-surface-sunken text-ink-secondary',
    dot: 'bg-accent',
  },
  escalated: {
    label: 'Sent to staff',
    className: 'border-warn-border bg-warn-quiet text-warn-text',
    dot: 'bg-warn',
  },
  gap: {
    label: 'Needs an answer',
    className: 'border-gap-border bg-gap-quiet text-gap-text',
    dot: 'bg-gap',
  },
  chitchat: {
    label: 'Just saying hi',
    className: 'border-line bg-surface-sunken text-ink-muted',
    dot: 'bg-ink-muted',
  },
}

/** Dot + text label so status never depends on color alone. */
export function StatusBadge({ status }: { status: AnswerStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border px-1.5 py-px text-[11px] font-medium whitespace-nowrap ${meta.className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

/** "3h ago" for recent items, a short date once it stops being useful. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const diffMs = now - then
  const minutes = Math.round(diffMs / 60000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
