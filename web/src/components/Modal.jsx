import { useEffect, useId, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export default function Modal({ open, onClose, title, children, footer }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)

  // Store the element that opened the modal so we can return focus to it
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
      // Move focus into the dialog on next frame
      requestAnimationFrame(() => {
        const first = dialogRef.current?.querySelector(FOCUSABLE)
        if (first) first.focus()
      })
    } else if (triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [open])

  // Trap Tab / Shift+Tab inside the dialog; Escape closes it
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const nodes = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg card shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 id={titleId} className="font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 text-lg leading-none focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
