import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import {
  getApprovedProjects,
  getAuthorizedUsers,
  getMySubmissions,
  getProfileRole,
  getReviewQueue,
  reviewProject,
  addAuthorizedUser,
  removeAuthorizedUser,
  submitProject,
  type ArchiveProjectRow,
  type AuthorizedUser,
  type ProjectSubmission,
  type ReviewQueueRow,
  type SubmissionRow,
} from "./lib/archive"
import { supabase } from "./lib/supabase"
import {
  BottomGradient,
  BoxReveal,
  OrbitDisplay,
  Ripple,
  SpotlightInput,
  type OrbitIcon,
} from "./components/ui/animated-sign-in"
import { Icon } from "./components/ui/icon"
import {
  OnboardingDialog,
  type OnboardingStep,
} from "./components/ui/onboarding-dialog"
import { Sidebar, SidebarLabel, SidebarLink, SidebarSection } from "./components/ui/sidebar"
import {
  DiscoverArt,
  ExploreArt,
  ReviewArt,
  StatusArt,
  SubmitArt,
  UsersArt,
  WelcomeArt,
} from "./components/onboarding-art"

type Role = "student" | "faculty" | "admin" | "guest"
type View =
  | "projects"
  | "submissions"
  | "review"
  | "users"
  | "archive"
  | "profile"
interface NavigationLink {
  label: string
  value: View
}
type SubmissionStatus = "In review" | "Changes requested" | "Approved" | "Rejected" | "Archived"

type SubmissionItem = {
  id?: string
  title: string
  updated: string
  status: SubmissionStatus
  note: string
}

type Project = {
  id?: string
  title: string
  category: string
  term: string
  year: number
  description: string
  team: string
  tags: string[]
  access: string
  repositoryUrl?: string | null
  cardImageUrl?: string | null
  additionalMedia?: { url: string; type: "image" | "video" }[]
}

type ReviewItem = {
  id: string
  student: string
  project: string
  type: string
  submitted: string
  status: "pending_review" | "changes_requested"
}

function toProject(row: ArchiveProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    term: row.term,
    year: row.academic_year,
    description: row.description,
    team: row.team_members.join(", "),
    tags: row.technologies,
    access: row.repository_access,
    repositoryUrl: row.repository_url,
    cardImageUrl: row.card_image_url,
    additionalMedia: row.additional_media ?? [],
  }
}

const projects: Project[] = [
  {
    title: "HarborWatch: Tampa Bay Water Intelligence",
    category: "AI / Machine Learning",
    term: "Spring",
    year: 2026,
    description:
      "A public dashboard combining buoy telemetry and predictive models to surface local water-quality risks for researchers and coastal communities.",
    team: "Maya Patel, Jonah Reed, Elise Tran",
    tags: ["Python", "React", "TensorFlow"],
    access: "Public repository",
  },
  {
    title: "Campus Compass",
    category: "Mobile Application",
    term: "Spring",
    year: 2026,
    description:
      "An accessible mobile wayfinding companion that helps students navigate buildings, services, and live campus events.",
    team: "Avery Collins, Nico Santos, Priya Shah",
    tags: ["Swift", "MapKit", "Firebase"],
    access: "Public repository",
  },
  {
    title: "Sentinel Lab",
    category: "Cybersecurity",
    term: "Fall",
    year: 2026,
    description:
      "An isolated cyber range for practicing incident response with guided scenarios, evidence capture, and faculty review.",
    team: "Darius King, Leah Morgan",
    tags: ["Go", "Docker", "Suricata"],
    access: "University access",
  },
  {
    title: "Spartan Studio Exchange",
    category: "Web Application",
    term: "Fall",
    year: 2025,
    description:
      "A peer marketplace for creative students to share equipment, book studio time, and collaborate across disciplines.",
    team: "Sofia Nguyen, Ethan Brooks, Amir Bell",
    tags: ["TypeScript", "Next.js", "PostgreSQL"],
    access: "Public repository",
  },
  {
    title: "EmberSense",
    category: "Hardware / Embedded Systems",
    term: "Spring",
    year: 2025,
    description:
      "A low-power sensor network and visualization toolkit for monitoring heat and humidity in campus maker spaces.",
    team: "Riley Chen, Marcus Hill",
    tags: ["C++", "ESP32", "Grafana"],
    access: "Public repository",
  },
]

const submissions: SubmissionItem[] = [
  {
    title: "Library SeatSense",
    updated: "Updated April 18, 2026",
    status: "In review",
    note: "Submitted for faculty review",
  },
  {
    title: "Riverwalk AR Stories",
    updated: "Updated April 12, 2026",
    status: "Changes requested",
    note: "Repository access needs to be updated",
  },
  {
    title: "Tampa Transit Lens",
    updated: "Approved March 28, 2026",
    status: "Approved",
    note: "Published to the 2026 archive",
  },
]

function toSubmission(row: SubmissionRow): SubmissionItem {
  const status: Record<SubmissionRow["status"], SubmissionStatus> = {
    pending_review: "In review",
    changes_requested: "Changes requested",
    approved: "Approved",
    rejected: "Rejected",
    archived: "Archived",
  }
  return {
    id: row.id,
    title: row.title,
    updated: `Submitted ${new Date(row.created_at).toLocaleDateString()}`,
    status: status[row.status],
    note:
      row.review_note ||
      {
        pending_review: "Submitted for faculty review",
        changes_requested: "Faculty requested changes",
        approved: "Published to the archive",
        rejected: "Not approved for the archive",
        archived: "This project is archived",
      }[row.status],
  }
}

const reviewItems: ReviewItem[] = [
  {
    id: "demo-1",
    student: "Maya Patel",
    project: "Library SeatSense",
    type: "Web Application",
    submitted: "2 hours ago",
    status: "pending_review",
  },
  {
    id: "demo-2",
    student: "Noah Williams",
    project: "Bayshore Flood Mapper",
    type: "Data Visualization",
    submitted: "Yesterday",
    status: "pending_review",
  },
  {
    id: "demo-3",
    student: "Isabella Garcia",
    project: "Accessible UT",
    type: "Mobile Application",
    submitted: "April 17",
    status: "pending_review",
  },
]

function toReviewItem(row: ReviewQueueRow): ReviewItem {
  return {
    id: row.id,
    student: "Student team",
    project: row.title,
    type: row.category,
    submitted: new Date(row.created_at).toLocaleDateString(),
    status: row.status,
  }
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: string
}) {
  const styles: Record<string, string> = {
    neutral: "bg-[#efeee8] text-[#343735]",
    red: "bg-[#f8e9e9] text-[#a92d35]",
    green: "bg-[#e8f1ea] text-[#347153]",
    blue: "bg-[#e9f0f4] text-[#355f72]",
    amber: "bg-[#f5edda] text-[#866420]",
  }
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  )
}

function personFor(role: Role) {
  return role === "student"
    ? { name: "Sample Student", initials: "SS" }
    : role === "faculty"
      ? { name: "Dr. Elena Ruiz", initials: "ER" }
      : role === "admin"
        ? { name: "Archive admin", initials: "AD" }
        : { name: "Guest visitor", initials: "G" }
}

function SidebarBrand() {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 px-1.5">
      <img
        src="/brand/ut-spartans-seal.png"
        alt=""
        className="size-10 shrink-0 rounded-full bg-white object-contain p-0.5"
      />
      <SidebarLabel className="leading-tight">
        <strong className="block text-base tracking-tight">DEIMOS</strong>
        <span className="block text-[10px] tracking-wide text-white/45">
          THE UNIVERSITY OF TAMPA
        </span>
      </SidebarLabel>
    </div>
  )
}

function AppSidebar({
  role,
  view,
  onView,
  onSubmit,
  onSignOut,
  onTour,
  reviewCount,
  actionCount,
}: {
  role: Role
  view: View
  onView: (view: View) => void
  onSubmit: () => void
  onSignOut: () => void
  onTour: () => void
  reviewCount: number
  actionCount: number
}) {
  const person = personFor(role)
  const links: (NavigationLink & { icon: string; badge?: number })[] =
    role === "student"
      ? [
          { label: "Dashboard", value: "projects", icon: "home" },
          {
            label: "My submissions",
            value: "submissions",
            icon: "inbox",
            badge: actionCount,
          },
          { label: "About the archive", value: "archive", icon: "archive" },
          { label: "Profile", value: "profile", icon: "user" },
        ]
      : role === "guest"
        ? [
            { label: "Home", value: "projects", icon: "home" },
            { label: "About the archive", value: "archive", icon: "archive" },
          ]
        : role === "admin"
          ? [
              { label: "Dashboard", value: "projects", icon: "home" },
              { label: "Authorized users", value: "users", icon: "users" },
              { label: "Archive", value: "archive", icon: "archive" },
              { label: "Profile", value: "profile", icon: "user" },
            ]
          : [
              { label: "Dashboard", value: "projects", icon: "home" },
              {
                label: "Review queue",
                value: "review",
                icon: "inbox",
                badge: reviewCount,
              },
              { label: "Archive", value: "archive", icon: "archive" },
              { label: "Profile", value: "profile", icon: "user" },
            ]

  return (
    <Sidebar
      mobileBrand={
        <div className="flex items-center gap-3">
          <img
            src="/brand/ut-spartans-seal.png"
            alt=""
            className="size-9 rounded-full bg-white object-contain p-0.5"
          />
          <strong className="tracking-tight">DEIMOS</strong>
        </div>
      }
    >
      <SidebarBrand />
      {role === "student" && (
        <div className="mt-6">
          <SidebarLink
            variant="primary"
            label="Submit project"
            icon={<Icon name="plus" size={20} />}
            onClick={onSubmit}
          />
        </div>
      )}
      <nav className="mt-6 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarSection title="Menu">
          {links.map((link) => (
            <SidebarLink
              key={link.value}
              label={link.label}
              icon={<Icon name={link.icon} size={20} />}
              active={view === link.value}
              badge={link.badge}
              onClick={() => onView(link.value)}
            />
          ))}
        </SidebarSection>
      </nav>
      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        <SidebarLink
          label="Take the tour"
          icon={<Icon name="help" size={20} />}
          onClick={onTour}
        />
        <SidebarLink
          label="Sign out"
          icon={<Icon name="logout" size={20} />}
          onClick={onSignOut}
        />
        <div className="mt-2 flex h-12 items-center gap-3 px-1.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#a92d35] text-sm font-bold text-white ring-2 ring-white/10">
            {person.initials}
          </span>
          <SidebarLabel className="leading-tight">
            <strong className="block text-sm">{person.name}</strong>
            <span className="block text-xs capitalize text-white/45">
              {role}
            </span>
          </SidebarLabel>
        </div>
      </div>
    </Sidebar>
  )
}

