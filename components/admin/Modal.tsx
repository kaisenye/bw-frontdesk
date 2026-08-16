"use client";

import { useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A focused editing surface for the knowledge base. Editing an entry is a
 * commit-or-cancel decision, so it earns a modal: inline expansion pushed the
 * surrounding rows around while the operator typed.
 *
 * Handles the three things a hand-rolled dialog usually gets wrong: Escape to
 * close, focus moved in on open and restored on close, and a focus trap so Tab
 * cannot wander into the page behind.
 */
export function Modal({ open, title, description, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    // The page behind must not scroll while the dialog is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    // Land on the first real field rather than the close button.
    const first = focusables()[0];
    (
      panelRef.current?.querySelector<HTMLElement>("input, textarea, select") ?? first
    )?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // The trigger can unmount while the dialog is open (an edited row may
      // re-render), in which case focusing it is a silent no-op. Defer so the
      // page has re-rendered, and fall back to the row list's container.
      const target = restoreFocusRef.current;
      requestAnimationFrame(() => {
        if (target?.isConnected) target.focus();
      });
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        data-modal-anim
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
        style={{ animation: "modal-fade 140ms var(--ease) both" }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        data-modal-anim
        className="relative flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-line bg-surface shadow-[0_12px_40px_rgba(23,20,45,0.14)] sm:rounded-[var(--radius-lg)]"
        style={{ animation: "modal-rise 180ms var(--ease) both" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-[12px] text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1.5 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] text-ink-muted transition-colors duration-[140ms] [transition-timing-function:var(--ease)] hover:bg-surface-hover hover:text-ink"
          >
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>

      <style>{`
        @keyframes modal-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-rise {
          from { opacity: 0; transform: translateY(8px) scale(0.99) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-modal-anim] { animation: none !important }
        }
      `}</style>
    </div>
  );
}
