"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { EscalationCard } from "@/components/EscalationCard";
import { SourceChip } from "@/components/SourceChip";
import { CENTER, SUGGESTED_QUESTIONS } from "@/lib/seed";
import {
  addLogItem,
  clearThread,
  ensureSeeded,
  getEmptyThread,
  getKnowledge,
  getThreadSnapshot,
  newId,
  saveThread,
  subscribe,
} from "@/lib/store";
import type { AnswerStatus, ChatMessage, ChatResponse, KnowledgeEntry } from "@/lib/types";

function statusFor(response: ChatResponse): AnswerStatus {
  if (response.escalate) return "escalated";
  if (response.sourceId === null) return "gap";
  return "answered";
}

const EMPTY_KNOWLEDGE: KnowledgeEntry[] = [];

/**
 * Cached so useSyncExternalStore sees a stable reference between store writes;
 * returning a fresh array every read would loop forever.
 */
let knowledgeSnapshot: KnowledgeEntry[] = EMPTY_KNOWLEDGE;
let knowledgeRaw = "";

function getKnowledgeSnapshot(): KnowledgeEntry[] {
  const all = getKnowledge();
  const raw = JSON.stringify(all);
  if (raw !== knowledgeRaw) {
    knowledgeRaw = raw;
    knowledgeSnapshot = all;
  }
  return knowledgeSnapshot;
}

/** localStorage is unavailable during SSR, so the server renders an empty KB. */
function getServerKnowledgeSnapshot(): KnowledgeEntry[] {
  return EMPTY_KNOWLEDGE;
}

