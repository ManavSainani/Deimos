// Animated sign-in building blocks for the Deimos landing screen.
// Adapted from the 21st.dev "modern-animated-sign-in" component for this
// Vite + Tailwind v4 app: no Next.js, no motion/lucide dependencies.
// The keyframes live in src/index.css (search for "Animated sign-in").

import {
  CSSProperties,
  forwardRef,
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
  useState,
} from "react"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

// ==================== BoxReveal ====================
// A UT-red block sweeps across while the content slides up into place.

export function BoxReveal({
  children,
  delay = 0,
  duration = 0.4,
  boxColor = "#a92d35",
  full = false,
  className,
}: {
  children: ReactNode
  delay?: number
  duration?: number
  boxColor?: string
  full?: boolean
  className?: string
}) {
  return (
    <div
      className={cx("deimos-reveal relative overflow-hidden", full ? "w-full" : "w-fit", className)}
      style={
        {
          "--reveal-delay": `${delay}s`,
          "--reveal-duration": `${duration}s`,
        } as CSSProperties
      }
    >
      <div className="deimos-reveal-content">{children}</div>
      <span
        aria-hidden="true"
        className="deimos-reveal-box pointer-events-none absolute inset-y-1 left-0 right-0 z-20 rounded"
        style={{ background: boxColor }}
      />
    </div>
  )
}

// ==================== SpotlightInput ====================
// Input whose border glows UT red around the cursor.

type SpotlightInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode
  trailing?: ReactNode
}

export const SpotlightInput = forwardRef<HTMLInputElement, SpotlightInputProps>(
  function SpotlightInput({ className, icon, trailing, ...props }, ref) {
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const [hover, setHover] = useState(false)

    const onMove = (event: MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    }

    return (
      <div
        onMouseMove={onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="rounded-lg p-[2px] transition duration-300"
        style={{
          background: `radial-gradient(${hover ? 110 : 0}px circle at ${pos.x}px ${pos.y}px, #a92d35, transparent 80%)`,
        }}
      >
        <div className="flex h-12 items-center gap-3 rounded-md bg-[#f7f5f0] px-4 shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),0_0_0_1px_rgba(23,26,24,0.08)] transition focus-within:bg-white focus-within:shadow-[0_0_0_2px_#a92d35]">
          {icon && <span className="shrink-0 text-[#777873]">{icon}</span>}
          <input
            ref={ref}
            className={cx(
              "h-full w-full bg-transparent text-sm text-[#171a18] outline-none placeholder:text-[#9a9b96] focus-visible:outline-none",
              className,
            )}
            {...props}
          />
          {trailing}
        </div>
      </div>
    )
  },
)

// ==================== BottomGradient ====================
// Gold/red shimmer along the bottom edge of a button on hover.

export function BottomGradient() {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-[#f2c14e] to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  )
}

// ==================== Ripple ====================
// Concentric pulsing rings behind the centre logo.

export function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 9,
  className,
}: {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_center,black_35%,transparent_75%)]",
        className,
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => (
        <span
          key={i}
          className="deimos-ripple absolute left-1/2 top-1/2 rounded-full border bg-[#a92d35]/[0.06]"
          style={{
            width: mainCircleSize + i * 70,
            height: mainCircleSize + i * 70,
            opacity: Math.max(mainCircleOpacity - i * 0.025, 0.03),
            animationDelay: `${i * 0.06}s`,
            borderStyle: i === numCircles - 1 ? "dashed" : "solid",
            borderColor: `rgba(169, 45, 53, ${0.25 + i * 0.05})`,
          }}
        />
      ))}
    </div>
  )
}

// ==================== OrbitingCircles ====================

export function OrbitingCircles({
  children,
  className,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: {
  children: ReactNode
  className?: string
  reverse?: boolean
  duration?: number
  delay?: number
  radius?: number
  path?: boolean
}) {
  return (
    <>
      {path && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="rgba(23, 26, 24, 0.12)"
            strokeDasharray="4 6"
          />
        </svg>
      )}
      <div
        className={cx(
          "deimos-orbit absolute left-1/2 top-1/2 flex items-center justify-center rounded-full",
          className,
        )}
        style={
          {
            "--duration": duration,
            "--radius": radius,
            animationDelay: `${-delay}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {children}
      </div>
    </>
  )
}

// ==================== OrbitDisplay ====================
// Centre logo surrounded by orbiting icons.

export type OrbitIcon = {
  key: string
  node: ReactNode
  className?: string
  duration?: number
  delay?: number
  radius?: number
  path?: boolean
  reverse?: boolean
}

export function OrbitDisplay({
  center,
  icons,
}: {
  center: ReactNode
  icons: OrbitIcon[]
}) {
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden">
      <div className="relative z-10">{center}</div>
      {icons.map(({ key, node, ...orbit }) => (
        <OrbitingCircles key={key} {...orbit}>
          {node}
        </OrbitingCircles>
      ))}
    </div>
  )
}
