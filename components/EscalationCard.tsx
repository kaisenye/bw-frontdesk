"use client";

import { CENTER } from "@/lib/seed";

interface EscalationCardProps {
  answer: string;
  reason?: string;
  /** Who the model handed this to. Falls back to the director. */
  routedTo?: string;
}

const TEL_HREF = `tel:+1${CENTER.phone.replace(/\D/g, "")}`;

/**
 * Shown when the model declines to answer on its own. The point is to make the
 * handoff to a human feel like the intended outcome, not a failure, so it reads
 * as a routing receipt: who has it, and how to reach them now.
 */
export function EscalationCard({ answer, reason, routedTo }: EscalationCardProps) {
  const handler = routedTo?.trim() || CENTER.director;
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] border border-warn-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      data-fd-anim
      style={{ animation: "fd-rise 280ms var(--ease-soft) both" }}
    >
      <div className="flex items-center gap-2 border-b border-warn-border bg-warn-quiet px-4 py-2.5">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-warn"
        />
        <p className="text-[10px] font-semibold tracking-[0.08em] text-warn-text uppercase">
          Routed to {handler}
        </p>
      </div>

      <div className="px-4 py-3.5">
        {/* The model's own text already says who has it and what happens next,
            so the card adds the call affordance rather than repeating it. */}
        <p className="text-[15px] leading-[1.65] whitespace-pre-line text-ink">{answer}</p>

        <a
          href={TEL_HREF}
          className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-soft)] border border-warn-border bg-warn-quiet px-4 text-[13px] font-medium text-warn-text transition-[color,background-color,border-color,transform] duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-warn hover:border-warn hover:text-white active:scale-[0.97]"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.3 3.2 7.8 6.4a1 1 0 0 1-.24 1.18l-1.2 1.05a10.5 10.5 0 0 0 4.7 4.7l1.05-1.2a1 1 0 0 1 1.18-.24l3.2 1.5a1 1 0 0 1 .55 1.06l-.4 2.2a1 1 0 0 1-1.1.82C8.6 16.8 3.2 11.4 2.5 4.7a1 1 0 0 1 .82-1.1l2.2-.4a1 1 0 0 1 1.06.55Z" />
          </svg>
          Call {CENTER.phone}
        </a>

        {reason ? (
          <p className="mt-3.5 border-t border-line pt-2.5 text-[12px] leading-[1.6] text-ink-muted">
            <span className="font-medium text-ink-secondary">Why a person:</span> {reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}
