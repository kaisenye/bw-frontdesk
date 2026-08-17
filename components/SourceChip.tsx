'use client'

import { useId, useState } from 'react'
import type { HandbookEntry } from '@/lib/types'

interface SourceChipProps {
  entry: HandbookEntry
}

/**
 * The trust signal: names the written policy an answer came from, and expands
 * to the verbatim entry body so a parent can read the source themselves.
 *
 * Styled as a footnote reference rather than a badge: a hairline rule, a small
 * uppercase label, and the title carrying the weight.
 */
export function SourceChip({ entry }: SourceChipProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="mt-3.5 border-t border-line pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`group -mx-2 flex min-h-[44px] max-w-full items-center gap-2 rounded-[var(--radius-soft)] px-2 text-left text-[13px] transition-[color,background-color,transform] duration-200 [transition-timing-function:var(--ease-soft)] active:scale-[0.98] ${
          open ? 'bg-accent-quiet text-accent-text' : 'text-ink-secondary hover:bg-accent-quiet hover:text-accent-text'
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-[13px] w-[2px] shrink-0 rounded-[1px] transition-colors duration-200 [transition-timing-function:var(--ease-soft)] ${
            open ? 'bg-accent' : 'bg-accent-border group-hover:bg-accent'
          }`}
        />
        <span className="shrink-0 text-[10px] font-semibold tracking-[0.08em] text-ink-muted uppercase transition-colors duration-200 group-hover:text-accent-text">
          Source
        </span>
        <span className="truncate font-medium">{entry.title}</span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-300 [transition-timing-function:var(--ease-soft)] group-hover:text-accent ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5.5 8 10 12.5 14.5 8" />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          className="mt-2 overflow-hidden rounded-[var(--radius-soft)] border border-accent-border bg-accent-quiet"
          data-fd-anim
          style={{ animation: 'fd-expand 280ms var(--ease-soft) both' }}
        >
          <p className="border-b border-accent-border px-3.5 py-2 text-[10px] font-semibold tracking-[0.08em] text-accent-text uppercase">
            Straight from the handbook
          </p>
          {/* Quoted-document treatment: a left rule marks it as not our words */}
          <div className="px-3.5 py-3">
            <p className="border-l-2 border-accent-border pl-3.5 text-[14px] leading-[1.7] whitespace-pre-line text-ink-secondary">
              {entry.body}
            </p>
            <p className="mt-3 text-[11px] text-ink-muted">
              Updated{' '}
              {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
