"use client";

import { useMemo, useState } from "react";
import { newId, resolveLogItem, saveEntry } from "@/lib/store";
import type { KnowledgeEntry, QuestionLogItem } from "@/lib/types";
import { EntryEditor, type EntryDraft } from "./EntryEditor";
import { CategoryBadge, StatusBadge, relativeTime } from "./shared";

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

/**
 * Two panes, Intercom style: a scannable list of parent questions on the left,
 * the full conversation and the operator's actions on the right. Below md the
 * two panes take turns instead of sitting side by side, because a phone has
 * room for exactly one of them.
 */
export function InboxTab({ log, entries }: InboxTabProps) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composingId, setComposingId] = useState<string | null>(null);
  const [justResolvedId, setJustResolvedId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  // Mobile only: which pane the operator is looking at right now.
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

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

  // Selection is derived, not synced. If the chosen row is still in the list it
  // stays put through log updates and filter changes; otherwise the top row
  // takes over, which is also the default on first paint.
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0];

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileView("detail");
    if (composingId !== id) setComposingId(null);
  }

  function handleFilter(next: InboxFilter) {
    setFilter(next);
    setMobileView("list");
  }

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
    <div className="flex flex-col gap-4">
      <MetricStrip stats={stats} />

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
        <div className="flex min-h-[520px] flex-col md:h-[calc(100vh-19rem)] md:min-h-[460px] md:flex-row">
          {/* Left pane: the queue. */}
          <div
            className={`flex min-h-0 flex-1 flex-col md:w-[312px] md:flex-none md:border-r md:border-line ${
              mobileView === "detail" ? "hidden md:flex" : "flex"
            }`}
          >
            <div
              className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5"
              role="group"
              aria-label="Filter questions"
            >
              <FilterTab
                label="All"
                count={stats.total}
                active={filter === "all"}
                onClick={() => handleFilter("all")}
              />
              <FilterTab
                label="Needs attention"
                count={attentionCount}
                active={filter === "attention"}
                onClick={() => handleFilter("attention")}
                urgent={attentionCount > 0}
              />
              <FilterTab
                label="Answered"
                count={stats.answered}
                active={filter === "answered"}
                onClick={() => handleFilter("answered")}
              />
            </div>

            {visible.length === 0 ? (
              <p className="px-4 py-12 text-center text-[13px] text-ink-muted">
                {filter === "attention"
                  ? "You're all caught up. The front desk handled everything."
                  : "No questions here yet."}
              </p>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
                {visible.map((item) => (
                  <li key={item.id}>
                    <ConversationRow
                      item={item}
                      active={selected?.id === item.id}
                      onSelect={() => handleSelect(item.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right pane: the whole story for one question. */}
          <div
            className={`min-h-0 flex-1 flex-col overflow-y-auto bg-surface-sunken md:bg-surface ${
              mobileView === "detail" ? "flex" : "hidden md:flex"
            }`}
          >
            {selected ? (
              <DetailPane
                key={selected.id}
                item={selected}
                source={selected.sourceId ? entryById.get(selected.sourceId) : undefined}
                composing={composingId === selected.id}
                celebrating={justResolvedId === selected.id}
                reviewed={reviewedIds.includes(selected.id)}
                onStartComposing={() => setComposingId(selected.id)}
                onCancelComposing={() => setComposingId(null)}
                onSaveAnswer={(draft) => handleAnswerGap(selected, draft)}
                onMarkReviewed={() => setReviewedIds((prev) => [...prev, selected.id])}
                onBack={() => setMobileView("list")}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-16">
                <p className="max-w-[26ch] text-center text-[13px] text-ink-muted">
                  {stats.total === 0
                    ? "Nothing has come in yet. Parent questions land here as they get asked."
                    : "Pick a question on the left to see the details."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One row in the queue. The question is the subject line, clamped to two lines,
 * with a status dot and a relative timestamp riding along as metadata.
 */
function ConversationRow({
  item,
  active,
  onSelect,
}: {
  item: QuestionLogItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`relative flex w-full min-h-[44px] cursor-pointer flex-col gap-1 px-3 py-2.5 text-left transition-[background-color,color] duration-[140ms] [transition-timing-function:var(--ease)] ${
        active ? "bg-accent-quiet" : "hover:bg-surface-hover"
      }`}
    >
      {/* A hairline rail carries status at the row edge, so the eye can scan the
          left margin without reading every label. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.5 ${
          active ? "bg-accent" : item.status === "gap" ? "bg-gap" : item.status === "escalated" ? "bg-warn" : "bg-transparent"
        }`}
      />

      <div className="flex items-start justify-between gap-2">
        <p
          className="min-w-0 flex-1 overflow-hidden text-[13px] leading-snug font-medium text-ink"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {item.question}
        </p>
        <span className="shrink-0 text-[12px] whitespace-nowrap text-ink-muted tabular-nums">
          {relativeTime(item.askedAt)}
        </span>
      </div>

      <StatusLine status={item.status} />
    </button>
  );
}

const STATUS_TEXT = {
  answered: { label: "Answered", dot: "bg-accent", text: "text-ink-muted" },
  escalated: { label: "Sent to staff", dot: "bg-warn", text: "text-warn-text" },
  gap: { label: "Needs an answer", dot: "bg-gap", text: "text-gap-text" },
} as const;

/** Dot plus words, so the row never leans on color by itself. */
function StatusLine({ status }: { status: QuestionLogItem["status"] }) {
  const meta = STATUS_TEXT[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] ${meta.text}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

interface DetailPaneProps {
  item: QuestionLogItem;
  source: KnowledgeEntry | undefined;
  composing: boolean;
  celebrating: boolean;
  reviewed: boolean;
  onStartComposing: () => void;
  onCancelComposing: () => void;
  onSaveAnswer: (draft: EntryDraft) => void;
  onMarkReviewed: () => void;
  onBack: () => void;
}

function DetailPane({
  item,
  source,
  composing,
  celebrating,
  reviewed,
  onStartComposing,
  onCancelComposing,
  onSaveAnswer,
  onMarkReviewed,
  onBack,
}: DetailPaneProps) {
  return (
    <article className="flex min-h-0 flex-1 flex-col bg-surface">
      <header className="flex items-center gap-2 border-b border-line px-3 py-1.5 md:px-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 rounded-[var(--radius-sm)] px-1.5 text-[13px] font-medium text-ink-secondary transition-[background-color,color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover hover:text-ink md:hidden"
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
          All questions
        </button>

        <div className="flex min-h-[44px] flex-1 flex-wrap items-center justify-end gap-2 md:justify-between">
          <StatusBadge status={item.status} />
          <span className="text-[12px] text-ink-muted tabular-nums">
            Asked {relativeTime(item.askedAt)}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-3 py-4 md:px-5">
        <section>
          <h2 className="text-[12px] font-medium text-ink-muted">A parent asked</h2>
          <p className="mt-1 font-display text-[15px] leading-snug font-semibold tracking-[-0.01em] text-ink">
            {item.question}
          </p>
        </section>

        <section>
          <h3 className="text-[12px] font-medium text-ink-muted">The front desk said</h3>
          <p className="mt-1 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-secondary">
            {item.answer}
          </p>
        </section>

        {source ? (
          <section className="rounded-[var(--radius)] border border-line bg-surface-sunken p-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[12px] font-medium text-ink-muted">Answered from</h3>
              <CategoryBadge category={source.category} />
              {item.resolvedByEntryId ? (
                <span className="text-[12px] font-medium text-accent-text">you wrote this</span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-ink">{source.title}</p>
            {source.body ? (
              <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-line text-ink-secondary">
                {source.body}
              </p>
            ) : null}
          </section>
        ) : null}

        {celebrating ? (
          <p
            role="status"
            className="flex items-center gap-1.5 rounded-[var(--radius)] border border-accent-border bg-accent-quiet px-2.5 py-2 text-[13px] font-medium text-accent-text"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10.5 8 14.5 16 6" />
            </svg>
            Got it. The front desk can answer this one now.
          </p>
        ) : null}

        {item.status === "gap" && !composing ? (
          <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius)] border border-gap-border bg-gap-quiet px-3 py-2.5">
            <p className="flex-1 text-[12px] text-gap-text">
              <span className="font-medium">Nothing in the knowledge base covers this.</span>{" "}
              Write it once and the front desk takes it from here.
            </p>
            <button
              type="button"
              onClick={onStartComposing}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] bg-accent px-3.5 text-[13px] font-medium text-white transition-[background-color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-accent-hover"
            >
              Answer this
            </button>
          </div>
        ) : null}

        {item.status === "gap" && composing ? (
          <div className="rounded-[var(--radius)] border border-accent-border bg-surface p-3.5">
            <h3 className="mb-3 font-display text-[13px] font-semibold tracking-[-0.01em] text-ink">
              Teach the front desk this answer
            </h3>
            <EntryEditor
              initial={{
                title: suggestTitle(item.question),
                category: "policies",
                body: "",
              }}
              submitLabel="Add to knowledge base"
              bodyPlaceholder="Answer the parent's question here, the way you'd say it in person."
              onSave={onSaveAnswer}
              onCancel={onCancelComposing}
            />
          </div>
        ) : null}

        {item.status === "escalated" ? (
          <div className="flex flex-wrap items-center gap-2.5 rounded-[var(--radius)] border border-warn-border bg-warn-quiet px-3 py-2.5">
            <p className="flex-1 text-[12px] text-warn-text">
              <span className="font-medium">A human got looped in.</span> The front desk
              handed this to staff instead of guessing.
            </p>
            {reviewed ? (
              <span
                role="status"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-warn-text"
              >
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 10.5 8 14.5 16 6" />
                </svg>
                Marked reviewed
              </span>
            ) : (
              <button
                type="button"
                onClick={onMarkReviewed}
                className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-warn-border bg-surface px-2.5 text-[12px] font-medium text-warn-text transition-[background-color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-warn-quiet"
              >
                Mark reviewed
              </button>
            )}
          </div>
        ) : null}

        {item.status === "answered" && !celebrating ? (
          <p className="text-[12px] text-ink-muted">
            No action needed here. The front desk had this one covered.
          </p>
        ) : null}
      </div>
    </article>
  );
}

interface Stats {
  total: number;
  answered: number;
  escalated: number;
  gaps: number;
  answeredPct: number;
}

/**
 * One horizontal strip instead of four pastel cards. Every number shares the
 * same treatment, and only the two that imply work carry semantic color, so
 * "3 gaps" is visible at a glance while "48 asked" stays background context.
 * All values come straight from the log.
 */
function MetricStrip({ stats }: { stats: Stats }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-2.5">
      <Metric value={String(stats.total)} label="asked" />
      <Metric value={`${stats.answeredPct}%`} label="answered on the spot" />
      <Metric
        value={String(stats.escalated)}
        label="sent to staff"
        tone={stats.escalated > 0 ? "warn" : "neutral"}
      />
      <Metric
        value={String(stats.gaps)}
        label={stats.gaps === 1 ? "gap to fill" : "gaps to fill"}
        tone={stats.gaps > 0 ? "gap" : "neutral"}
      />
      <p className="ml-auto hidden text-[12px] text-ink-muted lg:block">
        {stats.gaps > 0
          ? "Fill a gap and it stops coming back."
          : "Nothing missing right now."}
      </p>
    </div>
  );
}

function Metric({
  value,
  label,
  tone = "neutral",
}: {
  value: string;
  label: string;
  tone?: "neutral" | "warn" | "gap";
}) {
  const valueClass = {
    neutral: "text-ink",
    warn: "text-warn-text",
    gap: "text-gap-text",
  }[tone];

  return (
    <p className="flex items-baseline gap-1.5">
      <span className={`text-[15px] font-semibold tabular-nums ${valueClass}`}>{value}</span>
      <span className="text-[12px] text-ink-muted">{label}</span>
    </p>
  );
}

function FilterTab({
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
      className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium transition-[background-color,color] duration-[140ms] [transition-timing-function:var(--ease)] ${
        active
          ? "bg-surface-sunken text-ink"
          : "text-ink-muted hover:bg-surface-hover hover:text-ink-secondary"
      }`}
    >
      {label}
      <span
        className={`tabular-nums ${
          urgent && !active ? "text-gap-text" : active ? "text-ink-secondary" : "text-ink-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
