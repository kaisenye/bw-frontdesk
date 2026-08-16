"use client";

import { useId, useState } from "react";
import type { KnowledgeCategory } from "@/lib/types";
import { CATEGORIES, CATEGORY_LABEL } from "./shared";

export interface EntryDraft {
  title: string;
  category: KnowledgeCategory;
  body: string;
}

interface EntryEditorProps {
  initial: EntryDraft;
  /** Copy on the primary button, e.g. "Save entry" vs "Add to knowledge base". */
  submitLabel: string;
  bodyPlaceholder?: string;
  onSave: (draft: EntryDraft) => void;
  onCancel: () => void;
}

/**
 * Shared by the Knowledge tab (edit/new) and the Inbox gap composer, so writing
 * an answer feels identical wherever the operator starts from.
 */
export function EntryEditor({
  initial,
  submitLabel,
  bodyPlaceholder,
  onSave,
  onCancel,
}: EntryEditorProps) {
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState<KnowledgeCategory>(initial.category);
  const [body, setBody] = useState(initial.body);
  const fieldId = useId();

  const titleId = `${fieldId}-title`;
  const categoryId = `${fieldId}-category`;
  const bodyId = `${fieldId}-body`;

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave({ title: title.trim(), category, body: body.trim() });
  }

  const labelClass =
    "block text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase";
  const controlClass =
    "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-[15px] text-stone-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={titleId} className={labelClass}>
            Title
          </label>
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Birthday Treats in the Classroom"
            className={`${controlClass} min-h-[44px]`}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={categoryId} className={labelClass}>
            Category
          </label>
          <select
            id={categoryId}
            value={category}
            onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
            className={`${controlClass} min-h-[44px] sm:w-44`}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={bodyId} className={labelClass}>
          What should the front desk say?
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder={bodyPlaceholder ?? "Write it the way you would explain it to a parent."}
          className={`${controlClass} resize-y font-mono text-[13.5px] leading-relaxed`}
        />
        <p className="text-xs text-stone-500">
          Plain language works best — the front desk quotes this to parents.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:outline-none"
        >
          Cancel
        </button>
        {!canSave ? (
          <span className="text-xs text-stone-500">
            Add a title and an answer to save.
          </span>
        ) : null}
      </div>
    </form>
  );
}
