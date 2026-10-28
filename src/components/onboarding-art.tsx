// Illustrations for the onboarding tour: small mock interfaces in UT colours.
// Each one fills the 230px art panel of OnboardingDialog.

import { Icon } from "./ui/icon"

export function WelcomeArt() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#c4343f_0%,#a92d35_45%,#5e161c_100%)]">
      {[150, 210, 270, 330].map((size, i) => (
        <span
          key={size}
          className="deimos-ripple absolute left-1/2 top-1/2 rounded-full border border-white/25"
          style={{ width: size, height: size, animationDelay: `${i * 0.12}s`, opacity: 0.7 - i * 0.15 }}
        />
      ))}
      <div className="deimos-float relative grid size-[118px] place-items-center rounded-full bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <img src="/brand/ut-spartans-seal.png" alt="" className="size-[104px] object-contain" />
      </div>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-white backdrop-blur">
        DEIMOS
      </span>
    </div>
  )
}

export function ExploreArt() {
  const cards = [
    { tone: "bg-[#e7efeb]", label: "AI / ML", rotate: "-rotate-6", x: "left-[14%]" },
    { tone: "bg-[#e8eff3]", label: "Mobile", rotate: "rotate-0", x: "left-[37%]" },
    { tone: "bg-[#f1e8e8]", label: "Security", rotate: "rotate-6", x: "left-[60%]" },
  ]
  return (
    <div className="relative size-full overflow-hidden bg-[#f4f1ea]">
      <div className="absolute left-1/2 top-6 flex w-[78%] -translate-x-1/2 items-center gap-2 rounded-full border border-[#d9d7d0] bg-white px-4 py-2.5 shadow-sm">
        <Icon name="search" size={16} className="text-[#777873]" />
        <span className="text-sm text-[#171a18]">react</span>
        <span className="deimos-caret h-4 w-px bg-[#a92d35]" />
        <span className="ml-auto rounded-full bg-[#a92d35] px-2 py-0.5 text-[10px] font-bold text-white">
          12 results
        </span>
      </div>
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`deimos-rise absolute top-[88px] ${card.x} w-[26%] ${card.rotate} rounded-lg border border-[#d9d7d0] bg-white p-2.5 shadow-[0_10px_24px_rgba(23,26,24,0.12)]`}
          style={{ animationDelay: `${0.1 + i * 0.1}s` }}
        >
          <div className={`h-10 rounded ${card.tone}`} />
          <p className="mt-2 text-[10px] font-bold text-[#171a18]">{card.label}</p>
          <div className="mt-1 h-1.5 w-4/5 rounded bg-[#e5e2db]" />
          <div className="mt-1 h-1.5 w-3/5 rounded bg-[#e5e2db]" />
        </div>
      ))}
    </div>
  )
}

export function SubmitArt() {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-[linear-gradient(135deg,#f4f1ea,#ece6db)]">
      <div className="deimos-rise w-[76%] rounded-xl border border-[#d9d7d0] bg-white p-4 shadow-[0_14px_30px_rgba(23,26,24,0.12)]">
        <p className="text-[11px] font-bold text-[#171a18]">Submit your capstone</p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-[#d9d7d0] px-2.5 py-2 text-[11px] text-[#5b5d59]">
          <Icon name="github" size={14} />
          github.com/team-localhost/deimos
          <Icon name="check" size={14} className="ml-auto text-[#347153]" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="grid h-12 place-items-center rounded-md bg-[#efeee8] text-[#9a9b96]">
              <Icon name="image" size={16} />
            </div>
          ))}
          <div className="grid h-12 place-items-center rounded-md border border-dashed border-[#a92d35]/50 text-[#a92d35]">
            <Icon name="upload" size={16} />
          </div>
        </div>
        <div className="mt-3 flex h-8 items-center justify-center rounded-md bg-[#a92d35] text-[11px] font-semibold text-white">
          Send for faculty review
        </div>
      </div>
    </div>
  )
}

