"use client";

import { useMemo, useState } from "react";
import { deleteEntry, newId, saveEntry } from "@/lib/store";
import type { KnowledgeCategory, KnowledgeEntry } from "@/lib/types";
import { EntryEditor, type EntryDraft } from "./EntryEditor";
import { CATEGORIES, CATEGORY_LABEL, CategoryBadge, OperatorBadge, relativeTime } from "./shared";

interface KnowledgeTabProps {
  entries: KnowledgeEntry[];
}

type CategoryFilter = KnowledgeCategory | "all";

const NEW_DRAFT: EntryDraft = { title: "", category: "policies", body: "" };

export function KnowledgeTab({ entries }: KnowledgeTabProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => categoryFilter === "all" || e.category === categoryFilter)
      .filter(
        (e) =>
          q.length === 0 ||
          e.title.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q),
      )
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [entries, query, categoryFilter]);

  function flashSaved(id: string) {
    setSavedId(id);
    window.setTimeout(() => {
      setSavedId((current) => (current === id ? null : current));
    }, 2600);
  }

  function handleSaveExisting(entry: KnowledgeEntry, draft: EntryDraft) {
    saveEntry({ ...entry, ...draft });
    setEditingId(null);
    flashSaved(entry.id);
  }

  function handleCreate(draft: EntryDraft) {
    const entry: KnowledgeEntry = {
      id: newId("kb"),
      title: draft.title,
      category: draft.category,
      body: draft.body,
      updatedAt: new Date().toISOString(),
    };
    saveEntry(entry);
    setCreating(false);
    flashSaved(entry.id);
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    setConfirmingDeleteId(null);
  }

  const filterChip =
    "inline-flex min-h-[36px] items-center rounded-full border px-3.5 text-[13px] font-semibold transition";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label
            htmlFor="kb-search"
            className="block text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase"
          >
            Search the knowledge base
          </label>
          <input
            id="kb-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles and answers…"
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[15px] text-stone-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none sm:self-end"
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          New entry
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          aria-pressed={categoryFilter === "all"}
          className={`${filterChip} ${
            categoryFilter === "all"
              ? "border-stone-800 bg-stone-800 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
          }`}
        >
          All ({entries.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat).length;
          if (count === 0) return null;
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={active}
              className={`${filterChip} ${
                active
                  ? "border-stone-800 bg-stone-800 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {CATEGORY_LABEL[cat]} ({count})
            </button>
          );
        })}
      </div>

      {creating ? (
        <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-stone-900">New knowledge entry</h2>
          <EntryEditor
            initial={NEW_DRAFT}
            submitLabel="Save entry"
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </section>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center text-sm text-stone-500">
          No entries match that search.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {visible.map((entry) => {
            const isEditing = editingId === entry.id;
            const isConfirming = confirmingDeleteId === entry.id;
            const justSaved = savedId === entry.id;

            return (
              <li
                key={entry.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  justSaved ? "border-emerald-400 ring-2 ring-emerald-500/20" : "border-stone-200"
                }`}
              >
                {isEditing ? (
                  <>
                    <h3 className="mb-4 text-base font-semibold text-stone-900">
                      Editing “{entry.title}”
                    </h3>
                    <EntryEditor
                      initial={{
                        title: entry.title,
                        category: entry.category,
                        body: entry.body,
                      }}
                      submitLabel="Save entry"
                      onSave={(draft) => handleSaveExisting(entry, draft)}
                      onCancel={() => setEditingId(null)}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-stone-900">
                            {entry.title}
                          </h3>
                          <CategoryBadge category={entry.category} />
                          {entry.addedByOperator ? <OperatorBadge /> : null}
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          Updated {relativeTime(entry.updatedAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {justSaved ? (
                          <span
                            role="status"
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                          >
                            <span aria-hidden="true">✅</span> Saved
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(entry.id);
                            setCreating(false);
                            setConfirmingDeleteId(null);
                          }}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:outline-none"
                        >
                          Edit
                        </button>
                        {isConfirming ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:outline-none"
                            >
                              Confirm delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteId(null)}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                            >
                              Keep
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(entry.id)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-400/40 focus-visible:outline-none"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed whitespace-pre-line text-stone-600">
                      {entry.body}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
