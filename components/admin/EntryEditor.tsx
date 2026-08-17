'use client'

import { useId, useState } from 'react'
import type { KnowledgeCategory } from '@/lib/types'
import { CATEGORIES, CATEGORY_LABEL } from './shared'

export interface EntryDraft {
  title: string
  category: KnowledgeCategory
  body: string
}

interface EntryEditorProps {
  initial: EntryDraft
  /** Copy on the primary button, e.g. "Save entry" vs "Add to knowledge base". */
  submitLabel: string
  bodyPlaceholder?: string
  onSave: (draft: EntryDraft) => void
  onCancel: () => void
}

/**
 * Shared by the Knowledge tab (edit/new) and the Inbox gap composer, so writing
 * an answer feels identical wherever the operator starts from.
 */
export function EntryEditor({ initial, submitLabel, bodyPlaceholder, onSave, onCancel }: EntryEditorProps) {
  const [title, setTitle] = useState(initial.title)
  const [category, setCategory] = useState<KnowledgeCategory>(initial.category)
  const [body, setBody] = useState(initial.body)
  const fieldId = useId()

  const titleId = `${fieldId}-title`
  const categoryId = `${fieldId}-category`
  const bodyId = `${fieldId}-body`

  const canSave = title.trim().length > 0 && body.trim().length > 0

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave) return
    onSave({ title: title.trim(), category, body: body.trim() })
  }

  const labelClass = 'block text-[12px] font-medium text-ink-secondary'
  const controlClass =
    'w-full rounded-[var(--radius)] border border-line-strong bg-surface px-2.5 py-2 text-[13px] text-ink outline-none transition-[border-color,background-color,box-shadow] duration-[140ms] [transition-timing-function:var(--ease)] placeholder:text-ink-muted hover:border-[var(--border-focus)] focus:border-[var(--border-focus)] sm:py-1'
  /* Thumb-sized on a phone, Linear-dense on a laptop. */
  const singleLine = 'min-h-[44px] sm:min-h-0 sm:h-8'
  const actionButton =
    'inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[var(--radius)] px-3.5 text-[13px] font-medium transition-[background-color,color,opacity] duration-[140ms] [transition-timing-function:var(--ease)] sm:min-h-0 sm:h-8'

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3.5">
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
            className={`${controlClass} ${singleLine}`}
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
            className={`${controlClass} ${singleLine} sm:w-44`}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* The answer field absorbs the modal's spare height, so a long policy
          is written in one view instead of a scrolling sliver. */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <label htmlFor={bodyId} className={labelClass}>
          What should the front desk say?
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder={bodyPlaceholder ?? "Write it the way you'd explain it to a parent."}
          className={`${controlClass} min-h-48 flex-1 resize-y leading-relaxed sm:py-2`}
        />
        <p className="text-[12px] text-ink-muted">
          Plain language works best. The front desk quotes this straight to parents.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!canSave}
          className={`${actionButton} bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted`}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${actionButton} border border-line-strong bg-surface text-ink-secondary hover:bg-surface-hover hover:text-ink`}
        >
          Cancel
        </button>
        {!canSave ? <span className="text-[12px] text-ink-muted">Add a title and an answer to save.</span> : null}
      </div>
    </form>
  )
}