export function StatusArt() {
  const stages = [
    { label: "Submitted", state: "done" },
    { label: "Faculty review", state: "active" },
    { label: "Published", state: "todo" },
  ]
  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-6 overflow-hidden bg-[#171a18] px-6">
      <div className="relative flex w-full max-w-[330px] items-start justify-between">
        <span className="absolute left-[16%] right-[16%] top-4 h-0.5 bg-white/15" />
        <span className="deimos-grow absolute left-[16%] top-4 h-0.5 w-[34%] origin-left bg-[#e0414c]" />
        {stages.map((stage) => (
          <div key={stage.label} className="relative z-10 flex w-1/3 flex-col items-center gap-2">
            <span
              className={`grid size-8 place-items-center rounded-full border-2 ${
                stage.state === "done"
                  ? "border-[#e0414c] bg-[#e0414c] text-white"
                  : stage.state === "active"
                    ? "deimos-pulse border-[#e0414c] bg-[#171a18] text-[#e0414c]"
                    : "border-white/20 bg-[#171a18] text-white/30"
              }`}
            >
              <Icon name={stage.state === "done" ? "check" : stage.state === "active" ? "clock" : "archive"} size={15} />
            </span>
            <span className={`text-center text-[11px] font-semibold ${stage.state === "todo" ? "text-white/35" : "text-white"}`}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>
      <div className="deimos-rise flex w-full max-w-[300px] items-center gap-3 rounded-lg bg-white/[0.06] p-3 ring-1 ring-white/10">
        <span className="grid size-8 place-items-center rounded-md bg-[#f5edda] text-[#866420]">
          <Icon name="edit" size={15} />
        </span>
        <span className="text-[11px] leading-4 text-white/70">
          <strong className="block text-white">Changes requested</strong>
          “Add a README with setup steps.”
        </span>
      </div>
    </div>
  )
}

export function DiscoverArt() {
  const nodes = [
    { label: "React", x: "left-[12%]", y: "top-[18%]", score: "92%" },
    { label: "Python", x: "right-[10%]", y: "top-[14%]", score: "87%" },
    { label: "Supabase", x: "left-[8%]", y: "bottom-[16%]", score: "81%" },
    { label: "ML", x: "right-[12%]", y: "bottom-[18%]", score: "76%" },
  ]
  return (
    <div className="relative size-full overflow-hidden bg-[radial-gradient(circle_at_center,#fffefa,#ece6db)]">
      <svg className="absolute inset-0 size-full" aria-hidden="true">
        {[
          ["50%", "50%", "22%", "24%"],
          ["50%", "50%", "78%", "20%"],
          ["50%", "50%", "18%", "78%"],
          ["50%", "50%", "80%", "76%"],
        ].map(([x1, y1, x2, y2]) => (
          <line key={x2 + y2} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a92d35" strokeOpacity="0.35" strokeDasharray="4 5" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-[#a92d35] text-white shadow-[0_14px_30px_rgba(169,45,53,0.4)]">
        <Icon name="spark" size={30} />
      </div>
      {nodes.map((node, i) => (
        <div
          key={node.label}
          className={`deimos-rise absolute ${node.x} ${node.y} flex items-center gap-1.5 rounded-full border border-[#d9d7d0] bg-white py-1 pl-1 pr-2.5 shadow-sm`}
          style={{ animationDelay: `${0.1 + i * 0.08}s` }}
        >
          <span className="rounded-full bg-[#e8f1ea] px-1.5 py-0.5 text-[10px] font-bold text-[#347153]">
            {node.score}
          </span>
          <span className="text-[11px] font-semibold text-[#171a18]">{node.label}</span>
        </div>
      ))}
    </div>
  )
}

export function ReviewArt() {
  const rows = [
    { name: "Library SeatSense", who: "Maya P.", tone: "bg-[#f5edda] text-[#866420]", status: "New" },
    { name: "Riverwalk AR", who: "Nico S.", tone: "bg-[#e9f0f4] text-[#355f72]", status: "Updated" },
    { name: "Transit Lens", who: "Leah M.", tone: "bg-[#f5edda] text-[#866420]", status: "New" },
  ]
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-[linear-gradient(135deg,#f4f1ea,#ece6db)]">
      <div className="w-[80%] space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.name}
            className="deimos-rise flex items-center gap-3 rounded-lg border border-[#d9d7d0] bg-white p-2.5 shadow-sm"
            style={{ animationDelay: `${0.05 + i * 0.08}s` }}
          >
            <span className="grid size-7 place-items-center rounded-full bg-[#171a18] text-[10px] font-bold text-white">
              {row.who.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1 text-[11px] leading-4">
              <strong className="block truncate text-[#171a18]">{row.name}</strong>
              <span className="text-[#777873]">{row.who}</span>
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.tone}`}>{row.status}</span>
            {i === 0 && (
              <span className="grid size-7 place-items-center rounded-md bg-[#347153] text-white">
                <Icon name="check" size={14} />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function UsersArt() {
  const users = [
    { email: "rgarcia@ut.edu", role: "Faculty", tone: "bg-[#e9f0f4] text-[#355f72]" },
    { email: "mpatel@spartans.ut.edu", role: "Student", tone: "bg-[#f8e9e9] text-[#a92d35]" },
    { email: "admin@ut.edu", role: "Admin", tone: "bg-[#171a18] text-white" },
  ]
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-[#171a18]">
      <div className="w-[82%] rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-2 text-[11px] text-white/60">
          <Icon name="mail" size={14} /> Add a university email…
          <span className="ml-auto rounded bg-[#a92d35] px-2 py-0.5 text-[10px] font-bold text-white">Add</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {users.map((user, i) => (
            <div
              key={user.email}
              className="deimos-rise flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] text-white/80"
              style={{ animationDelay: `${0.05 + i * 0.08}s` }}
            >
              {user.email}
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${user.tone}`}>{user.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
