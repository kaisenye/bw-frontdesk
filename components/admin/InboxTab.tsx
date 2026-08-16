"use client";

import { useMemo, useState } from "react";
import { newId, resolveLogItem, saveEntry } from "@/lib/store";
import type { KnowledgeEntry, QuestionLogItem } from "@/lib/types";
import { EntryEditor, type EntryDraft } from "./EntryEditor";
import { StatusBadge, relativeTime } from "./shared";

interface InboxTabProps {
  log: QuestionLogItem[];
  entries: KnowledgeEntry[];
}

type InboxFilter = "all" | "attention" | "answered";

/** Leading filler that carries no meaning in a knowledge-base title. */
const LEADING_FILLER =
  /^(do|does|did|can|could|is|are|was|were|what|how|when|where|why|will|would|should|you|your|i|my|our|we|the|a|an|any|there)(?:'\w+)?\s+/i;

/** Words that read as unfinished if a truncated title ends on them. */
const DANGLING = new Set([
  "for", "in", "on", "at", "to", "of", "with", "about", "from", "by",
  "and", "or", "the", "a", "an", "any", "my", "your",
]);

const MINOR = new Set(["for", "in", "on", "at", "to", "of", "with", "and", "or", "the", "a", "an"]);

/**
 * Turns "Do you offer any summer camp for older siblings?" into
 * "Summer Camp for Older Siblings" as a starting title the operator can edit.
 */
function suggestTitle(question: string): string {
  let cleaned = question.replace(/[?.!]+\s*$/g, "").trim();

  // Strip stacked filler ("What's your policy on…" -> "policy on…").
  let previous: string;
  do {
    previous = cleaned;
    cleaned = cleaned.replace(LEADING_FILLER, "").trim();
  } while (cleaned !== previous && cleaned.length > 0);

  const source = cleaned.length > 0 ? cleaned : question.replace(/[?.!]+\s*$/g, "").trim();

  const words = source.split(/\s+/).slice(0, 6);
  // Never end on a preposition left hanging by the truncation above.
  while (words.length > 1 && DANGLING.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && MINOR.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function InboxTab({ log, entries }: InboxTabProps) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [composingId, setComposingId] = useState<string | null>(null);
  const [justResolvedId, setJustResolvedId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  const sorted = useMemo(
    () =>
      log
        .slice()
        .sort((a, b) => new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime()),
    [log],
  );

  const stats = useMemo(() => {
    const total = sorted.length;
    const answered = sorted.filter((i) => i.status === "answered").length;
    const escalated = sorted.filter((i) => i.status === "escalated").length;
    const gaps = sorted.filter((i) => i.status === "gap").length;
    const answeredPct = total === 0 ? 0 : Math.round((answered / total) * 100);
    return { total, answered, escalated, gaps, answeredPct };
  }, [sorted]);

  const entryById = useMemo(() => {
    const map = new Map<string, KnowledgeEntry>();
    for (const e of entries) map.set(e.id, e);
    return map;
  }, [entries]);

  const visible = useMemo(
    () =>
      sorted.filter((item) => {
        if (filter === "attention") {
          return item.status === "escalated" || item.status === "gap";
        }
        if (filter === "answered") return item.status === "answered";
        return true;
      }),
    [sorted, filter],
  );

  const attentionCount = stats.escalated + stats.gaps;

  /** The improvement loop: write the missing entry, then close the gap it came from. */
  function handleAnswerGap(item: QuestionLogItem, draft: EntryDraft) {
    const entry: KnowledgeEntry = {
      id: newId("kb"),
      title: draft.title,
      category: draft.category,
      body: draft.body,
      addedByOperator: true,
      updatedAt: new Date().toISOString(),
    };

    saveEntry(entry);
    resolveLogItem(item.id, entry.id);

    setComposingId(null);
    setJustResolvedId(item.id);

    window.setTimeout(() => {
      setJustResolvedId((current) => (current === item.id ? null : current));
    }, 6000);
  }

  return (
    <div className="flex flex-col gap-5">
      <StatTiles stats={stats} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter questions">
        <FilterChip
          label="All"
          count={stats.total}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterChip
          label="Needs attention"
          count={attentionCount}
          active={filter === "attention"}
          onClick={() => setFilter("attention")}
          urgent={attentionCount > 0}
        />
        <FilterChip
          label="Answered"
          count={stats.answered}
          active={filter === "answered"}
          onClick={() => setFilter("answered")}
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center text-sm text-stone-500">
          {filter === "attention"
            ? "Nothing needs your attention right now. The front desk handled everything."
            : "No questions here yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {visible.map((item) => {
            const source = item.sourceId ? entryById.get(item.sourceId) : undefined;
            const isComposing = composingId === item.id;
            const celebrating = justResolvedId === item.id;
            const isReviewed = reviewedIds.includes(item.id);

            return (
              <li
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  celebrating
                    ? "border-emerald-400 ring-2 ring-emerald-500/20"
                    : item.status === "gap"
                      ? "border-rose-200"
                      : item.status === "escalated"
                        ? "border-amber-200"
                        : "border-stone-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-[15px] leading-relaxed font-semibold text-stone-900">
                    {item.question}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-xs whitespace-nowrap text-stone-500">
                      {relativeTime(item.askedAt)}
                    </span>
                  </div>
                </div>

                <p className="mt-2.5 border-l-2 border-stone-200 pl-3 text-[14.5px] leading-relaxed text-stone-600">
                  {item.answer}
                </p>

                {source ? (
                  <p className="mt-2.5 text-xs text-stone-500">
                    <span className="font-semibold text-stone-600">Source:</span>{" "}
                    {source.title}
                    {item.resolvedByEntryId ? (
                      <span className="ml-1.5 font-semibold text-emerald-700">
                        · you wrote this
                      </span>
                    ) : null}
                  </p>
                ) : null}

                {celebrating ? (
                  <p
                    role="status"
                    className="mt-3.5 flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-900"
                  >
                    <span aria-hidden="true">✅</span>
                    Added to your knowledge base — the front desk can answer this now.
                  </p>
                ) : null}

                {item.status === "gap" && !isComposing ? (
                  <div className="mt-3.5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setComposingId(item.id)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
                    >
                      Answer this
                    </button>
                    <span className="text-xs text-stone-500">
                      Write it once — the front desk handles it from now on.
                    </span>
                  </div>
                ) : null}

                {item.status === "gap" && isComposing ? (
                  <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-4">
                    <h3 className="mb-3.5 text-sm font-semibold text-stone-900">
                      Teach the front desk this answer
                    </h3>
                    <EntryEditor
                      initial={{
                        title: suggestTitle(item.question),
                        category: "policies",
                        body: "",
                      }}
                      submitLabel="Add to knowledge base"
                      bodyPlaceholder="Answer the parent's question here, the way you would say it in person."
                      onSave={(draft) => handleAnswerGap(item, draft)}
                      onCancel={() => setComposingId(null)}
                    />
                  </div>
                ) : null}

                {item.status === "escalated" ? (
                  <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
                    <p className="flex-1 text-sm text-amber-900">
                      <span className="font-semibold">A human was looped in.</span> The
                      front desk correctly handed this to staff rather than answering it
                      itself.
                    </p>
                    {isReviewed ? (
                      <span
                        role="status"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900"
                      >
                        <span aria-hidden="true">✅</span> Marked reviewed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewedIds((prev) => [...prev, item.id])}
                        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none"
                      >
                        Mark reviewed
                      </button>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface Stats {
  total: number;
  answered: number;
  escalated: number;
  gaps: number;
  answeredPct: number;
}

function StatTiles({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        value={String(stats.total)}
        label="Questions asked"
        note={`${stats.answered} answered without staff time`}
      />
      <Tile
        value={`${stats.answeredPct}%`}
        label="Answered on the spot"
        note="Straight from your knowledge base"
        tone="emerald"
      />
      <Tile
        value={String(stats.escalated)}
        label="Sent to staff"
        note="Correctly routed to a human"
        tone="amber"
      />
      <Tile
        value={String(stats.gaps)}
        label="Knowledge gaps"
        note={stats.gaps > 0 ? "Waiting on your answer" : "Nothing missing"}
        tone={stats.gaps > 0 ? "rose" : "stone"}
      />
    </div>
  );
}

function Tile({
  value,
  label,
  note,
  tone = "stone",
}: {
  value: string;
  label: string;
  note: string;
  tone?: "stone" | "emerald" | "amber" | "rose";
}) {
  const toneClass = {
    stone: "border-stone-200 bg-white",
    emerald: "border-emerald-200 bg-emerald-50/70",
    amber: "border-amber-200 bg-amber-50/70",
    rose: "border-rose-200 bg-rose-50/70",
  }[tone];

  const valueClass = {
    stone: "text-stone-900",
    emerald: "text-emerald-800",
    amber: "text-amber-800",
    rose: "text-rose-800",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className={`text-3xl font-semibold tracking-tight tabular-nums ${valueClass}`}>
        {value}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-stone-700">{label}</p>
      <p className="mt-0.5 text-xs leading-snug text-stone-500">{note}</p>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  urgent = false,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  urgent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
        active
          ? "border-stone-800 bg-stone-800 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
      }`}
    >
      {label}
      <span
        className={`inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
          active
            ? "bg-white/20 text-white"
            : urgent
              ? "bg-rose-100 text-rose-800"
              : "bg-stone-100 text-stone-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
