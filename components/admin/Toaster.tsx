'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type ToastTone = 'default' | 'good' | 'warn'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

type ShowToast = (message: string, tone?: ToastTone) => void

const ToastContext = createContext<ShowToast>(() => {})

/** Call from anywhere under <Toaster> to confirm an action. */
export function useToast(): ShowToast {
  return useContext(ToastContext)
}

const TONE: Record<ToastTone, string> = {
  default: 'border-line-strong bg-surface text-ink',
  good: 'border-good-border bg-good-quiet text-good-text',
  warn: 'border-warn-border bg-warn-quiet text-warn-text',
}

const DURATION_MS = 3200

/**
 * A single stack of short confirmations, so an operator who just saved or
 * deleted something sees that it landed without hunting for an inline flash.
 * Screen readers get it through one polite live region rather than per toast.
 */
export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const show = useCallback<ShowToast>((message, tone = 'default') => {
    const id = nextId.current++
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, DURATION_MS)
  }, [])

  // Stable identity so consumers do not re-render on every toast change.
  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-5"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-toast
            className={`pointer-events-auto flex max-w-[min(92vw,420px)] items-center gap-2 rounded-[var(--radius)] border px-3.5 py-2.5 text-[13px] font-medium shadow-[0_6px_20px_rgba(23,20,45,0.10)] ${TONE[toast.tone]}`}
            style={{ animation: 'toast-in 200ms var(--ease) both' }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-toast] { animation: none !important; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