const categoryTheme: Record<
  string,
  { icon: string; soft: string; accent: string }
> = {
  "AI / Machine Learning": {
    icon: "spark",
    soft: "bg-[#e7efeb] text-[#2f6b55]",
    accent: "#2f6b55",
  },
  "Mobile Application": {
    icon: "phone",
    soft: "bg-[#e8eff3] text-[#355f72]",
    accent: "#355f72",
  },
  Cybersecurity: {
    icon: "shield",
    soft: "bg-[#f4e6e6] text-[#a92d35]",
    accent: "#a92d35",
  },
  "Web Application": {
    icon: "globe",
    soft: "bg-[#f2efdf] text-[#866420]",
    accent: "#866420",
  },
  "Hardware / Embedded Systems": {
    icon: "chip",
    soft: "bg-[#ece9f1] text-[#5b4a86]",
    accent: "#5b4a86",
  },
}

const themeFor = (category: string) =>
  categoryTheme[category] ?? {
    icon: "folder",
    soft: "bg-[#efeee8] text-[#343735]",
    accent: "#343735",
  }

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

function ProjectCard({
  project,
  onOpen,
  faculty,
}: {
  project: Project
  onOpen: () => void
  faculty: boolean
}) {
  const theme = themeFor(project.category)
  const members = project.team
    .split(",")
    .map((member) => member.trim())
    .filter(Boolean)
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#e2dfd8] bg-[#fffefa] shadow-[0_1px_2px_rgba(24,26,24,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[#d0ccc3] hover:shadow-[0_18px_40px_rgba(24,26,24,0.10)]">
      <div className="relative h-32 overflow-hidden">
        {project.cardImageUrl ? (
          <img
            src={project.cardImageUrl}
            alt={`${project.title} cover`}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`relative size-full ${theme.soft}`}
            style={{
              backgroundImage: `radial-gradient(${theme.accent}22 1.2px, transparent 1.2px)`,
              backgroundSize: "14px 14px",
            }}
          >
            <span className="absolute -bottom-5 -right-3 opacity-[0.16] transition duration-500 group-hover:-rotate-6 group-hover:scale-110">
              <Icon name={theme.icon} size={120} />
            </span>
            <span className="absolute left-5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-xl bg-white/80 shadow-sm backdrop-blur">
              <Icon name={theme.icon} size={24} />
            </span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#343735] shadow-sm backdrop-blur">
          {project.term} {project.year}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.soft}`}
        >
          {project.category}
        </span>
        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug tracking-tight">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#70716d]">
          {project.description}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member, index) => (
              <span
                key={member}
                title={member}
                className="grid size-7 place-items-center rounded-full border-2 border-[#fffefa] text-[10px] font-bold text-white"
                style={{
                  background: ["#171a18", "#a92d35", "#5c5f5b"][index % 3],
                }}
              >
                {initialsOf(member)}
              </span>
            ))}
          </div>
          <span className="truncate text-xs text-[#5b5d59]">
            {project.team}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#f1efe9] px-2 py-1 text-[11px] font-medium text-[#5b5d59]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#ebe8e1] pt-4">
          <span className="flex items-center gap-1.5 text-xs text-[#347153]">
            <Icon name="github" size={15} />
            {project.access}
          </span>
          <button
            onClick={onOpen}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#a92d35] transition hover:bg-[#f8eeee]"
          >
            {faculty ? "Edit" : "Open"}
            <Icon name={faculty ? "edit" : "arrowRight"} size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

function StatTile({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: string
}) {
  return (
    <div className="rounded-2xl border border-[#e2dfd8] bg-[#fffefa] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#71726e]">{label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-[#f4f1ea] text-[#a92d35]">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <strong className="mt-3 block text-3xl font-semibold tracking-tight">
        {value}
      </strong>
      <span className="mt-0.5 block text-xs text-[#8a8b86]">{detail}</span>
    </div>
  )
}

const statusStyle: Record<
  SubmissionStatus,
  { tone: string; step: number }
> = {
  "In review": { tone: "bg-[#f5edda] text-[#866420]", step: 2 },
  "Changes requested": { tone: "bg-[#f8e9e9] text-[#a92d35]", step: 2 },
  Approved: { tone: "bg-[#e8f1ea] text-[#347153]", step: 3 },
  Rejected: { tone: "bg-[#efeee8] text-[#5b5d59]", step: 2 },
  Archived: { tone: "bg-[#efeee8] text-[#5b5d59]", step: 3 },
}

type HomeAction = { label: string; icon: string; onClick: () => void }
type HomeStep = {
  key: string
  label: string
  done: boolean
  action: () => void
}
type HomeHelpers = {
  trending: string[]
  onPickTech: (tech: string) => void
  scrollToExplore: () => void
}

const PAGE = "mx-auto max-w-[1360px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10"

function greetingNow() {
  const hour = new Date().getHours()
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a92d35]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[#71726e]">{description}</p>
      </div>
      {action}
    </div>
  )
}

function HomeCard({
  title,
  link,
  children,
}: {
  title: string
  link?: { label: string; onClick: () => void }
  children: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-[#e2dfd8] bg-[#fffefa] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {link && (
          <button
            onClick={link.onClick}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#a92d35] hover:underline"
          >
            {link.label} <Icon name="arrowRight" size={13} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyNote({
  icon,
  title,
  detail,
}: {
  icon: string
  title: string
  detail: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#f4f1ea] text-[#a92d35]">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[#71726e]">{detail}</p>
    </div>
  )
}

function RoleHome({
  eyebrow,
  title,
  subtitle,
  primary,
  secondary,
  trending,
  onPickTech,
  side,
  steps,
  checklistHidden,
  onDismissChecklist,
}: {
  eyebrow: string
  title: string
  subtitle: string
  primary: HomeAction
  secondary: HomeAction
  trending: string[]
  onPickTech: (tech: string) => void
  side: ReactNode
  steps: HomeStep[]
  checklistHidden: boolean
  onDismissChecklist: () => void
}) {
  const doneCount = steps.filter((step) => step.done).length
  return (
    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <div className="relative flex flex-col overflow-hidden rounded-3xl bg-[#171a18] p-7 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-16 top-1/2 hidden size-[340px] -translate-y-1/2 sm:block">
          {[180, 250, 320].map((size, i) => (
            <span
              key={size}
              className="deimos-ripple absolute left-1/2 top-1/2 rounded-full border border-white/10"
              style={{ width: size, height: size, animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <img
            src="/brand/ut-spartans-seal.png"
            alt=""
            className="deimos-float absolute left-1/2 top-1/2 size-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white object-contain p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          />
        </div>
        <div className="relative max-w-md">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e0414c]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/60">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={primary.onClick}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#a92d35] px-5 py-3 text-sm font-semibold shadow-[0_8px_20px_rgba(169,45,53,0.4)] transition hover:bg-[#c0353f]"
            >
              <Icon name={primary.icon} size={17} /> {primary.label}
            </button>
            <button
              onClick={secondary.onClick}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/15"
            >
              <Icon name={secondary.icon} size={17} /> {secondary.label}
            </button>
          </div>
        </div>
        {trending.length > 0 && (
          <div className="relative mt-8 border-t border-white/10 pt-5 xl:mt-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Trending in the archive
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trending.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onPickTech(tag)}
                  className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75 transition hover:border-[#e0414c] hover:bg-[#e0414c]/15 hover:text-white"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {side}

      {!checklistHidden && doneCount < steps.length && (
        <div className="rounded-3xl border border-[#e2dfd8] bg-[#fffefa] p-5 xl:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="md:w-64">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Getting started</p>
                <button
                  onClick={onDismissChecklist}
                  className="cursor-pointer text-xs font-semibold text-[#8a8b86] hover:text-[#171a18] md:hidden"
                >
                  Hide
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ebe8e1]">
                  <div
                    className="h-full rounded-full bg-[#a92d35] transition-[width] duration-500"
                    style={{ width: `${(doneCount / steps.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[#71726e]">
                  {doneCount}/{steps.length}
                </span>
              </div>
            </div>
            <div
              className={`grid flex-1 gap-2 ${
                steps.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
              }`}
            >
              {steps.map((step) => (
                <button
                  key={step.key}
                  onClick={step.action}
                  disabled={step.done}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${
                    step.done
                      ? "border-transparent bg-[#f4f1ea] text-[#8a8b86] line-through"
                      : "border-[#e2dfd8] hover:border-[#a92d35] hover:bg-[#fbf6f5]"
                  }`}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                      step.done
                        ? "border-[#347153] bg-[#347153] text-white"
                        : "border-[#b9b7b0]"
                    }`}
                  >
                    {step.done && <Icon name="check" size={12} />}
                  </span>
                  {step.label}
                </button>
              ))}
            </div>
            <button
              onClick={onDismissChecklist}
              aria-label="Hide the Getting started checklist"
              title="Hide checklist"
              className="hidden size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-[#8a8b86] transition hover:bg-[#f4f1ea] hover:text-[#171a18] md:grid"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SubmissionProgress({ status }: { status: SubmissionStatus }) {
  const style = statusStyle[status]
  return (
    <div className="grid grid-cols-3 gap-1">
      {[1, 2, 3].map((segment) => (
        <span
          key={segment}
          className={`h-1 rounded-full ${
            segment <= style.step
              ? status === "Changes requested" && segment === style.step
                ? "bg-[#e0414c]"
                : "bg-[#171a18]"
              : "bg-[#e5e2db]"
          }`}
        />
      ))}
    </div>
  )
}

function StudentSideCard({
  submissions,
  onViewAll,
}: {
  submissions: SubmissionItem[]
  onViewAll: () => void
}) {
  return (
    <HomeCard title="Your submissions" link={{ label: "View all", onClick: onViewAll }}>
      {submissions.length === 0 ? (
        <EmptyNote
          icon="upload"
          title="No submissions yet"
          detail="Your capstone will show up here once you submit it."
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {submissions.slice(0, 3).map((item) => (
            <li
              key={item.id ?? item.title}
              className="rounded-xl border border-[#ebe8e1] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="truncate text-sm">{item.title}</strong>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle[item.status].tone}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-2.5">
                <SubmissionProgress status={item.status} />
              </div>
              <p className="mt-2 truncate text-xs text-[#71726e]">{item.note}</p>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  )
}

function FacultySideCard({
  items,
  onOpenQueue,
}: {
  items: ReviewItem[]
  onOpenQueue: () => void
}) {
  return (
    <HomeCard
      title="Waiting for your review"
      link={{ label: "Open queue", onClick: onOpenQueue }}
    >
      {items.length === 0 ? (
        <EmptyNote
          icon="check"
          title="You're all caught up"
          detail="New student submissions will appear here."
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {items.slice(0, 3).map((item) => (
            <li key={item.id}>
              <button
                onClick={onOpenQueue}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#ebe8e1] p-3 text-left transition hover:border-[#a92d35] hover:bg-[#fbf6f5]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#171a18] text-xs font-bold text-white">
                  {initialsOf(item.student)}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{item.project}</strong>
                  <span className="block truncate text-xs text-[#71726e]">
                    {item.student} · {item.submitted}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.status === "changes_requested"
                      ? "bg-[#f8e9e9] text-[#a92d35]"
                      : "bg-[#f5edda] text-[#866420]"
                  }`}
                >
                  {item.status === "changes_requested" ? "Changes" : "New"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  )
}

function AdminSideCard({
  onUsers,
  onExplore,
  onTour,
}: {
  onUsers: () => void
  onExplore: () => void
  onTour: () => void
}) {
  const actions = [
    {
      icon: "users",
      title: "Authorize a new user",
      detail: "Give a student, faculty member or admin access.",
      onClick: onUsers,
    },
    {
      icon: "shield",
      title: "Review who has access",
      detail: "Change roles or remove access on the access list.",
      onClick: onUsers,
    },
    {
      icon: "grid",
      title: "Browse the archive",
      detail: "See what guests and students can view.",
      onClick: onExplore,
    },
    {
      icon: "help",
      title: "Replay the admin tour",
      detail: "A quick refresher on admin tools.",
      onClick: onTour,
    },
  ]
  return (
    <HomeCard title="Quick actions">
      <ul className="mt-4 space-y-2">
        {actions.map((action) => (
          <li key={action.title}>
            <button
              onClick={action.onClick}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#ebe8e1] p-3 text-left transition hover:border-[#a92d35] hover:bg-[#fbf6f5]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f4f1ea] text-[#a92d35]">
                <Icon name={action.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{action.title}</strong>
                <span className="block truncate text-xs text-[#71726e]">
                  {action.detail}
                </span>
              </span>
              <Icon
                name="arrowRight"
                size={15}
                className="text-[#b9b7b0] transition group-hover:translate-x-0.5 group-hover:text-[#a92d35]"
              />
            </button>
          </li>
        ))}
      </ul>
    </HomeCard>
  )
}

function GuestSideCard({
  project,
  onOpen,
  onSignIn,
}: {
  project?: Project
  onOpen: (project: Project) => void
  onSignIn: () => void
}) {
  const theme = project ? themeFor(project.category) : null
  return (
    <HomeCard title="Featured capstone">
      {project && theme ? (
        <div className="mt-4 flex flex-1 flex-col">
          <div
            className={`relative h-24 overflow-hidden rounded-xl ${theme.soft}`}
            style={{
              backgroundImage: `radial-gradient(${theme.accent}22 1.2px, transparent 1.2px)`,
              backgroundSize: "14px 14px",
            }}
          >
            <span className="absolute -bottom-4 -right-2 opacity-[0.16]">
              <Icon name={theme.icon} size={96} />
            </span>
            <span className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl bg-white/80 shadow-sm">
              <Icon name={theme.icon} size={20} />
            </span>
          </div>
          <p className="mt-3 text-[11px] font-semibold text-[#71726e]">
            {project.category} · {project.term} {project.year}
          </p>
          <strong className="mt-1 text-base leading-snug">{project.title}</strong>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#71726e]">
            {project.description}
          </p>
          <div className="mt-auto flex gap-2 pt-4">
            <button
              onClick={() => onOpen(project)}
              className="flex-1 cursor-pointer rounded-xl bg-[#171a18] py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              Open project
            </button>
            <button
              onClick={onSignIn}
              className="flex-1 cursor-pointer rounded-xl border border-[#e2dfd8] py-2.5 text-sm font-semibold hover:bg-[#f4f1ea]"
            >
              Sign in
            </button>
          </div>
        </div>
      ) : (
        <EmptyNote
          icon="folder"
          title="No approved projects yet"
          detail="Approved capstones will appear here."
        />
      )}
    </HomeCard>
  )
}

function ProjectsView({
  role,
  projects: archiveProjects,
  loadError,
  onOpen,
  home,
}: {
  role: Role
  projects: Project[]
  loadError: string
  onOpen: (project: Project) => void
  home?: (helpers: HomeHelpers) => ReactNode
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [year, setYear] = useState("All years")
  const [tech, setTech] = useState("All technologies")

  const technologies = useMemo(
    () =>
      [...new Set(archiveProjects.flatMap((project) => project.tags))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [archiveProjects],
  )
  const trending = useMemo(() => {
    const counts = new Map<string, number>()
    archiveProjects.forEach((project) =>
      project.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
    )
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([tag]) => tag)
  }, [archiveProjects])
  const allYears = useMemo(
    () =>
      [...new Set(archiveProjects.map((project) => project.year))].sort(
        (a, b) => b - a,
      ),
    [archiveProjects],
  )
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    archiveProjects.forEach((project) =>
      counts.set(project.category, (counts.get(project.category) ?? 0) + 1),
    )
    return [...counts.entries()]
  }, [archiveProjects])

  const filtered = useMemo(
    () =>
      archiveProjects.filter(
        (project) =>
          (!query ||
            `${project.title} ${project.team} ${project.description} ${project.tags.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (category === "All" || project.category === category) &&
          (tech === "All technologies" || project.tags.includes(tech)) &&
          (year === "All years" || String(project.year) === year),
      ),
    [archiveProjects, query, category, tech, year],
  )

  const years = [...new Set(filtered.map((project) => project.year))].sort(
    (a, b) => b - a,
  )
  const filtersActive =
    query !== "" ||
    category !== "All" ||
    tech !== "All technologies" ||
    year !== "All years"
  const clearFilters = () => {
    setQuery("")
    setCategory("All")
    setTech("All technologies")
    setYear("All years")
  }
  const scrollToExplore = () =>
    document
      .getElementById("explore")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <main className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      {home ? (
        home({
          trending,
          onPickTech: (tag) => {
            setTech(tag)
            scrollToExplore()
          },
          scrollToExplore,
        })
      ) : (
        <PageHeader
          eyebrow="Capstone archive"
          title="Explore approved projects"
          description="Discover teams, technologies, and ideas from across the University of Tampa."
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Approved projects"
          value={archiveProjects.length}
          detail="In the public archive"
          icon="folder"
        />
        <StatTile
          label="Technologies"
          value={technologies.length}
          detail="Languages, frameworks & tools"
          icon="chip"
        />
        <StatTile
          label="Academic years"
          value={allYears.length}
          detail={
            allYears.length
              ? `${allYears[allYears.length - 1]} – ${allYears[0]}`
              : "No projects yet"
          }
          icon="clock"
        />
        <StatTile
          label="Project types"
          value={categories.length}
          detail="From AI to embedded systems"
          icon="grid"
        />
      </div>

      <section id="explore" className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a92d35]">
              Capstone archive
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {role === "faculty" ? "Curate the archive" : "Explore approved projects"}
            </h2>
          </div>
          <p className="text-sm text-[#71726e]">
            Showing {filtered.length} of {archiveProjects.length}
          </p>
        </div>

        <div className="sticky top-16 z-30 mt-5 rounded-2xl border border-[#e2dfd8] bg-[#fffefa]/95 p-3 shadow-[0_8px_24px_rgba(24,26,24,0.06)] backdrop-blur lg:top-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-[#f4f1ea] px-4 transition focus-within:bg-white focus-within:shadow-[0_0_0_2px_#a92d35]">
              <Icon name="search" className="text-[#777873]" />
              <span className="sr-only">Search projects</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-[#8a8b86] focus-visible:outline-none"
                placeholder="Search titles, teams, topics, or technologies"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="cursor-pointer text-[#8a8b86] hover:text-[#171a18]"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2 md:flex">
              <select
                aria-label="Technology"
                value={tech}
                onChange={(event) => setTech(event.target.value)}
                className="h-12 cursor-pointer rounded-xl border border-[#e2dfd8] bg-white px-3 text-sm md:w-48"
              >
                <option>All technologies</option>
                {technologies.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                aria-label="Academic year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="h-12 cursor-pointer rounded-xl border border-[#e2dfd8] bg-white px-3 text-sm md:w-36"
              >
                <option>All years</option>
                {allYears.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5">
              {[["All", archiveProjects.length] as [string, number], ...categories].map(
                ([item, count]) => {
                  const active = category === item
                  return (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      aria-pressed={active}
                      className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "bg-[#171a18] text-white"
                          : "bg-[#f4f1ea] text-[#5b5d59] hover:bg-[#ebe8e1]"
                      }`}
                    >
                      {item !== "All" && (
                        <Icon name={themeFor(item).icon} size={13} />
                      )}
                      {item}
                      <span className={active ? "text-white/50" : "text-[#9a9b96]"}>
                        {count}
                      </span>
                    </button>
                  )
                },
              )}
            </div>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#a92d35]"
              >
                <Icon name="refresh" size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {loadError && (
          <p className="mt-6 rounded-xl border border-[#e6c6c6] bg-[#fbefef] p-4 text-sm text-[#8f252d]">
            Could not load approved projects: {loadError}
          </p>
        )}

        {years.map((groupYear) => {
          const group = filtered.filter((project) => project.year === groupYear)
          return (
            <section key={groupYear} className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {groupYear}
                </h3>
                <span className="rounded-full bg-[#ebe8e1] px-2.5 py-0.5 text-xs font-semibold text-[#5b5d59]">
                  {group.length} {group.length === 1 ? "project" : "projects"}
                </span>
                <span className="h-px flex-1 bg-[#e2dfd8]" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {group.map((project) => (
                  <ProjectCard
                    faculty={role === "faculty"}
                    key={project.id ?? project.title}
                    project={project}
                    onOpen={() => onOpen(project)}
                  />
                ))}
              </div>
            </section>
          )
        })}
        {filtered.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-[#d6d3cb] px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#ebe8e1] text-[#5b5d59]">
              <Icon name="search" size={22} />
            </span>
            <p className="mt-4 text-lg font-semibold">
              {archiveProjects.length
                ? "No projects match those filters."
                : "No approved projects yet."}
            </p>
            <p className="mt-1 text-sm text-[#71726e]">
              {archiveProjects.length
                ? "Try a broader keyword or clear the filters."
                : "Approved capstones will appear here."}
            </p>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="mt-5 cursor-pointer rounded-xl bg-[#171a18] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function tourStepsFor(role: Role): OnboardingStep[] {
  const welcome: OnboardingStep = {
    eyebrow: "Welcome",
    title: "Welcome to Deimos",
    description:
      "The University of Tampa's home for computer science capstones: every approved project, its team, and its code, all in one place.",
    art: <WelcomeArt />,
  }
  const explore: OnboardingStep = {
    title: "Explore past capstones",
    description:
      "Search by keyword, then narrow by technology, project type, or year to see what earlier Spartans built and how they built it.",
    art: <ExploreArt />,
  }
  const discover: OnboardingStep = {
    title: "Find similar projects",
    description:
      "Deimos reads each repository's stack and description to suggest related capstones, so you can learn from teams who tackled similar problems.",
    art: <DiscoverArt />,
  }
  if (role === "faculty") {
    return [
      welcome,
      {
        title: "Your review queue",
        description:
          "New student submissions land in the review queue. Approve them for the public archive or request changes with a note.",
        art: <ReviewArt />,
      },
      {
        title: "Curate the archive",
        description:
          "Edit any approved project to fix details, update its repository link, or improve how it appears to future students.",
        art: <ExploreArt />,
      },
      discover,
    ]
  }
  if (role === "admin") {
    return [
      welcome,
      {
        title: "Manage who gets in",
        description:
          "Add or remove university emails and choose whether each person is a student, faculty member, or admin.",
        art: <UsersArt />,
      },
      explore,
    ]
  }
  if (role === "guest") {
    return [
      welcome,
      explore,
      {
        title: "Browsing as a guest",
        description:
          "Guest access is read-only. Sign in with your UT account to submit a capstone or track your team's review status.",
        art: <DiscoverArt />,
      },
    ]
  }
  return [
    welcome,
    explore,
    {
      title: "Submit your capstone",
      description:
        "Add your GitHub repository, a description, and screenshots or a demo video. Your project goes to faculty for review.",
      art: <SubmitArt />,
    },
    {
      title: "Track your review",
      description:
        "Follow your submission from review to published. If faculty request changes, you'll see their note right on your dashboard.",
      art: <StatusArt />,
    },
    discover,
  ]
}

function SubmissionsView({
  items,
  loadError,
  onSubmit,
}: {
  items: SubmissionItem[]
  loadError: string
  onSubmit: () => void
}) {
  return (
    <main className={PAGE}>
      <PageHeader
        eyebrow="Student workspace"
        title="My submissions"
        description="Track faculty feedback and keep your project record up to date."
        action={
          <button
            onClick={onSubmit}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#a92d35] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(169,45,53,0.25)] transition hover:bg-[#8f252d]"
          >
            <Icon name="plus" size={17} /> New submission
          </button>
        }
      />
      {loadError && (
        <p className="mt-6 rounded-xl bg-[#fbefef] p-3 text-sm text-[#8f252d]">
          Could not load your submissions: {loadError}
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Total submissions"
          value={items.length}
          detail="Everything you've sent for review"
          icon="folder"
        />
        <StatTile
          label="Awaiting review"
          value={items.filter((item) => item.status === "In review").length}
          detail="Usually reviewed in 3–5 days"
          icon="clock"
        />
        <StatTile
          label="Published"
          value={items.filter((item) => item.status === "Approved").length}
          detail="Visible in the project archive"
          icon="check"
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Recent submissions</h2>
        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d6d3cb] px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#ebe8e1] text-[#a92d35]">
              <Icon name="upload" size={22} />
            </span>
            <p className="mt-4 text-lg font-semibold">
              You haven't submitted a project yet
            </p>
            <p className="mt-1 text-sm text-[#71726e]">
              Add your repository, description and media to send it for review.
            </p>
            <button
              onClick={onSubmit}
              className="mt-5 cursor-pointer rounded-xl bg-[#a92d35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f252d]"
            >
              Submit your capstone
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <article
                key={item.id ?? item.title}
                className="grid gap-4 rounded-2xl border border-[#e2dfd8] bg-[#fffefa] p-5 transition hover:shadow-[0_10px_30px_rgba(24,26,24,0.06)] md:grid-cols-[1.2fr_1fr_104px] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate text-base">{item.title}</strong>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle[item.status].tone}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-[#8a8b86]">
                    {item.updated}
                  </span>
                </div>
                <div>
                  <SubmissionProgress status={item.status} />
                  <div className="mt-1.5 grid grid-cols-3 text-[10px] font-medium text-[#9a9b96]">
                    <span>Submitted</span>
                    <span className="text-center">Review</span>
                    <span className="text-right">Published</span>
                  </div>
                  <p className="mt-2 text-sm text-[#5b5d59]">{item.note}</p>
                </div>
                <button className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2dfd8] px-4 py-2 text-sm font-semibold text-[#a92d35] transition hover:border-[#a92d35] hover:bg-[#fbf6f5]">
                  <Icon name={item.status === "Approved" ? "arrow" : "edit"} size={15} />
                  {item.status === "Approved" ? "View" : "Edit"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ReviewView({
  items,
  approvedCount,
  loadError,
  onReview,
}: {
  items: ReviewItem[]
  approvedCount: number
  loadError: string
  onReview: (
    projectId: string,
    decision: "approved" | "changes_requested",
  ) => Promise<void>
}) {
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<
    "all" | "pending_review" | "changes_requested"
  >("all")
  const decide = async (
    item: ReviewItem,
    decision: "approved" | "changes_requested",
  ) => {
    setSaving(true)
    setError("")
    try {
      await onReview(item.id, decision)
      setDecisions((current) => ({
        ...current,
        [item.id]: decision === "approved" ? "Approved" : "Changes requested",
      }))
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Could not save the review decision.",
      )
    } finally {
      setSaving(false)
    }
  }
  const pendingCount = items.filter(
    (item) => item.status === "pending_review",
  ).length
  const changesCount = items.filter(
    (item) => item.status === "changes_requested",
  ).length
  const visible =
    filter === "all" ? items : items.filter((item) => item.status === filter)
  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: items.length },
    { key: "pending_review", label: "Ready for review", count: pendingCount },
    { key: "changes_requested", label: "Changes requested", count: changesCount },
  ]

  return (
    <main className={PAGE}>
      <PageHeader
        eyebrow="Faculty workspace"
        title="Review queue"
        description="Evaluate student work before it enters the public archive."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Awaiting review"
          value={pendingCount}
          detail="Oldest submissions first"
          icon="clock"
        />
        <StatTile
          label="Approved projects"
          value={approvedCount}
          detail="Visible in the public archive"
          icon="check"
        />
        <StatTile
          label="Changes requested"
          value={changesCount}
          detail="Waiting on students"
          icon="edit"
        />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              aria-pressed={filter === tab.key}
              className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === tab.key
                  ? "bg-[#171a18] text-white"
                  : "bg-[#fffefa] text-[#5b5d59] ring-1 ring-[#e2dfd8] hover:bg-[#ebe8e1]"
              }`}
            >
              {tab.label}
              <span className={filter === tab.key ? "text-white/50" : "text-[#9a9b96]"}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {(error || loadError) && (
          <p className="mt-4 rounded-xl bg-[#fbefef] p-3 text-sm text-[#8f252d]">
            {error || loadError}
          </p>
        )}

        <div className="mt-4 grid gap-3">
          {visible.map((item) => {
            const decided = decisions[item.id]
            return (
              <article
                key={item.id}
                className={`grid gap-4 rounded-2xl border bg-[#fffefa] p-5 transition lg:grid-cols-[1fr_auto] lg:items-center ${
                  decided
                    ? "border-[#e2dfd8] opacity-70"
                    : "border-[#e2dfd8] hover:shadow-[0_10px_30px_rgba(24,26,24,0.06)]"
                }`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#171a18] text-sm font-bold text-white">
                    {initialsOf(item.student)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${themeFor(item.type).soft}`}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs text-[#8a8b86]">
                        {item.submitted}
                      </span>
                      {decided ? (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            decided === "Approved"
                              ? "bg-[#e8f1ea] text-[#347153]"
                              : "bg-[#f5edda] text-[#866420]"
                          }`}
                        >
                          <Icon name="check" size={11} /> {decided}
                        </span>
                      ) : (
                        item.status === "changes_requested" && (
                          <span className="rounded-full bg-[#f8e9e9] px-2 py-0.5 text-[11px] font-semibold text-[#a92d35]">
                            Changes requested
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="mt-1.5 truncate text-lg font-semibold">
                      {item.project}
                    </h3>
                    <p className="text-sm text-[#71726e]">
                      Submitted by {item.student}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5b5d59] transition hover:bg-[#f4f1ea] hover:text-[#171a18]">
                    View submission
                  </button>
                  <button
                    disabled={saving || !!decided}
                    onClick={() => void decide(item, "changes_requested")}
                    className="cursor-pointer rounded-xl border border-[#d6d3cb] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f4f1ea] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Request changes
                  </button>
                  <button
                    disabled={saving || !!decided}
                    onClick={() => void decide(item, "approved")}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#a92d35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f252d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon name="check" size={15} /> Approve
                  </button>
                </div>
              </article>
            )
          })}
          {visible.length === 0 && (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#d6d3cb] px-6 py-16 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f1ea] text-[#347153]">
                <Icon name="check" size={22} />
              </span>
              <p className="mt-4 text-lg font-semibold">You're all caught up</p>
              <p className="mt-1 text-sm text-[#71726e]">
                There are no projects in this list right now.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function ArchiveView({ role }: { role: Role }) {
  const [archived, setArchived] = useState([
    "Hydroponics Lab Monitor",
    "UT Events 2022",
  ])
  return (
    <main className="mx-auto max-w-[1160px] px-6 py-12 lg:px-14">
      <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
        {role === "faculty" ? "Records management" : "About Deimos"}
      </p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">
        {role === "faculty"
          ? "Archived project records"
          : "Built to preserve what students learn."}
      </h1>
      {role !== "faculty" ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg bg-[#171a18] p-10 text-white">
            <p className="text-2xl leading-relaxed">
              Deimos is the University of Tampa’s living archive of capstone
              projects, teams, and technical ideas.
            </p>
            <p className="mt-8 text-sm leading-6 text-[#b9bbb7]">
              It helps future students discover what came before, lets
              collaborators find promising work, and gives every capstone team a
              permanent place in the university’s story.
            </p>
          </div>
          <div className="space-y-7 pt-3">
            {[
              [
                "Discover",
                "Browse approved work across programs and academic years.",
              ],
              [
                "Preserve",
                "Keep a durable record of project outcomes and technical decisions.",
              ],
              [
                "Connect",
                "Find teams, repositories, and ideas worth building on.",
              ],
            ].map(([title, text], index) => (
              <div
                key={title}
                className="flex gap-5 border-b border-[#d8d6cf] pb-7"
              >
                <span className="text-sm font-bold text-[#a92d35]">
                  0{index + 1}
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6d6e6a]">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <section className="mt-9 overflow-hidden rounded-lg border border-[#d9d7d0] bg-[#fffefa]">
          <div className="flex items-center justify-between border-b border-[#dfddd6] px-6 py-5">
            <p className="text-sm text-[#70716d]">
              Records hidden from the public project archive
            </p>
            <Badge>{archived.length} records</Badge>
          </div>
          {archived.map((name, index) => (
            <div
              key={name}
              className="flex items-center gap-5 border-b border-[#e2e0da] px-6 py-6 last:border-0"
            >
              <span className="grid size-10 place-items-center rounded bg-[#efeee8]">
                <Icon name="archive" />
              </span>
              <div>
                <strong>{name}</strong>
                <p className="mt-1 text-xs text-[#777873]">
                  Archived{" "}
                  {index === 0 ? "April 8, 2026" : "September 14, 2024"}
                </p>
              </div>
              <button
                onClick={() =>
                  setArchived((current) =>
                    current.filter((item) => item !== name),
                  )
                }
                className="ml-auto cursor-pointer rounded border border-[#b7b5ae] px-4 py-2 text-sm font-semibold hover:bg-[#f2efe8]"
              >
                Restore record
              </button>
            </div>
          ))}
          {archived.length === 0 && (
            <p className="px-6 py-16 text-center text-[#71726e]">
              No archived records remain.
            </p>
          )}
        </section>
      )}
    </main>
  )
}

function ProfileView({ role }: { role: Role }) {
  const [saved, setSaved] = useState(false)
  const faculty = role === "faculty"
  if (role === "guest") {
    return (
      <main className="mx-auto max-w-[760px] px-6 py-12 lg:px-14">
        <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
          Guest access
        </p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">
          Guest profile
        </h1>
        <section className="mt-9 rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-7">
          <span className="grid size-20 place-items-center rounded-full border border-[#a92d35] bg-[#f7efed] text-2xl font-semibold text-[#a92d35]">
            G
          </span>
          <h2 className="mt-5 text-2xl font-semibold">Guest visitor</h2>
          <p className="mt-2 text-sm leading-6 text-[#71726e]">
            You can browse approved University of Tampa capstone projects and
            learn about the archive. Project submissions and faculty review
            tools are available only to their respective university users.
          </p>
          <Badge tone="blue">Read-only access</Badge>
        </section>
      </main>
    )
  }
  return (
    <main className="mx-auto max-w-[1120px] px-6 py-12 lg:px-14">
      <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
        Account
      </p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Profile</h1>
      <div className="mt-9 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-7">
          <span className="grid size-24 place-items-center rounded-full border border-[#a92d35] bg-[#f7efed] text-2xl font-semibold text-[#a92d35]">
            {faculty ? "ER" : "SS"}
          </span>
          <h2 className="mt-5 text-2xl font-semibold">
            {faculty ? "Dr. Elena Ruiz" : "Sample Student"}
          </h2>
          <p className="mt-1 text-sm text-[#71726e]">
            {faculty
              ? "Associate Professor"
              : "Computer Science, Class of 2026"}
          </p>
          <div className="mt-6 border-t border-[#dfddd6] pt-6">
            <Badge tone={faculty ? "red" : "blue"}>
              {faculty ? "Faculty" : "Student"} account
            </Badge>
            <p className="mt-4 flex items-center gap-2 text-sm text-[#62635f]">
              <Icon name="mail" size={16} />
              {faculty ? "eruiz@ut.edu" : "student@ut.edu"}
            </p>
          </div>
        </aside>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setSaved(true)
          }}
          className="rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-7"
        >
          <div className="border-b border-[#dfddd6] pb-5">
            <h2 className="text-xl font-semibold">Personal information</h2>
            <p className="mt-1 text-sm text-[#71726e]">
              Keep your university profile and archive details current.
            </p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label="First name"
              defaultValue={faculty ? "Elena" : "Sample"}
            />
            <Field
              label="Last name"
              defaultValue={faculty ? "Ruiz" : "Student"}
            />
            <Field
              label="University email"
              defaultValue={faculty ? "eruiz@ut.edu" : "student@ut.edu"}
            />
            <Field
              label={faculty ? "Department" : "Program"}
              defaultValue={
                faculty ? "Computer Science" : "B.S. Computer Science"
              }
            />
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Bio</span>
              <textarea
                className="min-h-28 w-full rounded border border-[#d6d4ce] bg-transparent p-3 text-sm outline-none focus:border-[#a92d35]"
                defaultValue={
                  faculty
                    ? "Researching human-centered computing, accessibility, and civic technology."
                    : "Building accessible tools that make campus life easier to navigate."
                }
              />
            </label>
          </div>
          <div className="mt-7 flex items-center justify-end gap-4 border-t border-[#dfddd6] pt-6">
            {saved && (
              <span className="text-sm font-medium text-[#347153]">
                Changes saved
              </span>
            )}
            <button
              type="submit"
              className="cursor-pointer rounded bg-[#a92d35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8f252d]"
            >
              Save profile
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  defaultValue,
  name,
}: {
  label: string
  defaultValue: string
  name?: string
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded border border-[#d6d4ce] bg-transparent px-3 text-sm outline-none focus:border-[#a92d35]"
      />
    </label>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#171a18]/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#fffefa] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#dfddd6] bg-[#fffefa] px-7 py-5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-[#efeee8]"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SubmitModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (submission: ProjectSubmission) => Promise<void>
}) {
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    const formData = new FormData(event.currentTarget)
    const [term, year] = String(formData.get("termYear")).split(" ")
    const cardImage = formData.get("cardImage")
    const additionalMedia = formData.getAll("additionalMedia")
    const selectedCardImage = cardImage instanceof File && cardImage.size > 0 ? cardImage : null
    const selectedAdditionalMedia = additionalMedia.filter(
      (file): file is File => file instanceof File && file.size > 0,
    )
    if (selectedCardImage && !selectedCardImage.type.startsWith("image/")) {
      setError("The display card file must be an image.")
      setSaving(false)
      return
    }
    if (selectedCardImage && selectedCardImage.size > 10 * 1024 * 1024) {
      setError("The display card image must be 10 MB or smaller.")
      setSaving(false)
      return
    }
    const invalidMedia = selectedAdditionalMedia.find(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/"),
    )
    if (invalidMedia) {
      setError("Additional media can only include photos and videos.")
      setSaving(false)
      return
    }
    if (
      selectedAdditionalMedia.some(
        (file) =>
          file.size >
          (file.type.startsWith("video/") ? 50 : 10) * 1024 * 1024,
      )
    ) {
      setError("Additional photos must be 10 MB or smaller; videos 50 MB or smaller.")
      setSaving(false)
      return
    }
    try {
      await onSubmit({
        title: String(formData.get("title")),
        category: String(formData.get("category")),
        term: term as ProjectSubmission["term"],
        academicYear: Number(year),
        description: String(formData.get("description")),
        teamMembers: String(formData.get("teamMembers"))
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
        repositoryUrl: String(formData.get("repositoryUrl") || "") || null,
        cardImage: selectedCardImage,
        additionalMedia: selectedAdditionalMedia,
      })
      setSent(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the project. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal
      title={sent ? "Submission received" : "Submit a capstone project"}
      onClose={onClose}
    >
      {sent ? (
        <div className="p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e8f1ea] text-[#347153]">
            <Icon name="check" size={27} />
          </span>
          <h3 className="mt-5 text-2xl font-semibold">
            Your project is in review.
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6d6e6a]">
            Faculty reviewers will check the project details and repository
            access. We’ll email you when its status changes.
          </p>
          <button
            onClick={onClose}
            className="mt-7 cursor-pointer rounded bg-[#171a18] px-7 py-3 text-sm font-semibold text-white"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">
                Project title
              </span>
              <input
                name="title"
                required
                placeholder="Enter the full project name"
                className="h-12 w-full rounded border border-[#d6d4ce] px-3 text-sm outline-none focus:border-[#a92d35]"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">
                Project type
              </span>
              <select
                name="category"
                className="h-12 w-full rounded border border-[#d6d4ce] px-3 text-sm"
              >
                <option>Web Application</option>
                <option>Mobile Application</option>
                <option>AI / Machine Learning</option>
                <option>Hardware</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">
                Academic term
              </span>
              <select
                name="termYear"
                className="h-12 w-full rounded border border-[#d6d4ce] px-3 text-sm"
              >
                <option>Spring 2026</option>
                <option>Fall 2026</option>
                <option>Summer 2026</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">
                Project summary
              </span>
              <textarea
                name="description"
                required
                placeholder="Describe the problem, approach, and outcome"
                className="min-h-28 w-full rounded border border-[#d6d4ce] p-3 text-sm outline-none focus:border-[#a92d35]"
              />
            </label>
            <Field label="Team members" defaultValue="" name="teamMembers" />
            <Field
              label="Repository URL"
              defaultValue=""
              name="repositoryUrl"
            />
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Display card image
              </span>
              <span className="mb-2 block text-xs text-[#71726e]">
                The main image shown on the project card. JPG, PNG, WebP, or GIF; up to 10 MB.
              </span>
              <input
                name="cardImage"
                type="file"
                accept="image/*"
                className="block w-full rounded border border-[#d6d4ce] bg-white p-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#f2efe8] file:px-3 file:py-2"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">
                Additional project media
              </span>
              <span className="mb-2 block text-xs text-[#71726e]">
                Add photos and videos that viewers can see when they open project details. Photos up to 10 MB; videos up to 50 MB each.
              </span>
              <input
                name="additionalMedia"
                type="file"
                accept="image/*,video/*"
                multiple
                className="block w-full rounded border border-[#d6d4ce] bg-white p-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#f2efe8] file:px-3 file:py-2"
              />
            </label>
          </div>
          {error && (
            <p className="mt-5 rounded bg-[#fbefef] p-3 text-sm text-[#8f252d]">
              {error}
            </p>
          )}
          <div className="mt-7 flex justify-end gap-3 border-t border-[#dfddd6] pt-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded border border-[#b7b5ae] px-5 py-3 text-sm font-semibold"
            >
              Save draft
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded bg-[#a92d35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f252d]"
            >
              {saving ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function ProjectModal({
  project,
  faculty,
  onClose,
}: {
  project: Project
  faculty: boolean
  onClose: () => void
}) {
  return (
    <Modal
      title={faculty ? "Edit project information" : project.title}
      onClose={onClose}
    >
      <div className="p-7">
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">{project.category}</Badge>
          <Badge>
            {project.term} {project.year}
          </Badge>
        </div>
        {faculty ? (
          <div className="mt-6 grid gap-5">
            <Field label="Project title" defaultValue={project.title} />
            <label>
              <span className="mb-2 block text-sm font-medium">
                Description
              </span>
              <textarea
                defaultValue={project.description}
                className="min-h-28 w-full rounded border border-[#d6d4ce] p-3 text-sm"
              />
            </label>
            <Field label="Team members" defaultValue={project.team} />
            <div className="flex justify-between border-t border-[#dfddd6] pt-6">
              <button className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#a92d35]">
                <Icon name="archive" /> Archive record
              </button>
              <button
                onClick={onClose}
                className="cursor-pointer rounded bg-[#a92d35] px-6 py-3 text-sm font-semibold text-white"
              >
                Save changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-6 text-base leading-7 text-[#656762]">
              {project.description}
            </p>
            {(project.cardImageUrl || project.additionalMedia?.length) && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.cardImageUrl && (
                  <img
                    src={project.cardImageUrl}
                    alt={`${project.title} display`}
                    className="max-h-80 w-full rounded-lg object-cover sm:col-span-2"
                  />
                )}
                {project.additionalMedia?.map((media) =>
                  media.type === "video" ? (
                    <video
                      key={media.url}
                      src={media.url}
                      controls
                      className="max-h-80 w-full rounded-lg bg-black object-contain"
                    />
                  ) : (
                    <img
                      key={media.url}
                      src={media.url}
                      alt={`${project.title} project media`}
                      className="max-h-80 w-full rounded-lg object-cover"
                    />
                  ),
                )}
              </div>
            )}
            <div className="mt-7 grid gap-6 border-y border-[#dfddd6] py-6 sm:grid-cols-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-[#777873]">
                  Team
                </span>
                <p className="mt-2 text-sm">{project.team}</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-[#777873]">
                  Technology
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <button className="mt-6 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#a92d35]">
              <Icon name="github" /> Visit project repository{" "}
              <Icon name="arrow" size={14} />
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}

function AuthorizedUsersView({ demoMode }: { demoMode: boolean }) {
  const [users, setUsers] = useState<AuthorizedUser[]>(
    demoMode
      ? [
          {
            email: "admin@deimos.demo",
            role: "admin",
            created_at: "2026-08-14T12:00:00.000Z",
          },
          {
            email: "maya.patel@spartans.ut.edu",
            role: "student",
            created_at: "2026-08-18T12:00:00.000Z",
          },
          {
            email: "elena.ruiz@ut.edu",
            role: "faculty",
            created_at: "2026-09-03T12:00:00.000Z",
          },
        ]
      : [],
  )
  const [currentAdminEmail, setCurrentAdminEmail] = useState(
    demoMode ? "admin@deimos.demo" : "",
  )
  const [loading, setLoading] = useState(!demoMode)
  const [saving, setSaving] = useState(false)
  const [pendingRemoval, setPendingRemoval] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | AuthorizedUser["role"]>(
    "all",
  )

  const refreshUsers = async () => {
    const rows = await getAuthorizedUsers()
    setUsers(rows)
  }

  useEffect(() => {
    if (demoMode) return
    supabase?.auth.getUser().then(({ data }) => {
      setCurrentAdminEmail(data.user?.email?.toLowerCase() ?? "")
    })
    refreshUsers()
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load authorized users.",
        )
      })
      .finally(() => setLoading(false))
  }, [demoMode])

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setNotice("")
    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get("email")).trim().toLowerCase()
    const role = String(data.get("role")) as AuthorizedUser["role"]
    try {
      if (users.some((user) => user.email === email)) {
        throw new Error("This email is already on the access list.")
      }
      if (demoMode) {
        setUsers((current) => [
          { email, role, created_at: new Date().toISOString() },
          ...current,
        ])
      } else {
        await addAuthorizedUser(email, role)
        await refreshUsers()
      }
      form.reset()
      setNotice(
        demoMode
          ? "Demo user added. This change only lasts for this session."
          : "User authorized. They can now create an account with this email.",
      )
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not authorize this user.",
      )
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (email: string) => {
    setPendingRemoval(email)
    setError("")
    setNotice("")
    try {
      if (demoMode) {
        setUsers((current) => current.filter((user) => user.email !== email))
      } else {
        await removeAuthorizedUser(email)
        await refreshUsers()
      }
      setNotice(
        demoMode
          ? "Demo user removed. This change only lasts for this session."
          : `${email} no longer has an authorized account role.`,
      )
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove this user.",
      )
    } finally {
      setPendingRemoval("")
    }
  }

  const roleTone: Record<AuthorizedUser["role"], string> = {
    student: "bg-[#f8e9e9] text-[#a92d35]",
    faculty: "bg-[#e9f0f4] text-[#355f72]",
    admin: "bg-[#171a18] text-white",
  }
  const roleCount = (role: AuthorizedUser["role"]) =>
    users.filter((user) => user.role === role).length
  const visibleUsers = users.filter(
    (user) =>
      (roleFilter === "all" || user.role === roleFilter) &&
      user.email.includes(search.trim().toLowerCase()),
  )

  return (
    <main className={PAGE}>
      <PageHeader
        eyebrow="Administration"
        title="Authorized users"
        description="Add email addresses that may create Deimos accounts, assign their role, or revoke access. Approved projects stay publicly viewable to guests."
      />
      {demoMode && (
        <p className="mt-5 rounded-xl border border-[#ead9ae] bg-[#fbf5e6] p-3 text-sm text-[#765c21]">
          Demo admin: changes to this sample list are temporary and are not
          saved to Supabase.
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total users" value={users.length} detail="On the access list" icon="users" />
        <StatTile label="Students" value={roleCount("student")} detail="Can submit projects" icon="cap" />
        <StatTile label="Faculty" value={roleCount("faculty")} detail="Can review & curate" icon="book" />
        <StatTile label="Admins" value={roleCount("admin")} detail="Can manage access" icon="shield" />
      </div>

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-[360px_1fr]">
        <section className="rounded-3xl border border-[#e2dfd8] bg-[#fffefa] p-6 lg:sticky lg:top-6">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f8eeee] text-[#a92d35]">
            <Icon name="plus" size={20} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Authorize an email</h2>
          <p className="mt-1 text-sm text-[#71726e]">
            They'll be able to create an account with this address.
          </p>
          <form onSubmit={handleAdd} className="mt-5 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-medium">Email address</span>
              <span className="flex h-12 items-center gap-3 rounded-xl bg-[#f4f1ea] px-4 transition focus-within:bg-white focus-within:shadow-[0_0_0_2px_#a92d35]">
                <Icon name="mail" className="text-[#777873]" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@spartans.ut.edu"
                  className="h-full w-full bg-transparent text-sm outline-none focus-visible:outline-none"
                />
              </span>
            </label>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium">Account role</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["student", "faculty", "admin"] as const).map((role) => (
                  <label key={role} className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      defaultChecked={role === "student"}
                      className="peer sr-only"
                    />
                    <span className="flex flex-col items-center gap-1 rounded-xl border border-[#e2dfd8] py-3 text-xs font-semibold capitalize text-[#5b5d59] transition peer-checked:border-[#a92d35] peer-checked:bg-[#f8eeee] peer-checked:text-[#a92d35] peer-focus-visible:ring-2 peer-focus-visible:ring-[#a92d35]">
                      <Icon
                        name={role === "student" ? "cap" : role === "faculty" ? "book" : "shield"}
                        size={18}
                      />
                      {role}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={saving}
              className="h-12 cursor-pointer rounded-xl bg-[#a92d35] px-6 text-sm font-semibold text-white transition hover:bg-[#8f252d] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add authorized user"}
            </button>
          </form>
          {(error || notice) && (
            <p
              className={`mt-4 rounded-xl p-3 text-sm ${
                error ? "bg-[#fbefef] text-[#8f252d]" : "bg-[#e8f1ea] text-[#347153]"
              }`}
            >
              {error || notice}
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#e2dfd8] bg-[#fffefa]">
          <div className="flex flex-col gap-3 border-b border-[#ebe8e1] p-5 md:flex-row md:items-center">
            <div className="md:mr-auto">
              <h2 className="text-lg font-semibold">Access list</h2>
              <p className="text-sm text-[#71726e]">
                {users.length} authorized {users.length === 1 ? "user" : "users"}
              </p>
            </div>
            <label className="flex h-10 items-center gap-2 rounded-xl bg-[#f4f1ea] px-3 transition focus-within:bg-white focus-within:shadow-[0_0_0_2px_#a92d35] md:w-60">
              <Icon name="search" size={16} className="text-[#777873]" />
              <span className="sr-only">Search users</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search emails"
                className="h-full w-full bg-transparent text-sm outline-none focus-visible:outline-none"
              />
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto border-b border-[#ebe8e1] px-5 py-3">
            {(["all", "student", "faculty", "admin"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                aria-pressed={roleFilter === role}
                className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  roleFilter === role
                    ? "bg-[#171a18] text-white"
                    : "bg-[#f4f1ea] text-[#5b5d59] hover:bg-[#ebe8e1]"
                }`}
              >
                {{ all: "All roles", student: "Students", faculty: "Faculty", admin: "Admins" }[role]}
                <span className={`ml-1.5 ${roleFilter === role ? "text-white/50" : "text-[#9a9b96]"}`}>
                  {role === "all" ? users.length : roleCount(role)}
                </span>
              </button>
            ))}
          </div>
          {loading ? (
            <p className="p-6 text-sm text-[#71726e]">Loading users...</p>
          ) : visibleUsers.length ? (
            <ul>
              {visibleUsers.map((user) => {
                const self = user.email === currentAdminEmail
                return (
                  <li
                    key={user.email}
                    className="flex flex-wrap items-center gap-4 border-b border-[#f0eee8] px-5 py-4 last:border-0"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ebe8e1] text-xs font-bold uppercase text-[#343735]">
                      {user.email.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {user.email}
                        {self && (
                          <span className="ml-2 rounded-full bg-[#e8f1ea] px-2 py-0.5 text-[10px] font-semibold text-[#347153]">
                            You
                          </span>
                        )}
                      </strong>
                      <span className="text-xs text-[#8a8b86]">
                        Added {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${roleTone[user.role]}`}
                    >
                      {user.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleRemove(user.email)}
                      disabled={pendingRemoval === user.email || self}
                      className="cursor-pointer rounded-xl border border-[#e8cfd0] px-3 py-2 text-xs font-semibold text-[#a92d35] transition hover:bg-[#fbefef] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {self
                        ? "Current account"
                        : pendingRemoval === user.email
                          ? "Removing..."
                          : "Remove access"}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="p-10 text-center text-sm text-[#71726e]">
              {users.length ? "No users match that search." : "No authorized users found."}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

function AuthScreen({
  onContinue,
  error,
  notice,
  loading,
  demoMode,
}: {
  onContinue: (
    role: Role,
    mode: "signin" | "create",
    email: string,
    password: string,
  ) => void
  error: string
  notice: string
  loading: boolean
  demoMode: boolean
}) {
  const [mode, setMode] = useState<"signin" | "create">("create")
  const [accountRole, setAccountRole] = useState<Role>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((value) => !value)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="shrink-0 cursor-pointer text-[#777873] transition hover:text-[#171a18]"
    >
      <Icon name={showPassword ? "eyeOff" : "eye"} />
    </button>
  )

  return (
    <main className="grid min-h-screen bg-[#fffefa] text-[#171a18] lg:grid-cols-2">
      {/* Left: animated UT orbit */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#f4f1ea] lg:block">
        <div className="absolute inset-x-0 bottom-28 top-0">
        <Ripple mainCircleSize={180} />
        <OrbitDisplay
          center={
            <img
              src="/brand/ut-spartans-seal.png"
              alt="University of Tampa Spartans"
              className="deimos-float size-[190px] object-contain drop-shadow-[0_18px_30px_rgba(23,26,24,0.18)] xl:size-[220px]"
            />
          }
          icons={authOrbitIcons}
        />
        </div>

        <div className="absolute left-12 top-10 z-20 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded border border-[#171a18] text-lg font-bold">
            D
          </span>
          <span>
            <strong className="block text-xl tracking-tight">DEIMOS</strong>
            <span className="block text-xs tracking-wide text-[#71726e]">
              THE UNIVERSITY OF TAMPA
            </span>
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#f4f1ea] via-[#f4f1ea]/90 to-transparent px-12 pb-10 pt-24">
          <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
            Capstone archive
          </p>
          <h1 className="mt-3 max-w-md text-3xl font-medium leading-[1.1] tracking-tight xl:text-4xl">
            Discover what students build. Preserve what they learn.
          </h1>
        </div>
      </section>

      {/* Right: sign-in form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src="/brand/ut-spartans-seal.png"
              alt=""
              className="size-12 object-contain"
            />
            <span>
              <strong className="block text-lg leading-5">DEIMOS</strong>
              <span className="block text-[11px] tracking-wide text-[#71726e]">
                THE UNIVERSITY OF TAMPA
              </span>
            </span>
          </div>

          <BoxReveal>
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome to Deimos
            </h2>
          </BoxReveal>
          <BoxReveal delay={0.08} className="mt-2">
            <p className="text-sm text-[#6f716d]">
              Choose how you’d like to explore the capstone archive.
            </p>
          </BoxReveal>

          {demoMode && (
            <BoxReveal delay={0.14} full className="mt-4">
              <p className="rounded-md border border-[#ead9ae] bg-[#fbf5e6] p-3 text-xs leading-5 text-[#765c21]">
                Demo mode: connect Supabase to enable real accounts and saved
                projects.
              </p>
            </BoxReveal>
          )}

          {accountRole !== "guest" && (
            <BoxReveal delay={0.2} full className="mt-6">
              <div className="grid grid-cols-2 rounded-lg bg-[#edeae3] p-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`cursor-pointer rounded-md py-2.5 text-sm font-semibold transition ${
                    mode === "signin"
                      ? "bg-[#fffefa] shadow-sm"
                      : "text-[#6f716d] hover:text-[#171a18]"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("create")
                    setAccountRole("student")
                  }}
                  className={`cursor-pointer rounded-md py-2.5 text-sm font-semibold transition ${
                    mode === "create"
                      ? "bg-[#fffefa] shadow-sm"
                      : "text-[#6f716d] hover:text-[#171a18]"
                  }`}
                >
                  Create account
                </button>
              </div>
            </BoxReveal>
          )}

          <BoxReveal delay={0.26} className="mt-6">
            <p className="text-sm font-semibold">
              {accountRole === "guest"
                ? "Browse the archive as a..."
                : `I am ${
                    mode === "create" ? "creating an" : "signing in to an"
                  }...`}
            </p>
          </BoxReveal>
          <BoxReveal delay={0.32} full className="mt-3">
            <div className="grid grid-cols-2 gap-2.5">
              {(
                mode === "create"
                  ? (["student"] as Role[])
                  : (["student", "faculty", "admin", "guest"] as Role[])
              ).map((item) => {
                const active = accountRole === item
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAccountRole(item)}
                    aria-pressed={active}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition ${
                      active
                        ? "border-[#a92d35] bg-[#f8eeee] shadow-[0_0_0_1px_#a92d35]"
                        : "border-[#dedbd4] hover:border-[#aaa7a0] hover:bg-[#faf8f4]"
                    }`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-md transition ${
                        active
                          ? "bg-[#a92d35] text-white"
                          : "bg-[#efede7] text-[#171a18]"
                      }`}
                    >
                      <Icon
                        name={
                          item === "student"
                            ? "cap"
                            : item === "faculty"
                              ? "book"
                              : item === "admin"
                                ? "users"
                                : "user"
                        }
                        size={18}
                      />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm capitalize">
                        {item === "guest" ? "Guest" : item}
                      </strong>
                      <span className="block truncate text-[11px] text-[#6f716d]">
                        {item === "student"
                          ? "Submit & manage work"
                          : item === "faculty"
                            ? "Review & approve"
                            : item === "admin"
                              ? "Manage access"
                              : "Browse read-only"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </BoxReveal>

          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault()
              setFormError("")
              if (mode === "create" && password !== confirmPassword) {
                setFormError("Passwords do not match.")
                return
              }
              onContinue(accountRole, mode, email, password)
            }}
          >
            {accountRole === "guest" ? (
              <BoxReveal delay={0.38} full>
                <button
                  type="submit"
                  className="group/btn relative h-12 w-full cursor-pointer rounded-lg bg-[#a92d35] text-sm font-semibold text-white shadow-[0_1px_0_0_#ffffff40_inset,0_-1px_0_0_#00000030_inset] transition hover:bg-[#8f252d]"
                >
                  Continue as guest &rarr;
                  <BottomGradient />
                </button>
              </BoxReveal>
            ) : (
              <>
                <BoxReveal delay={0.38} full>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">
                      University email
                    </span>
                    <SpotlightInput
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={
                        accountRole === "student"
                          ? "name@spartans.ut.edu"
                          : "name@ut.edu"
                      }
                      icon={<Icon name="mail" />}
                    />
                  </label>
                </BoxReveal>

                <div
                  className={`mt-4 grid gap-4 ${
                    mode === "create" ? "sm:grid-cols-2" : ""
                  }`}
                >
                  <BoxReveal delay={0.44} full>
                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-sm font-semibold">
                        Password
                        {mode === "signin" && (
                          <button
                            type="button"
                            className="cursor-pointer text-xs text-[#a92d35] hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </span>
                      <SpotlightInput
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        icon={<Icon name="lock" />}
                        trailing={passwordToggle}
                      />
                    </label>
                  </BoxReveal>
                  {mode === "create" && (
                    <BoxReveal delay={0.1} full>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold">
                          Confirm password
                        </span>
                        <SpotlightInput
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Re-enter password"
                          icon={<Icon name="lock" />}
                        />
                      </label>
                    </BoxReveal>
                  )}
                </div>

                <BoxReveal delay={0.5} full className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group/btn relative h-12 w-full cursor-pointer rounded-lg bg-[#a92d35] text-sm font-semibold text-white shadow-[0_1px_0_0_#ffffff40_inset,0_-1px_0_0_#00000030_inset] transition hover:bg-[#8f252d] disabled:cursor-wait disabled:opacity-70"
                  >
                    {loading
                      ? "Please wait..."
                      : mode === "signin"
                        ? <>Sign in as {accountRole} &rarr;</>
                        : <>Create {accountRole} account &rarr;</>}
                    <BottomGradient />
                  </button>
                </BoxReveal>
              </>
            )}
          </form>

          {(formError || error) && (
            <p className="mt-4 rounded-md bg-[#fbefef] p-3 text-sm text-[#8f252d]">
              {formError || error}
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded-md bg-[#e8f1ea] p-3 text-sm text-[#347153]">
              {notice}
            </p>
          )}
          <p className="mt-6 text-center text-xs leading-5 text-[#777873]">
            {accountRole === "guest"
              ? "Guest access is read-only and does not require an account."
              : "By continuing, you agree to the archive guidelines and University technology policies."}
          </p>
        </div>
      </section>
    </main>
  )
}

// Stack icons are bundled in public/brand/stack (from the MIT-licensed devicon set).
const devicon = (name: string) => `/brand/stack/${name}.svg`

const orbitBadge = (src: string, alt: string) => (
  <span className="grid size-full place-items-center rounded-full bg-white p-2 shadow-[0_6px_16px_rgba(23,26,24,0.12)]">
    <img src={src} alt={alt} className="size-full object-contain" loading="lazy" />
  </span>
)

// Orbiting icons around the UT seal: the UT "T" mark plus common capstone stacks.
const authOrbitIcons: OrbitIcon[] = [
  // inner ring
  { key: "react", node: orbitBadge(devicon("react"), "React"), className: "size-10", radius: 140, duration: 22, delay: 0, path: true },
  { key: "ts", node: orbitBadge(devicon("typescript"), "TypeScript"), className: "size-10", radius: 140, duration: 22, delay: 11, path: false },
  // middle ring (reverse) with the UT "T" mark
  { key: "ut-mark", node: <img src="/brand/ut-tampa-mark.png" alt="University of Tampa" className="size-full object-contain drop-shadow-[0_6px_10px_rgba(23,26,24,0.2)]" />, className: "h-16 w-20", radius: 205, duration: 30, delay: 0, reverse: true, path: true },
  { key: "python", node: orbitBadge(devicon("python"), "Python"), className: "size-11", radius: 205, duration: 30, delay: 10, reverse: true, path: false },
  { key: "postgres", node: orbitBadge(devicon("postgresql"), "PostgreSQL"), className: "size-11", radius: 205, duration: 30, delay: 20, reverse: true, path: false },
  // outer ring
  { key: "java", node: orbitBadge(devicon("java"), "Java"), className: "size-12", radius: 270, duration: 40, delay: 0, path: true },
  { key: "github", node: orbitBadge(devicon("github"), "GitHub"), className: "size-12", radius: 270, duration: 40, delay: 10, path: false },
  { key: "figma", node: orbitBadge(devicon("figma"), "Figma"), className: "size-12", radius: 270, duration: 40, delay: 20, path: false },
  { key: "node", node: orbitBadge(devicon("nodejs"), "Node.js"), className: "size-12", radius: 270, duration: 40, delay: 30, path: false },
]

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authNotice, setAuthNotice] = useState("")
  const [role, setRole] = useState<Role>("student")
  const [archiveProjects, setArchiveProjects] = useState<Project[]>(
    supabase ? [] : projects,
  )
  const [projectLoadError, setProjectLoadError] = useState("")
  const [submissionLoadError, setSubmissionLoadError] = useState("")
  const [reviewLoadError, setReviewLoadError] = useState("")
  const [mySubmissions, setMySubmissions] = useState<SubmissionItem[]>(
    supabase ? [] : submissions,
  )
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(
    supabase ? [] : reviewItems,
  )
  const [view, setView] = useState<View>("projects")
  const [submitOpen, setSubmitOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [tourOpen, setTourOpen] = useState(false)
  // Onboarding progress, remembered per role on this browser so returning
  // users don't see the tour or the Getting started checklist again.
  // Keys: tour, explore, review, users, dismissed.
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const progressKey = `deimos.onboarding.v1.${role}`

  const markStep = (step: string) => {
    setProgress((current) => {
      if (current[step]) return current
      const next = { ...current, [step]: true }
      try {
        localStorage.setItem(progressKey, JSON.stringify(next))
      } catch {
        // Storage can be unavailable (private mode); progress lasts this session.
      }
      return next
    })
  }

  useEffect(() => {
    if (!authenticated) return
    let saved: Record<string, boolean> = {}
    try {
      saved = JSON.parse(localStorage.getItem(progressKey) ?? "{}") ?? {}
      // Carry over the older "tour seen" flag from the first version.
      if (localStorage.getItem(`deimos.tour.v1.${role}`) === "done") {
        saved.tour = true
      }
    } catch {
      saved = {}
    }
    setProgress(saved)
    if (!saved.tour) setTourOpen(true)
  }, [authenticated, role])

  useEffect(() => {
    if (authenticated && view === "users") markStep("users")
  }, [authenticated, view])

  const closeTour = () => {
    setTourOpen(false)
    markStep("tour")
  }

  const changeRole = (nextRole: Role) => {
    setRole(nextRole)
    setView("projects")
  }

  const loadUserRole = async (userId: string) => {
    const accountRole = await getProfileRole(userId)
    return accountRole
  }

  const applyUserRole = (accountRole: Role) => {
    changeRole(accountRole)
    setAuthenticated(true)
  }

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) throw error
        if (data.session?.user) {
          const accountRole = await loadUserRole(data.session.user.id)
          if (!cancelled) applyUserRole(accountRole)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          if (supabase) void supabase.auth.signOut()
          setAuthError(
            error instanceof Error
              ? error.message
              : "Could not restore your session.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!supabase || !authenticated || role !== "student") return
    let cancelled = false
    getMySubmissions()
      .then((rows) => {
        if (!cancelled) setMySubmissions(rows.map(toSubmission))
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSubmissionLoadError(
            error instanceof Error
              ? error.message
              : "Could not load your submissions.",
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [authenticated, role])

  useEffect(() => {
    if (!supabase || !authenticated || role !== "faculty") return
    let cancelled = false
    getReviewQueue()
      .then((rows) => {
        if (!cancelled) setReviewQueue(rows.map(toReviewItem))
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReviewLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the review queue.",
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [authenticated, role])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    getApprovedProjects()
      .then((rows) => {
        if (!cancelled) setArchiveProjects(rows.map(toProject))
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProjectLoadError(
            error instanceof Error ? error.message : "Please try again later.",
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleContinue = async (
    nextRole: Role,
    mode: "signin" | "create",
    email: string,
    password: string,
  ) => {
    setAuthError("")
    setAuthNotice("")
    if (nextRole === "guest" || !supabase) {
      changeRole(nextRole)
      setAuthenticated(true)
      return
    }
    if (mode === "create" && nextRole === "faculty") {
      setAuthError(
        "Faculty accounts must be created by an archive administrator. Choose Sign in if your account is already set up.",
      )
      return
    }

    setAuthBusy(true)
    try {
      if (mode === "create") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) {
          setAuthNotice(
            "Check your email to confirm your account, then sign in.",
          )
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }

      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!data.user) throw new Error("Could not read the signed-in user.")
      const actualRole = await loadUserRole(data.user.id)
      if (mode === "signin" && actualRole !== nextRole) {
        await supabase.auth.signOut()
        throw new Error(`This account does not have ${nextRole} access.`)
      }
      applyUserRole(actualRole)
    } catch (error) {
      await supabase.auth.signOut()
      setAuthError(
        error instanceof Error ? error.message : "Could not sign you in.",
      )
    } finally {
      setAuthBusy(false)
    }
  }

  const handleProjectSubmit = async (submission: ProjectSubmission) => {
    if (!supabase) return
    await submitProject(submission)
    const rows = await getMySubmissions()
    setMySubmissions(rows.map(toSubmission))
  }

  const handleReview = async (
    projectId: string,
    decision: "approved" | "changes_requested",
  ) => {
    markStep("review")
    if (!supabase) return
    await reviewProject(projectId, decision)
    const [queueRows, projectRows] = await Promise.all([
      getReviewQueue(),
      getApprovedProjects(),
    ])
    setReviewQueue(queueRows.map(toReviewItem))
    setArchiveProjects(projectRows.map(toProject))
  }

  const openProject = (project: Project) => {
    setSelectedProject(project)
    markStep("explore")
  }

  const signOut = () => {
    setAuthenticated(false)
    if (supabase) void supabase.auth.signOut()
    setRole("student")
    setView("projects")
    setSubmitOpen(false)
    setSelectedProject(null)
    setTourOpen(false)
  }

  const renderHome = ({ trending, onPickTech, scrollToExplore }: HomeHelpers) => {
    const tourStep: HomeStep = {
      key: "tour",
      label: "Take the Deimos tour",
      done: !!progress.tour,
      action: () => setTourOpen(true),
    }
    const exploreStep = (label: string): HomeStep => ({
      key: "explore",
      label,
      done: !!progress.explore,
      action: scrollToExplore,
    })
    const shared = {
      trending,
      onPickTech,
      checklistHidden: !!progress.dismissed,
      onDismissChecklist: () => markStep("dismissed"),
    }
    const pending = reviewQueue.filter(
      (item) => item.status === "pending_review",
    ).length

    if (role === "faculty") {
      return (
        <RoleHome
          {...shared}
          eyebrow="Faculty workspace"
          title={`${greetingNow()}, Professor.`}
          subtitle={
            pending
              ? `${pending} student ${pending === 1 ? "submission is" : "submissions are"} waiting for your review.`
              : "Your review queue is clear. Browse and curate the archive below."
          }
          primary={{ label: "Open review queue", icon: "inbox", onClick: () => setView("review") }}
          secondary={{ label: "Curate archive", icon: "edit", onClick: scrollToExplore }}
          side={
            <FacultySideCard
              items={reviewQueue}
              onOpenQueue={() => setView("review")}
            />
          }
          steps={[
            tourStep,
            {
              key: "review",
              label: "Review a submission",
              done: !!progress.review,
              action: () => setView("review"),
            },
            exploreStep("Open an archived project"),
          ]}
        />
      )
    }
    if (role === "admin") {
      return (
        <RoleHome
          {...shared}
          eyebrow="Administration"
          title={`${greetingNow()}, Admin.`}
          subtitle={`Manage who can use Deimos and keep an eye on the ${archiveProjects.length} capstones in the archive.`}
          primary={{ label: "Manage users", icon: "users", onClick: () => setView("users") }}
          secondary={{ label: "Browse archive", icon: "search", onClick: scrollToExplore }}
          side={
            <AdminSideCard
              onUsers={() => setView("users")}
              onExplore={scrollToExplore}
              onTour={() => setTourOpen(true)}
            />
          }
          steps={[
            tourStep,
            {
              key: "users",
              label: "Open the access list",
              done: !!progress.users,
              action: () => setView("users"),
            },
            exploreStep("Open an archived project"),
          ]}
        />
      )
    }
    if (role === "guest") {
      const featured = [...archiveProjects].sort((a, b) => b.year - a.year)[0]
      return (
        <RoleHome
          {...shared}
          eyebrow="Guest access"
          title="Welcome to Deimos."
          subtitle={`You're browsing ${archiveProjects.length} approved University of Tampa capstones in read-only mode.`}
          primary={{ label: "Browse archive", icon: "search", onClick: scrollToExplore }}
          secondary={{ label: "Sign in with UT", icon: "user", onClick: signOut }}
          side={
            <GuestSideCard
              project={featured}
              onOpen={openProject}
              onSignIn={signOut}
            />
          }
          steps={[tourStep, exploreStep("Open a capstone project")]}
        />
      )
    }
    return (
      <RoleHome
        {...shared}
        eyebrow="Student workspace"
        title={`${greetingNow()}, Spartan.`}
        subtitle={`Pick up where you left off, or get inspired by ${archiveProjects.length} approved capstones from past UT teams.`}
        primary={{ label: "Submit project", icon: "plus", onClick: () => setSubmitOpen(true) }}
        secondary={{ label: "Browse archive", icon: "search", onClick: scrollToExplore }}
        side={
          <StudentSideCard
            submissions={mySubmissions}
            onViewAll={() => setView("submissions")}
          />
        }
        steps={[
          tourStep,
          exploreStep("Open a past capstone"),
          {
            key: "submit",
            label: "Submit your project",
            done: mySubmissions.length > 0 || !!progress.submit,
            action: () => setSubmitOpen(true),
          },
        ]}
      />
    )
  }

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#171a18]">
        Loading your Deimos session...
      </main>
    )
  }
  if (!authenticated) {
    return (
      <AuthScreen
        onContinue={handleContinue}
        error={authError}
        notice={authNotice}
        loading={authBusy}
        demoMode={!supabase}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#171a18] lg:pl-[76px]">
      <AppSidebar
        role={role}
        view={view}
        onView={setView}
        onSubmit={() => setSubmitOpen(true)}
        onTour={() => setTourOpen(true)}
        reviewCount={reviewQueue.length}
        actionCount={
          mySubmissions.filter((item) => item.status === "Changes requested")
            .length
        }
        onSignOut={signOut}
      />
      {view === "projects" && (
        <ProjectsView
          role={role}
          projects={archiveProjects}
          loadError={projectLoadError}
          onOpen={openProject}
          home={(helpers) => renderHome(helpers)}
        />
      )}
      {view === "submissions" && role === "student" && (
        <SubmissionsView
          items={mySubmissions}
          loadError={submissionLoadError}
          onSubmit={() => setSubmitOpen(true)}
        />
      )}
      {view === "review" && (
        <ReviewView
          items={reviewQueue}
          approvedCount={archiveProjects.length}
          loadError={reviewLoadError}
          onReview={handleReview}
        />
      )}
      {view === "archive" && <ArchiveView role={role} />}
      {view === "users" && role === "admin" && (
        <AuthorizedUsersView demoMode={!supabase} />
      )}
      {view === "profile" && <ProfileView role={role} />}
      {submitOpen && role === "student" && (
        <SubmitModal
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleProjectSubmit}
        />
      )}
      <OnboardingDialog
        open={tourOpen}
        steps={tourStepsFor(role)}
        onClose={closeTour}
        finishLabel={role === "student" ? "Start exploring" : "Get started"}
      />
      {selectedProject && (
        <ProjectModal
          faculty={role === "faculty"}
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}
