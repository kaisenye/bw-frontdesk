"use client";

import { CENTER } from "@/lib/seed";

interface EscalationCardProps {
  answer: string;
  reason?: string;
}

const TEL_HREF = `tel:+1${CENTER.phone.replace(/\D/g, "")}`;

/**
 * Shown when the model declines to answer on its own. The point is to make the
 * handoff to a human feel like the intended outcome, not a failure.
 */
export function EscalationCard({ answer, reason }: EscalationCardProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl rounded-tl-md border border-amber-300/70 bg-amber-50 shadow-[0_1px_2px_rgba(120,53,15,0.06)]"
      style={{ animation: "sunny-rise 320ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <div className="flex items-center gap-2 border-b border-amber-200/80 bg-amber-100/70 px-4 py-2.5">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-amber-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 6.5v4" />
          <path d="M10 13.5h.01" />
          <path d="M8.6 2.9 1.9 15.1a1.4 1.4 0 0 0 1.2 2.1h13.8a1.4 1.4 0 0 0 1.2-2.1L11.4 2.9a1.6 1.6 0 0 0-2.8 0Z" />
        </svg>
        <p className="text-[11px] font-semibold tracking-[0.06em] text-amber-900 uppercase">
          Passed to a person
        </p>
      </div>

      <div className="px-4 py-3.5">
        <p className="text-[16px] leading-relaxed whitespace-pre-line text-stone-800">{answer}</p>

        <p className="mt-3 text-[15px] leading-relaxed text-stone-700">
          {CENTER.director} is picking this up personally and will follow up with you. If
          it&rsquo;s urgent, please call the center.
        </p>

        <a
          href={TEL_HREF}
          className="mt-3.5 inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-amber-600 px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-amber-700 active:scale-[0.97]"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
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
          <p className="mt-3 border-t border-amber-200/70 pt-2.5 text-[12px] leading-relaxed text-amber-800/80">
            <span className="font-medium">Why a person:</span> {reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}
