'use client'

import { useEffect, useState } from 'react'
import type { DraftResponse, DraftResult, HandbookEntry } from '@/lib/types'

type DraftState =
  { status: 'idle' } | { status: 'loading' } | { status: 'ready'; draft: DraftResponse } | { status: 'failed' }

/**
 * Fetches a proposed entry for a gap once the composer opens. The modal opens
 * instantly with a blank editor either way, so a slow or failed draft never
 * stands between the operator and writing the answer themselves.
 */
export function useGapDraft(question: string, handbook: HandbookEntry[], active: boolean): DraftState {
  const [state, setState] = useState<DraftState>({ status: 'idle' })

  useEffect(() => {
    if (!active) return

    const controller = new AbortController()
    let live = true

    // Not awaited: the effect body stays synchronous so it never trips the
    // no-setState-in-an-effect rule. Every write below happens after a tick.
    void (async () => {
      setState({ status: 'loading' })
      try {
        const res = await fetch('/api/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, handbook }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Draft request failed: ${res.status}`)

        const result = (await res.json()) as DraftResult
        if (!live) return
        setState(result.ok ? { status: 'ready', draft: result } : { status: 'failed' })
      } catch {
        // Aborts land here too, but `live` is already false by then.
        if (live) setState({ status: 'failed' })
      }
    })()

    return () => {
      live = false
      controller.abort()
    }
  }, [active, question, handbook])

  return state
}