export default function ParentChatPage() {
  /** Live transcript. Empty until the parent asks something this page load. */
  const [live, setLive] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  /**
   * The saved transcript, read through the store so the first client render
   * still matches the server's empty output. Once the parent sends a message,
   * `live` takes over and this is no longer consulted.
   */
  const restored = useSyncExternalStore(
    subscribe,
    getThreadSnapshot,
    getEmptyThread,
  );

  const messages = live ?? restored;
  const setMessages = useCallback(
    (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setLive((prev) => {
        const base = prev ?? getThreadSnapshot();
        return typeof update === "function" ? update(base) : update;
      });
    },
    [],
  );

  const knowledge = useSyncExternalStore(
    subscribe,
    getKnowledgeSnapshot,
    getServerKnowledgeSnapshot,
  );

  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Kept in a ref so a retry can re-run without stale-closure surprises. */
  const busyRef = useRef(false);
  /** Mirrors the transcript so `ask` can read history without depending on it. */
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    ensureSeeded();
  }, []);

  // Persist only what this page load produced. `live` stays null until the
  // parent sends something, so a fresh render never overwrites a saved thread.
  useEffect(() => {
    if (live === null) return;
    saveThread(live);
  }, [live]);

  useEffect(() => {
    messagesRef.current = messages;
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const knowledgeById = useMemo(() => {
    const map = new Map<string, KnowledgeEntry>();
    for (const entry of knowledge) map.set(entry.id, entry);
    return map;
  }, [knowledge]);

  const ask = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setDraft("");

    const pendingId = newId("msg");
    // Read before the optimistic append so the new question is not sent twice,
    // once as history and once as the current turn.
    const priorTurns = messagesRef.current
      .filter((m) => !m.pending && !m.error && m.text.trim().length > 0)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [
      ...prev,
      { id: newId("msg"), role: "parent", text: trimmed },
      { id: pendingId, role: "desk", text: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          knowledge: getKnowledge(),
          history: priorTurns,
        }),
      });

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const response = (await res.json()) as ChatResponse;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: m.id, role: "desk", text: response.answer, response }
            : m,
        ),
      );

      addLogItem({
        id: newId("log"),
        question: trimmed,
        answer: response.answer,
        status: statusFor(response),
        sourceId: response.sourceId,
        askedAt: new Date().toISOString(),
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: m.id, role: "desk", text: trimmed, error: true }
            : m,
        ),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [setMessages]);

  const startOver = useCallback(() => {
    clearThread();
    // Empty array, not null: null would fall back to the restored snapshot.
    setLive([]);
    setDraft("");
    inputRef.current?.focus();
  }, []);

  const retry = useCallback(
    (failedId: string, question: string) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === failedId);
        if (index < 0) return prev;
        // Drop the failed bubble and the parent message that produced it;
        // `ask` re-appends both so the transcript reads cleanly.
        return prev.slice(0, Math.max(0, index - 1));
      });
      void ask(question);
    },
    [ask, setMessages],
  );

  const showEmptyState = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col bg-bg font-sans text-ink">
      <style>{`
        @keyframes fd-rise {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fd-expand {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Each dot lifts and brightens in turn, so the wait reads as someone
         * actually looking something up rather than a spinner. */
        @keyframes fd-dot {
          0%, 70%, 100% { opacity: 0.3; transform: translateY(0) scale(0.85); }
          35% { opacity: 1; transform: translateY(-3px) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-fd-anim] { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-2.5 px-4 py-2.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[15px] leading-tight font-semibold tracking-[-0.01em] text-ink">
              {/* The full name overflows a 375px header, so phones get the short form. */}
              <span className="sm:hidden">{CENTER.shortName}</span>
              <span className="hidden sm:inline">{CENTER.name}</span>
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-tight text-ink-muted">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              />
              Front desk
            </p>
          </div>

          {messages.length > 0 ? (
            <button
              type="button"
              onClick={startOver}
              className="flex min-h-[44px] cursor-pointer items-center rounded-[var(--radius-soft)] px-3 text-[13px] font-medium text-ink-secondary transition-[color,background-color,transform] duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-surface-hover hover:text-ink active:scale-[0.97]"
            >
              Start over
            </button>
          ) : null}

          <Link
            href="/admin"
            className="-mr-1.5 flex min-h-[44px] items-center rounded-[var(--radius-soft)] px-3 text-[13px] font-medium text-ink-secondary transition-[color,background-color,transform] duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-surface-hover hover:text-ink active:scale-[0.97]"
          >
            Staff view
          </Link>
        </div>
      </header>

      {/* Transcript */}
      <main className="flex-1 overflow-y-auto">
        <div
          aria-live="polite"
          aria-label="Conversation with the front desk"
          className="mx-auto flex w-full max-w-[680px] flex-col gap-3.5 px-4 pt-6 pb-8 sm:px-6"
        >
          {showEmptyState ? (
            <EmptyState onPick={ask} disabled={busy} />
          ) : (
            messages.map((message) =>
              message.role === "parent" ? (
                <ParentBubble key={message.id} text={message.text} />
              ) : (
                <DeskMessage
                  key={message.id}
                  message={message}
                  knowledgeById={knowledgeById}
                  onRetry={retry}
                />
              ),
            )
          )}
          <div ref={scrollAnchorRef} />
        </div>
      </main>

      {/* Composer */}
      <div className="sticky bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(draft);
          }}
          className="mx-auto flex w-full max-w-[680px] items-center gap-2 px-4 pt-3.5 sm:px-6"
        >
          <label htmlFor="parent-question" className="sr-only">
            Ask the front desk a question
          </label>
          <input
            id="parent-question"
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            autoComplete="off"
            placeholder={busy ? "Checking the handbook…" : "Ask about hours, tuition, sick days…"}
            /* 16px on the input only, so iOS Safari doesn't zoom on focus. */
            className="min-h-[46px] flex-1 rounded-[var(--radius-soft)] border border-line-strong bg-surface px-4 text-[16px] text-ink shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-[color,background-color,border-color,box-shadow] duration-200 [transition-timing-function:var(--ease-soft)] placeholder:text-ink-muted hover:border-accent-border focus:border-accent focus:outline-none disabled:bg-surface-sunken disabled:text-ink-muted sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            aria-label="Send question"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[var(--radius-soft)] bg-accent text-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[color,background-color,transform,box-shadow] duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-accent-hover active:scale-[0.93] disabled:bg-surface-sunken disabled:text-ink-muted disabled:shadow-none disabled:active:scale-100"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.2 11.9 19.4 5.1a.5.5 0 0 1 .67.66L13.3 21a.5.5 0 0 1-.93-.05l-2-6.2-6.2-2a.5.5 0 0 1-.05-.93Z" />
            </svg>
          </button>
        </form>
        <p className="mx-auto w-full max-w-[680px] px-4 py-2.5 text-center text-[11px] leading-[1.5] text-ink-muted sm:px-6">
          Everything here comes straight from {CENTER.shortName}&rsquo;s handbook. Need
          someone right now? Call {CENTER.phone}.
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      {/* The greeting lands first, then the label, then the chips cascade in
       * one by one. 70ms apart reads as a hand dealing cards, not a loading bar. */}
      <div
        data-fd-anim
        style={{ animation: "fd-rise 320ms var(--ease-soft) both" }}
        className="max-w-[88%] rounded-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] border border-line bg-surface px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <p className="text-[15px] leading-[1.65] text-ink">
          Hi there. This is the {CENTER.shortName} front desk. Ask about hours, tuition,
          sick days, meals, or tours, and you&rsquo;ll get the answer straight from our
          handbook.
        </p>
      </div>

      <p
        data-fd-anim
        style={{ animation: "fd-rise 320ms var(--ease-soft) 110ms both" }}
        className="mt-6 mb-2.5 px-0.5 text-[10px] font-semibold tracking-[0.08em] text-ink-muted uppercase"
      >
        What parents usually ask
      </p>
      <div className="flex flex-col items-start gap-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q)}
            data-fd-anim
            style={{
              animation: `fd-rise 320ms var(--ease-soft) ${180 + i * 70}ms both`,
            }}
            className="flex min-h-[44px] items-center rounded-[var(--radius-soft)] border border-line bg-surface px-3.5 py-2.5 text-left text-[14px] font-medium text-ink-secondary transition-[color,background-color,border-color,transform] duration-200 [transition-timing-function:var(--ease-soft)] hover:border-accent-border hover:bg-accent-quiet hover:text-accent-text active:scale-[0.98] disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-ink-secondary disabled:active:scale-100"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParentBubble({ text }: { text: string }) {
  return (
    <div
      className="flex justify-end"
      data-fd-anim
      style={{ animation: "fd-rise 240ms var(--ease-soft) both" }}
    >
      {/* The small bottom-right corner is the tail: it points the bubble back at
       * whoever typed it, which is what makes a transcript read as a conversation. */}
      <p className="max-w-[85%] rounded-[var(--radius-bubble)] rounded-br-[var(--radius-sm)] bg-accent px-4 py-2.5 text-[15px] leading-[1.65] whitespace-pre-line text-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {text}
      </p>
    </div>
  );
}

function DeskMessage({
  message,
  knowledgeById,
  onRetry,
}: {
  message: ChatMessage;
  knowledgeById: Map<string, KnowledgeEntry>;
  onRetry: (failedId: string, question: string) => void;
}) {
  if (message.pending) {
    return (
      <div
        className="flex justify-start"
        data-fd-anim
        style={{ animation: "fd-rise 240ms var(--ease-soft) both" }}
      >
        <div
          className="flex items-center gap-1.5 rounded-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] border border-line bg-surface px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          role="status"
          aria-label="The front desk is typing"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              data-fd-anim
              className="h-[7px] w-[7px] rounded-full bg-accent"
              style={{
                animation: `fd-dot 1.4s var(--ease-soft) ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div
        className="flex justify-start"
        data-fd-anim
        style={{ animation: "fd-rise 240ms var(--ease-soft) both" }}
      >
        <div className="max-w-[88%] rounded-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] border border-gap-border bg-surface px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[15px] leading-[1.65] text-ink">
            Couldn&rsquo;t reach the front desk just now. Give it another try, or call{" "}
            {CENTER.phone}.
          </p>
          <button
            type="button"
            onClick={() => onRetry(message.id, message.text)}
            className="mt-2.5 inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--radius-soft)] border border-gap-border bg-gap-quiet px-3.5 text-[13px] font-medium text-gap-text transition-[color,background-color,border-color,transform] duration-200 [transition-timing-function:var(--ease-soft)] hover:bg-gap hover:border-gap hover:text-white active:scale-[0.97]"
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
              <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" />
              <path d="M16.8 3.2v3.6h-3.6" />
            </svg>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const response = message.response;
  const sourceEntry =
    response?.sourceId != null ? knowledgeById.get(response.sourceId) : undefined;

  return (
    <div
      className="flex justify-start"
      data-fd-anim
      style={{ animation: "fd-rise 280ms var(--ease-soft) both" }}
    >
      <div className="max-w-[88%] min-w-0">
        {response?.escalate ? (
          <EscalationCard answer={message.text} reason={response.escalationReason} />
        ) : (
          <div className="rounded-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)] border border-line bg-surface px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[15px] leading-[1.65] whitespace-pre-line text-ink">
              {message.text}
            </p>

            {sourceEntry ? <SourceChip entry={sourceEntry} /> : null}

            {response && response.confidence === "low" ? (
              <p className="mt-2.5 flex items-start gap-1.5 border-t border-line pt-2.5 text-[12px] leading-[1.55] text-ink-muted">
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="10" cy="10" r="7.3" />
                  <path d="M10 6.4v4.2M10 13.6h.01" />
                </svg>
                <span>
                  Not fully certain on this one. Worth double-checking with the office at{" "}
                  {CENTER.phone}.
                </span>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
