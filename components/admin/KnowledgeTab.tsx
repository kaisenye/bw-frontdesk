'use client'

import { useCallback, useMemo, useState } from 'react'
import { deleteEntry, newId, saveEntry } from '@/lib/store'
import type { KnowledgeCategory, KnowledgeEntry } from '@/lib/types'
import { EntryEditor, type EntryDraft } from './EntryEditor'
import { Modal } from './Modal'
import { useToast } from './Toaster'
import { CATEGORIES, CATEGORY_LABEL, CategoryBadge, OperatorBadge, relativeTime } from './shared'

interface KnowledgeTabProps {
  entries: KnowledgeEntry[]
}

type CategoryFilter = KnowledgeCategory | 'all'

/**
 * One editor is open, or none. Modelling this as a single value (rather than a
 * "creating" flag next to an "editingId") makes the two states mutually
 * exclusive by construction, so no combination of clicks can open both.
 */
type EditorState = { mode: 'new' } | { mode: 'edit'; entry: KnowledgeEntry } | null

const NEW_DRAFT: EntryDraft = { title: '', category: 'policies', body: '' }

export function KnowledgeTab({ entries }: KnowledgeTabProps) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [editorState, setEditorState] = useState<EditorState>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const toast = useToast()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries
      .filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
      .filter((e) => q.length === 0 || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [entries, query, categoryFilter])

  function flashSaved(id: string) {
    setSavedId(id)
    window.setTimeout(() => {
      setSavedId((current) => (current === id ? null : current))
    }, 2600)
  }

  // Stable identity: Modal takes onClose as an effect dependency.
  const closeEditor = useCallback(() => setEditorState(null), [])

  function handleSaveExisting(entry: KnowledgeEntry, draft: EntryDraft) {
    saveEntry({ ...entry, ...draft })
    closeEditor()
    flashSaved(entry.id)
    toast(`Saved “${draft.title}”.`, 'good')
  }

  function handleCreate(draft: EntryDraft) {
    const entry: KnowledgeEntry = {
      id: newId('kb'),
      title: draft.title,
      category: draft.category,
      body: draft.body,
      updatedAt: new Date().toISOString(),
    }
    saveEntry(entry)
    closeEditor()
    flashSaved(entry.id)
    toast(`Added “${draft.title}”. The front desk can use it now.`, 'good')
  }

  function handleDelete(id: string) {
    // Read the title before the row disappears, so the toast can name it.
    const title = entries.find((e) => e.id === id)?.title ?? 'That entry'
    deleteEntry(id)
    setConfirmingDeleteId(null)
    toast(`Deleted “${title}”.`, 'warn')
  }

  const rowAction =
    'inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium transition-[background-color,color,border-color] duration-[140ms] [transition-timing-function:var(--ease)] sm:min-h-0 sm:h-7'

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: search and the one primary action, on a single dense line. */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="kb-search" className="sr-only">
            Search the knowledge base
          </label>
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.5 13.5 3.5 3.5" />
          </svg>
          <input
            id="kb-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles and answers"
            className="min-h-[44px] w-full rounded-[var(--radius)] border border-line bg-surface pr-2.5 pl-8 text-[13px] text-ink outline-none transition-[border-color,box-shadow] duration-[140ms] [transition-timing-function:var(--ease)] placeholder:text-ink-muted hover:border-line-strong focus:border-[var(--border-focus)] sm:h-8 sm:min-h-0"
          />
        </div>
        <button
          type="button"
          onClick={() => setEditorState({ mode: 'new' })}
          className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius)] bg-accent px-3.5 text-[13px] font-medium text-white transition-[background-color] duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-accent-hover sm:h-8 sm:min-h-0"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M10 4.5v11M4.5 10h11" />
          </svg>
          New entry
        </button>
      </div>

      {/* Category filter reads as one control strip, not a field of pills. */}
      <div
        className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 px-1"
        role="group"
        aria-label="Filter by category"
      >
        <FilterTab
          active={categoryFilter === 'all'}
          onClick={() => setCategoryFilter('all')}
          label="All"
          count={entries.length}
        />
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat).length
          if (count === 0) return null
          return (
            <FilterTab
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
              label={CATEGORY_LABEL[cat]}
              count={count}
            />
          )
        })}
      </div>

      {/* The editor lives in a modal, so typing never pushes the rows around.
          It mounts fresh on open, which keeps a second edit from showing the
          first entry's draft. */}
      <Modal
        open={editorState?.mode === 'new'}
        title="New knowledge entry"
        description="Write it once and the front desk can use it from here on."
        onClose={closeEditor}
      >
        {editorState?.mode === 'new' ? (
          <EntryEditor initial={NEW_DRAFT} submitLabel="Save entry" onSave={handleCreate} onCancel={closeEditor} />
        ) : null}
      </Modal>

      <Modal
        open={editorState?.mode === 'edit'}
        title="Edit entry"
        description={editorState?.mode === 'edit' ? `Updating “${editorState.entry.title}”` : undefined}
        onClose={closeEditor}
      >
        {editorState?.mode === 'edit' ? (
          <EntryEditor
            /* The modal stays mounted between edits, so without a key the
             * editor keeps the previous entry's draft in its own state. */
            key={editorState.entry.id}
            initial={{
              title: editorState.entry.title,
              category: editorState.entry.category,
              body: editorState.entry.body,
            }}
            submitLabel="Save entry"
            onSave={(draft) => handleSaveExisting(editorState.entry, draft)}
            onCancel={closeEditor}
          />
        ) : null}
      </Modal>

      {visible.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface px-4 py-12 text-center text-[13px] text-ink-muted">
          Nothing matches that search. Try a shorter word.
        </p>
      ) : (
        /* One bordered container, hairline-divided rows. Reads as a list, not a
           stack of cards. */
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
          {visible.map((entry) => {
            const isConfirming = confirmingDeleteId === entry.id
            const justSaved = savedId === entry.id

            return (
              <li
                key={entry.id}
                className={`group px-4 py-3 transition-colors duration-[140ms] [transition-timing-function:var(--ease)] ${
                  justSaved ? 'bg-accent-quiet' : 'hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Tight grouping inside the record: title, tags, meta. */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-[13px] font-semibold text-ink">{entry.title}</h3>
                      <CategoryBadge category={entry.category} />
                      {entry.addedByOperator ? <OperatorBadge /> : null}
                      {justSaved ? (
                        <span role="status" className="text-[11px] font-medium text-accent-text">
                          Saved
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed whitespace-pre-line text-ink-secondary">
                      {entry.body}
                    </p>
                    <p className="mt-1 text-[12px] text-ink-muted">Updated {relativeTime(entry.updatedAt)}</p>
                  </div>

                  {/* Actions stay quiet until the row is hovered or focused. */}
                  <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-[140ms] [transition-timing-function:var(--ease)] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    {isConfirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className={`${rowAction} bg-gap-quiet text-gap-text hover:bg-gap hover:text-white`}
                        >
                          Delete for good
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          className={`${rowAction} text-ink-secondary hover:bg-surface-sunken hover:text-ink`}
                        >
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorState({ mode: 'edit', entry })
                            setConfirmingDeleteId(null)
                          }}
                          className={`${rowAction} text-ink-secondary hover:bg-surface-sunken hover:text-ink`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(entry.id)}
                          className={`${rowAction} text-ink-muted hover:bg-gap-quiet hover:text-gap-text`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-[12px] font-medium transition-[background-color,color] duration-[140ms] [transition-timing-function:var(--ease)] sm:h-7 sm:min-h-0 ${
        active ? 'bg-surface-sunken text-ink' : 'text-ink-muted hover:bg-surface-hover hover:text-ink-secondary'
      }`}
    >
      {label}
      <span className={`tabular-nums ${active ? 'text-ink-secondary' : 'text-ink-muted'}`}>{count}</span>
    </button>
  )
}
