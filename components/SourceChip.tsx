"use client";

import { useId, useState } from "react";
import type { KnowledgeEntry } from "@/lib/types";

interface SourceChipProps {
  entry: KnowledgeEntry;
}

/**
 * The trust signal: names the written policy an answer came from, and expands
 * to the verbatim entry body so a parent can read the source themselves.
 */
export function SourceChip({ entry }: SourceChipProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`group inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition-all duration-150 active:scale-[0.97] ${
          open
            ? "border-emerald-300 bg-emerald-100/80 text-emerald-900"
            : "border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100/70"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 3.5h7.5L16 7v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" />
          <path d="M12 3.5V7h3.5" />
          <path d="M7 11h6M7 13.5h4" />
        </svg>
        <span className="truncate">
          <span className="text-emerald-700/80">From:</span> {entry.title}
        </span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-emerald-600 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          className="mt-2 overflow-hidden rounded-2xl border border-emerald-200/70 bg-emerald-50/60"
          style={{ animation: "sunny-expand 220ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <div className="flex items-center gap-2 border-b border-emerald-200/60 px-4 py-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-semibold tracking-[0.06em] text-emerald-800 uppercase">
              This is the center&rsquo;s written policy
            </p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-stone-700">
              {entry.body}
            </p>
            <p className="mt-3 text-[11px] text-stone-500">
              Last updated{" "}
              {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
