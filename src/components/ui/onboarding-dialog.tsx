// Multi-step onboarding dialog for Deimos.
// Adapted from the Origin UI onboarding dialog demo. It uses no Radix packages:
// focus handling, Escape-to-close and the animations are done here and in
// src/index.css (search for "Onboarding").

import { ReactNode, useEffect, useRef, useState } from "react"
import { Icon } from "./icon"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

export type OnboardingStep = {
  eyebrow?: string
  title: string
  description: string
  art: ReactNode
}

export function OnboardingDialog({
  open,
  steps,
  onClose,
  finishLabel = "Get started",
  onFinish,
}: {
  open: boolean
  steps: OnboardingStep[]
  onClose: () => void
  finishLabel?: string
  onFinish?: () => void
}) {
  const [step, setStep] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const total = steps.length
  const last = step === total - 1
  const current = steps[step]

  useEffect(() => {
    if (!open) return
    setStep(0)
    restoreFocus.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      restoreFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowRight") setStep((s) => Math.min(s + 1, total - 1))
      if (event.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0))
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        )
        if (!focusable.length) return
        const first = focusable[0]
        const lastEl = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          lastEl.focus()
        } else if (!event.shiftKey && document.activeElement === lastEl) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose, total])

  if (!open || !current) return null

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div
        className="deimos-fade-in absolute inset-0 bg-[#171a18]/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        tabIndex={-1}
        className="deimos-zoom-in relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-[#fffefa] shadow-[0_30px_80px_rgba(0,0,0,0.35)] outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="absolute right-4 top-4 z-10 grid size-8 cursor-pointer place-items-center rounded-lg bg-black/25 text-white backdrop-blur transition hover:bg-black/40"
        >
          <Icon name="close" size={16} />
        </button>

        <div className="p-2">
          <div
            key={step}
            className="deimos-step-in relative h-[230px] overflow-hidden rounded-xl"
          >
            {current.art}
          </div>
        </div>

        <div className="px-6 pb-6 pt-3">
          <div key={`text-${step}`} className="deimos-step-in min-h-[112px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a92d35]">
              {current.eyebrow ?? `Step ${step + 1} of ${total}`}
            </p>
            <h2
              id="onboarding-title"
              className="mt-2 text-xl font-bold tracking-tight text-[#171a18]"
            >
              {current.title}
            </h2>
            <p
              id="onboarding-description"
              className="mt-2 text-sm leading-6 text-[#6f716d]"
            >
              {current.description}
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-1.5" aria-label="Tour progress">
              {steps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  aria-label={`Go to step ${index + 1}`}
                  aria-current={index === step ? "step" : undefined}
                  className={cx(
                    "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                    index === step
                      ? "w-6 bg-[#a92d35]"
                      : index < step
                        ? "w-1.5 bg-[#a92d35]/50"
                        : "w-1.5 bg-[#171a18]/15 hover:bg-[#171a18]/30",
                  )}
                />
              ))}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
                className="h-10 flex-1 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#6f716d] transition hover:bg-[#efede7] hover:text-[#171a18] sm:flex-none"
              >
                {step === 0 ? "Skip" : "Back"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (last) {
                    onFinish?.()
                    onClose()
                  } else {
                    setStep(step + 1)
                  }
                }}
                className="group flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#a92d35] px-5 text-sm font-semibold text-white transition hover:bg-[#8f252d] sm:flex-none"
              >
                {last ? finishLabel : "Next"}
                <Icon
                  name="arrowRight"
                  size={16}
                  className="opacity-70 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
