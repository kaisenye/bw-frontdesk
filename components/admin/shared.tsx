"use client";

import type { AnswerStatus, KnowledgeCategory } from "@/lib/types";

/** Single source of truth for the category union so selects stay in sync with the type. */
export const CATEGORIES: KnowledgeCategory[] = [
  "hours",
  "tuition",
  "health",
  "food",
  "enrollment",
  "policies",
  "contact",
];

export const CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  hours: "Hours",
  tuition: "Tuition",
  health: "Health",
  food: "Food",
  enrollment: "Enrollment",
  policies: "Policies",
  contact: "Contact",
};

const CATEGORY_STYLE: Record<KnowledgeCategory, string> = {
  hours: "border-sky-200 bg-sky-50 text-sky-800",
  tuition: "border-amber-200 bg-amber-50 text-amber-800",
  health: "border-rose-200 bg-rose-50 text-rose-800",
  food: "border-lime-200 bg-lime-50 text-lime-800",
  enrollment: "border-violet-200 bg-violet-50 text-violet-800",
  policies: "border-stone-300 bg-stone-100 text-stone-700",
  contact: "border-teal-200 bg-teal-50 text-teal-800",
};

export function CategoryBadge({ category }: { category: KnowledgeCategory }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] uppercase ${CATEGORY_STYLE[category]}`}
    >
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function OperatorBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10.5 8 14.5 16 6" />
      </svg>
      Added from a parent question
    </span>
  );
}

const STATUS_META: Record<
  AnswerStatus,
  { label: string; icon: string; className: string }
> = {
  answered: {
    label: "Answered",
    icon: "✅",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  escalated: {
    label: "Sent to staff",
    icon: "⚠️",
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  gap: {
    label: "Needs an answer",
    icon: "❓",
    className: "border-rose-300 bg-rose-50 text-rose-900",
  },
};

/** Icon + text label so status never depends on color alone. */
export function StatusBadge({ status }: { status: AnswerStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

/** "3h ago" for recent items, a short date once it stops being useful. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = now - then;
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
