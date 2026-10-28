// Collapsible app sidebar for Deimos.
// Adapted from the Aceternity/21st.dev "sidebar" demo for this Vite app:
// no Next.js links and no framer-motion; the expand/slide animations are CSS.
//
// Desktop (lg+): a 76px icon rail that expands to 264px on hover or keyboard
// focus, floating over the page so the content never jumps.
// Mobile: a top bar with a menu button that slides the full menu in.

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { Icon } from "./icon"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

type SidebarContextValue = {
  open: boolean
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  open: true,
  close: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export const SIDEBAR_RAIL_WIDTH = 76

export function Sidebar({
  children,
  mobileBrand,
}: {
  children: ReactNode
  mobileBrand: ReactNode
}) {
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop rail */}
      <aside
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-50 hidden lg:block"
        onMouseEnter={() => setDesktopOpen(true)}
        onMouseLeave={() => setDesktopOpen(false)}
        onFocusCapture={() => setDesktopOpen(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDesktopOpen(false)
          }
        }}
      >
        <div
          className={cx(
            "flex h-full flex-col overflow-hidden bg-[#171a18] px-3 py-5 text-white transition-[width,box-shadow] duration-300 ease-out",
            desktopOpen
              ? "w-[264px] shadow-[12px_0_40px_rgba(23,26,24,0.28)]"
              : "w-[76px]",
          )}
        >
          <SidebarContext.Provider
            value={{ open: desktopOpen, close: () => setDesktopOpen(false) }}
          >
            {children}
          </SidebarContext.Provider>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between bg-[#171a18] px-4 text-white lg:hidden">
        {mobileBrand}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-white/10"
        >
          <Icon name="menu" size={22} />
        </button>
      </div>

      {/* Mobile slide-in panel */}
      <div
        className={cx(
          "fixed inset-0 z-[90] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cx(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cx(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-[#171a18] px-4 py-5 text-white shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="absolute right-4 top-5 grid size-9 cursor-pointer place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Icon name="close" size={20} />
          </button>
          {mobileOpen && (
            <SidebarContext.Provider
              value={{ open: true, close: () => setMobileOpen(false) }}
            >
              {children}
            </SidebarContext.Provider>
          )}
        </div>
      </div>
    </>
  )
}

// Text that fades in only while the rail is expanded.
export function SidebarLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { open } = useSidebar()
  return (
    <span
      className={cx(
        "whitespace-pre transition-[opacity,transform] duration-200",
        open ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SidebarSection({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  const { open } = useSidebar()
  return (
    <div className="flex flex-col gap-1">
      {title && (
        <p
          className={cx(
            "mb-1 h-4 px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          {title}
        </p>
      )}
      {children}
    </div>
  )
}

export function SidebarLink({
  label,
  icon,
  onClick,
  active = false,
  badge,
  variant = "default",
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  active?: boolean
  badge?: number
  variant?: "default" | "primary"
}) {
  const { open, close } = useSidebar()
  const primary = variant === "primary"
  return (
    <button
      type="button"
      onClick={() => {
        onClick()
        close()
      }}
      aria-current={active ? "page" : undefined}
      title={open ? undefined : label}
      className={cx(
        "group/sidebar relative flex h-11 w-full shrink-0 cursor-pointer items-center gap-3 rounded-lg px-[14px] text-left text-sm transition-colors",
        primary
          ? "bg-[#a92d35] font-semibold text-white hover:bg-[#c0353f]"
          : active
            ? "bg-white/10 font-semibold text-white"
            : "text-white/65 hover:bg-white/5 hover:text-white",
      )}
    >
      {active && !primary && (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#e0414c]" />
      )}
      <span className="relative grid size-6 shrink-0 place-items-center">
        {icon}
        {!!badge && !open && (
          <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-[#171a18] bg-[#e0414c]" />
        )}
      </span>
      <SidebarLabel className="transition group-hover/sidebar:translate-x-0.5">
        {label}
      </SidebarLabel>
      {!!badge && open && (
        <span className="ml-auto rounded-full bg-[#e0414c] px-2 py-0.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
