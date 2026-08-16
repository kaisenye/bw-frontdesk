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

  const labelClass = "block text-[12px] font-medium text-ink-secondary";
  const controlClass =
    "w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-2 text-[13px] text-ink outline-none transition-[border-color,background-color] duration-[140ms] [transition-timing-function:var(--ease)] placeholder:text-ink-muted hover:border-[var(--border-focus)] focus:border-[var(--border-focus)]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="grid gap-3.5 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={titleId} className={labelClass}>
            Title
          </label>
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Birthday treats in the classroom"
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
          rows={8}
          placeholder={bodyPlaceholder ?? "Write it the way you'd explain it to a parent."}
          className={`${controlClass} resize-y leading-relaxed`}
        />
        <p className="text-[12px] text-ink-muted">
          Plain language works best. The front desk quotes this straight to parents.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[var(--radius)] bg-accent px-3.5 text-[13px] font-medium text-white transition-[background-color,opacity] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[var(--radius)] border border-line-strong bg-surface px-3.5 text-[13px] font-medium text-ink-secondary transition-[background-color,color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover hover:text-ink"
        >
          Cancel
        </button>
        {!canSave ? (
          <span className="text-[12px] text-ink-muted">
            Add a title and an answer to save.
          </span>
        ) : null}
      </div>
    </form>
  );
}
