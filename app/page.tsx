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
import { addLogItem, ensureSeeded, getKnowledge, newId, subscribe } from "@/lib/store";
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const knowledge = useSyncExternalStore(
    subscribe,
    getKnowledgeSnapshot,
    getServerKnowledgeSnapshot,
  );

  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Kept in a ref so a retry can re-run without stale-closure surprises. */
  const busyRef = useRef(false);

  useEffect(() => {
    ensureSeeded();
  }, []);

  useEffect(() => {
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
    setMessages((prev) => [
      ...prev,
      { id: newId("msg"), role: "parent", text: trimmed },
      { id: pendingId, role: "desk", text: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, knowledge: getKnowledge() }),
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
    [ask],
  );

  const showEmptyState = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col bg-[#faf7f2] font-sans text-stone-900">
      <style>{`
        @keyframes sunny-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sunny-expand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1200px; }
        }
        @keyframes sunny-dot {
          0%, 60%, 100% { opacity: 0.28; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-sunny-anim] { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#faf7f2]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 py-3 sm:px-6">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-lg"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-emerald-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3.4" />
              <path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M18.2 5.8l-1.7 1.7M7.5 16.5l-1.7 1.7" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] leading-tight font-semibold text-stone-900">
              {/* The full name overflows a 375px header, so phones get the short form. */}
              <span className="sm:hidden">{CENTER.shortName}</span>
              <span className="hidden sm:inline">{CENTER.name}</span>
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-tight text-stone-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI Front Desk
            </p>
          </div>

          <Link
            href="/admin"
            className="-mr-2 flex min-h-[44px] items-center rounded-full px-3 text-[13px] font-medium text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-700"
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
          className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 pt-6 pb-8 sm:px-6"
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
      <div className="sticky bottom-0 z-20 border-t border-stone-200/80 bg-[#faf7f2]/95 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(draft);
          }}
          className="mx-auto flex w-full max-w-[640px] items-end gap-2 px-4 py-3 sm:px-6"
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
            placeholder={busy ? "Checking the center's policies…" : "Ask a question…"}
            className="min-h-[48px] flex-1 rounded-full border border-stone-300 bg-white px-4 text-[16px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
          />
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            aria-label="Send question"
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white transition-all duration-150 hover:bg-emerald-800 active:scale-[0.94] disabled:bg-stone-300 disabled:active:scale-100"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
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
        <p className="mx-auto w-full max-w-[640px] px-4 pb-3 text-center text-[11px] text-stone-400 sm:px-6">
          Answers come from {CENTER.shortName}&rsquo;s written policies. For anything urgent,
          call {CENTER.phone}.
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
    <div data-sunny-anim style={{ animation: "sunny-rise 400ms ease-out both" }}>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <p className="text-[16px] leading-relaxed text-stone-800">
          Hi there — this is the {CENTER.shortName} front desk. Ask me anything about hours,
          tuition, illness policy, meals, or tours, and I&rsquo;ll answer straight from our
          written policies.
        </p>
      </div>

      <p className="mt-6 px-1 text-[12px] font-semibold tracking-[0.06em] text-stone-400 uppercase">
        Common questions
      </p>
      <div className="mt-2.5 flex flex-col items-start gap-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q)}
            data-sunny-anim
            style={{
              animation: `sunny-rise 380ms cubic-bezier(0.22, 1, 0.36, 1) ${80 + i * 55}ms both`,
            }}
            className="flex min-h-[44px] items-center rounded-full border border-stone-300 bg-white px-4 py-2.5 text-left text-[15px] text-stone-700 transition-all duration-150 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-900 active:scale-[0.97] disabled:opacity-50"
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
      data-sunny-anim
      style={{ animation: "sunny-rise 300ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-700 px-4 py-3 text-[16px] leading-relaxed whitespace-pre-line text-white shadow-[0_1px_2px_rgba(6,78,59,0.16)]">
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
        data-sunny-anim
        style={{ animation: "sunny-rise 260ms ease-out both" }}
      >
        <div
          className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-4"
          role="status"
          aria-label="The front desk is typing"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              data-sunny-anim
              className="h-2 w-2 rounded-full bg-stone-400"
              style={{ animation: `sunny-dot 1.25s ease-in-out ${i * 0.16}s infinite` }}
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
        data-sunny-anim
        style={{ animation: "sunny-rise 300ms ease-out both" }}
      >
        <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-rose-200 bg-rose-50 px-4 py-3.5">
          <p className="text-[15px] leading-relaxed text-rose-900">
            Sorry — I couldn&rsquo;t reach the front desk just now. Please try again, or call{" "}
            {CENTER.phone}.
          </p>
          <button
            type="button"
            onClick={() => onRetry(message.id, message.text)}
            className="mt-2.5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-[14px] font-medium text-rose-800 transition-all duration-150 hover:bg-rose-100 active:scale-[0.97]"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-4 w-4"
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
      data-sunny-anim
      style={{ animation: "sunny-rise 320ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <div className="max-w-[85%] min-w-0">
        {response?.escalate ? (
          <EscalationCard answer={message.text} reason={response.escalationReason} />
        ) : (
          <div className="rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <p className="text-[16px] leading-relaxed whitespace-pre-line text-stone-800">
              {message.text}
            </p>

            {sourceEntry ? <SourceChip entry={sourceEntry} /> : null}

            {response && response.confidence === "low" ? (
              <p className="mt-3 flex items-start gap-2 border-t border-stone-200/70 pt-3 text-[13px] leading-relaxed text-stone-500">
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-stone-400"
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
                  I&rsquo;m not fully certain on this one — it&rsquo;s worth confirming with the
                  office at {CENTER.phone}.
                </span>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
