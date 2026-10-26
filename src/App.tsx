import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import {
  getApprovedProjects,
  getMySubmissions,
  getProfileRole,
  getReviewQueue,
  reviewProject,
  submitProject,
  type ArchiveProjectRow,
  type ProjectSubmission,
  type ReviewQueueRow,
  type SubmissionRow,
} from "./lib/archive"
import { supabase } from "./lib/supabase"

type Role = "student" | "faculty" | "guest"
type View = "projects" | "submissions" | "review" | "archive" | "profile"
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

function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: string
  size?: number
  className?: string
}) {
  const paths: Record<string, ReactNode> = {
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: <circle cx="11" cy="11" r="7.5" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    arrow: (
      <>
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </>
    ),
    users: (
      <>
        <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    github: (
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.28-.36 6.72-1.61 6.72-7A5.48 5.48 0 0 0 19.27 3.7 5.15 5.15 0 0 0 19.13 0S18 0 15 1.48a13.38 13.38 0 0 0-7 0C5 0 3.87 0 3.87 0a5.15 5.15 0 0 0-.14 3.7 5.48 5.48 0 0 0-1.45 3.8c0 5.42 3.44 6.67 6.72 7A4.8 4.8 0 0 0 8 18v4" />
    ),
    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.34 5.66" />
        <path d="M20 4v7h-7" />
      </>
    ),
    folder: <path d="M3 5h6l2 2h10v12H3z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="m16.5 3.5 4 4L8 20H4v-4z" />
      </>
    ),
    archive: (
      <>
        <path d="M3 6h18v4H3zM5 10v10h14V10M10 14h4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    cap: (
      <>
        <path d="m2 10 10-5 10 5-10 5z" />
        <path d="M6 12.5V17c3 2.5 9 2.5 12 0v-4.5M22 10v6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3z" />
        <path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded bg-[#171a18] text-sm font-bold text-white">
        D
      </span>
      <span className="text-lg font-bold tracking-tight">DEIMOS</span>
    </div>
  )
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

function Header({
  role,
  view,
  onView,
  onSubmit,
  onSignOut,
}: {
  role: Role
  view: View
  onView: (view: View) => void
  onSubmit: () => void
  onSignOut: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const person =
    role === "student"
      ? "Sample Student"
      : role === "faculty"
        ? "Dr. Elena Ruiz"
        : "Guest visitor"
  const links: NavigationLink[] =
    role === "student"
      ? [
          { label: "Projects", value: "projects" },
          { label: "My submissions", value: "submissions" },
          { label: "About the archive", value: "archive" },
        ]
      : role === "guest"
        ? [
            { label: "Projects", value: "projects" },
            { label: "About the archive", value: "archive" },
          ]
        : [
            { label: "Projects", value: "projects" },
            { label: "Review queue", value: "review" },
            { label: "Archive", value: "archive" },
          ]

  return (
    <header className="sticky top-0 z-40 border-b border-[#d9d7d0] bg-[#fffefa]/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1450px] items-center gap-10 px-6 lg:px-14">
        <button
          onClick={() => onView("projects")}
          className="shrink-0 cursor-pointer"
        >
          <Logo />
        </button>
        <nav className="hidden h-full items-center gap-8 md:flex">
          {links.map((link) => (
            <button
              key={link.value}
              onClick={() => onView(link.value)}
              className={`h-full cursor-pointer border-b-2 text-sm transition ${
                view === link.value
                  ? "border-[#a92d35] font-semibold text-[#171a18]"
                  : "border-transparent text-[#686a66] hover:text-[#171a18]"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-5">
          {role === "student" && (
            <button
              onClick={onSubmit}
              className="hidden cursor-pointer items-center gap-2 rounded bg-[#a92d35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f252d] sm:flex"
            >
              <Icon name="plus" size={17} />
              Submit project
            </button>
          )}
          {role === "faculty" && view === "review" && (
            <Badge tone="red">{reviewItems.length} awaiting review</Badge>
          )}
          <div className="relative">
            <button
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex cursor-pointer items-center gap-3 text-left"
            >
              <span className="grid size-10 place-items-center rounded-full border border-[#a92d35] bg-[#f7efed] text-sm font-bold text-[#a92d35]">
                {role === "student" ? "SS" : role === "faculty" ? "ER" : "G"}
              </span>
              <span className="hidden leading-tight lg:block">
                <strong className="block text-sm">{person}</strong>
                <span className="text-xs capitalize text-[#6b6d69]">
                  {role}
                </span>
              </span>
              <Icon name="chevron" size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-14 w-64 rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-2 shadow-xl">
                <button
                  onClick={() => {
                    onView("profile")
                    setMenuOpen(false)
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-3 text-sm hover:bg-[#f2efe8]"
                >
                  <Icon name="user" /> View profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onSignOut()
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-3 text-left text-sm hover:bg-[#f2efe8]"
                >
                  <Icon name="logout" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function ProjectCard({
  project,
  onOpen,
  faculty,
}: {
  project: Project
  onOpen: () => void
  faculty: boolean
}) {
  const colors: Record<string, string> = {
    "AI / Machine Learning": "bg-[#e7efeb]",
    "Mobile Application": "bg-[#e8eff3]",
    Cybersecurity: "bg-[#f1e8e8]",
    "Web Application": "bg-[#f2efdf]",
    "Hardware / Embedded Systems": "bg-[#ece9f1]",
  }
  return (
    <article className="flex min-h-72 flex-col rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-6 shadow-[0_3px_12px_rgba(24,26,24,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-xs font-semibold ${colors[project.category]}`}
          >
            {project.category}
          </span>
          <span className="text-xs text-[#777873]">
            {project.term} {project.year}
          </span>
        </div>
        <button
          onClick={onOpen}
          className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-semibold text-[#a92d35] hover:underline"
        >
          {faculty ? "Edit project" : "Open details"}{" "}
          <Icon name={faculty ? "edit" : "arrow"} size={15} />
        </button>
      </div>
      <h3 className="mt-3 text-xl font-bold leading-tight tracking-tight">
        {project.title}
      </h3>
      <p className="mt-4 flex-1 text-[15px] leading-6 text-[#70716d]">
        {project.description}
      </p>
      <div className="mt-5 border-t border-[#dfddd6] pt-4">
        <p className="flex items-center gap-2 text-sm">
          <Icon name="users" size={17} /> {project.team}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-[#d5d3cd] px-2 py-1 text-xs text-[#72736f]"
            >
              {tag}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2 text-xs text-[#347153]">
            <Icon name="github" size={17} />
            <i className="size-1.5 rounded-full bg-[#39775a]" />
            {project.access}
          </span>
        </div>
      </div>
    </article>
  )
}

function ProjectsView({
  role,
  projects: archiveProjects,
  loadError,
  onOpen,
}: {
  role: Role
  projects: Project[]
  loadError: string
  onOpen: (project: Project) => void
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All categories")
  const [year, setYear] = useState("All years")

  const filtered = useMemo(
    () =>
      archiveProjects.filter(
        (project) =>
          (!query ||
            `${project.title} ${project.team} ${project.tags.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (category === "All categories" || project.category === category) &&
          (year === "All years" || String(project.year) === year),
      ),
    [archiveProjects, query, category, year],
  )

  const years = [...new Set(filtered.map((project) => project.year))].sort(
    (a, b) => b - a,
  )
  return (
    <main className="mx-auto max-w-[1450px] px-6 py-12 lg:px-14 lg:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
            Capstone archive
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">
            {role !== "faculty"
              ? "Explore approved projects"
              : "Project archive"}
          </h1>
          <p className="mt-3 text-[#71726e]">
            {role !== "faculty"
              ? "Discover teams, technologies, and ideas from across the University of Tampa."
              : "Browse, maintain, and curate approved capstone records."}
          </p>
        </div>
        <p className="hidden text-sm text-[#71726e] md:block">
          {filtered.length} approved projects
        </p>
      </div>

      <section className="mt-9 rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_0.9fr_0.7fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#5b5d59]">
              Keywords
            </span>
            <span className="flex items-center gap-3 rounded border border-[#d6d4ce] px-3">
              <Icon name="search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[#777873]"
                placeholder="Search titles, teams, or topics"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#5b5d59]">
              Technologies & languages
            </span>
            <select className="h-12 w-full rounded border border-[#d6d4ce] bg-transparent px-3 text-sm">
              <option>All technologies</option>
              <option>React</option>
              <option>Python</option>
              <option>Swift</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#5b5d59]">
              Project type
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded border border-[#d6d4ce] bg-transparent px-3 text-sm"
            >
              <option>All categories</option>
              {[
                ...new Set(archiveProjects.map((project) => project.category)),
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#5b5d59]">
              Academic year
            </span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="h-12 w-full rounded border border-[#d6d4ce] bg-transparent px-3 text-sm"
            >
              <option>All years</option>
              <option>2026</option>
              <option>2025</option>
            </select>
          </label>
          <button className="mt-auto h-12 cursor-pointer rounded bg-[#171a18] px-8 text-sm font-semibold text-white hover:bg-black">
            Search
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[#747570]">
          <span>
            Filter by Python, JavaScript, Java, C++, project type, or year.
          </span>
          <button
            onClick={() => {
              setQuery("")
              setCategory("All categories")
              setYear("All years")
            }}
            className="flex cursor-pointer items-center gap-2 font-semibold text-[#a92d35]"
          >
            <Icon name="refresh" size={16} /> Clear all filters
          </button>
        </div>
      </section>

      {loadError && (
        <p className="mt-6 rounded border border-[#e6c6c6] bg-[#fbefef] p-4 text-sm text-[#8f252d]">
          Could not load approved projects: {loadError}
        </p>
      )}

      {years.map((groupYear) => {
        const group = filtered.filter((project) => project.year === groupYear)
        return (
          <section key={groupYear} className="mt-10">
            <div className="mb-5 flex items-center gap-4">
              <h2 className="text-3xl font-semibold">{groupYear}</h2>
              <span className="h-px flex-1 bg-[#d8d6cf]" />
              <span className="text-xs text-[#747570]">
                {group.length} projects
              </span>
            </div>
            <div
              className={`grid gap-4 ${
                group.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"
              }`}
            >
              {group.map((project) => (
                <ProjectCard
                  faculty={role === "faculty"}
                  key={project.title}
                  project={project}
                  onOpen={() => onOpen(project)}
                />
              ))}
            </div>
          </section>
        )
      })}
      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-xl font-semibold">
            No projects match those filters.
          </p>
          <p className="mt-2 text-sm text-[#71726e]">
            Try a broader keyword or clear all filters.
          </p>
        </div>
      )}
    </main>
  )
}

function Metric({
  label,
  value,
  icon,
  detail,
}: {
  label: string
  value: string
  icon: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-[#d9d7d0] bg-[#fffefa] p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#71726e]">{label}</span>
        <span className="grid size-9 place-items-center rounded bg-[#f1eee7] text-[#a92d35]">
          <Icon name={icon} />
        </span>
      </div>
      <strong className="mt-4 block text-3xl font-semibold">{value}</strong>
      <span className="mt-1 block text-xs text-[#777873]">{detail}</span>
    </div>
  )
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
    <main className="mx-auto max-w-[1320px] px-6 py-12 lg:px-14">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
            Student workspace
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">
            My submissions
          </h1>
          <p className="mt-3 text-[#71726e]">
            Track feedback and keep your project record up to date.
          </p>
        </div>
        <button
          onClick={onSubmit}
          className="cursor-pointer rounded bg-[#a92d35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f252d]"
        >
          New submission
        </button>
      </div>
      {loadError && (
        <p className="mt-6 rounded bg-[#fbefef] p-3 text-sm text-[#8f252d]">
          Could not load your submissions: {loadError}
        </p>
      )}
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        <Metric
          label="Total submissions"
          value={String(items.length)}
          icon="folder"
          detail="Across 2 academic years"
        />
        <Metric
          label="Awaiting review"
          value={String(
            items.filter((item) => item.status === "In review").length,
          )}
          icon="clock"
          detail="Usually reviewed in 3–5 days"
        />
        <Metric
          label="Published"
          value={String(
            items.filter((item) => item.status === "Approved").length,
          )}
          icon="check"
          detail="Visible in the project archive"
        />
      </div>
      <section className="mt-8 overflow-hidden rounded-lg border border-[#d9d7d0] bg-[#fffefa]">
        <div className="border-b border-[#dfddd6] px-6 py-5">
          <h2 className="text-lg font-semibold">Recent submissions</h2>
        </div>
        {items.map((item) => (
          <div
            key={item.id ?? item.title}
            className="grid gap-4 border-b border-[#e2e0da] px-6 py-5 last:border-0 md:grid-cols-[1fr_180px_1fr_auto] md:items-center"
          >
            <div>
              <strong className="block">{item.title}</strong>
              <span className="mt-1 block text-xs text-[#777873]">
                {item.updated}
              </span>
            </div>
            <div>
              <Badge
                tone={
                  item.status === "Approved"
                    ? "green"
                    : item.status === "Changes requested"
                      ? "amber"
                      : item.status === "Rejected"
                        ? "red"
                        : item.status === "Archived"
                          ? "neutral"
                          : "blue"
                }
              >
                {item.status}
              </Badge>
            </div>
            <p className="text-sm text-[#6d6e6a]">{item.note}</p>
            <button className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#a92d35]">
              <Icon name="edit" size={16} />
              {item.status === "Approved" ? "View" : "Edit"}
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-[#71726e]">
            You haven’t submitted a project yet.
          </p>
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
  return (
    <main className="mx-auto max-w-[1320px] px-6 py-12 lg:px-14">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#a92d35]">
          Faculty workspace
        </p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">
          Submission review
        </h1>
        <p className="mt-3 text-[#71726e]">
          Evaluate student work before it enters the public archive.
        </p>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        <Metric
          label="Awaiting review"
          value={String(
            items.filter((item) => item.status === "pending_review").length,
          )}
          icon="clock"
          detail="2 added this week"
        />
        <Metric
          label="Approved this term"
          value={String(approvedCount)}
          icon="check"
          detail="Visible in the public archive"
        />
        <Metric
          label="Changes requested"
          value={String(
            items.filter((item) => item.status === "changes_requested").length,
          )}
          icon="edit"
          detail="Students have been notified"
        />
      </div>
      <section className="mt-8 rounded-lg border border-[#d9d7d0] bg-[#fffefa]">
        <div className="flex items-center justify-between border-b border-[#dfddd6] px-6 py-5">
          <h2 className="text-lg font-semibold">Review queue</h2>
          <span className="text-xs text-[#777873]">
            Oldest submissions first
          </span>
        </div>
        {(error || loadError) && (
          <p className="m-5 rounded bg-[#fbefef] p-3 text-sm text-[#8f252d]">
            {error || loadError}
          </p>
        )}
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-5 border-b border-[#e2e0da] px-6 py-6 last:border-0 lg:grid-cols-[1fr_180px_150px_auto] lg:items-center"
          >
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="blue">{item.type}</Badge>
                <span className="text-xs text-[#777873]">{item.submitted}</span>
              </div>
              <h3 className="text-lg font-semibold">{item.project}</h3>
              <p className="mt-1 text-sm text-[#6d6e6a]">
                Submitted by {item.student}
              </p>
            </div>
            {decisions[item.id] ? (
              <Badge
                tone={decisions[item.id] === "Approved" ? "green" : "amber"}
              >
                {decisions[item.id]}
              </Badge>
            ) : (
              <Badge
                tone={item.status === "changes_requested" ? "amber" : "blue"}
              >
                {item.status === "changes_requested"
                  ? "Changes requested"
                  : "Ready for review"}
              </Badge>
            )}
            <button className="cursor-pointer text-left text-sm font-semibold text-[#a92d35] hover:underline">
              View submission
            </button>
            <div className="flex gap-2">
              <button
                disabled={saving}
                onClick={() => void decide(item, "changes_requested")}
                className="cursor-pointer rounded border border-[#b7b5ae] px-4 py-2 text-sm font-semibold hover:bg-[#f2efe8]"
              >
                Request changes
              </button>
              <button
                disabled={saving}
                onClick={() => void decide(item, "approved")}
                className="cursor-pointer rounded bg-[#a92d35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f252d]"
              >
                Approve
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-[#71726e]">
            There are no projects waiting for review.
          </p>
        )}
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

  return (
    <main className="grid min-h-screen bg-[#f4f1ea] lg:grid-cols-[38%_62%]">
      <section className="relative hidden min-h-screen flex-col bg-[#171a18] px-14 py-14 text-white lg:flex xl:px-20">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded border border-white/80 text-lg font-bold">
            D
          </span>
          <span>
            <strong className="block text-xl tracking-tight">DEIMOS</strong>
            <span className="block text-xs tracking-wide text-white/50">
              THE UNIVERSITY OF TAMPA
            </span>
          </span>
        </div>
        <div className="my-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">
            Capstone archive
          </p>
          <h1 className="mt-7 text-5xl font-medium leading-[1.08] tracking-tight xl:text-6xl">
            Discover what students build. Preserve what they learn.
          </h1>
          <p className="mt-8 max-w-sm text-lg leading-7 text-white/65">
            A living archive of University of Tampa capstone projects, teams,
            and technical ideas.
          </p>
        </div>
        <p className="text-xs text-white/35">
          Built for students, faculty, and future collaborators.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-xl rounded-xl bg-[#fffefa] p-7 shadow-[0_18px_45px_rgba(23,26,24,0.09)] sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded bg-[#171a18] text-sm font-bold text-white">
              D
            </span>
            <strong className="text-lg">DEIMOS</strong>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Welcome to Deimos
          </h2>
          <p className="mt-2 text-[#6f716d]">
            Choose how you’d like to explore the capstone archive.
          </p>
          {demoMode && (
            <p className="mt-4 rounded border border-[#ead9ae] bg-[#fbf5e6] p-3 text-sm text-[#765c21]">
              Demo mode: connect Supabase to enable real accounts and saved
              projects.
            </p>
          )}

          {accountRole !== "guest" && (
            <div className="mt-7 grid grid-cols-2 rounded-lg bg-[#edeae3] p-1">
              <button
                onClick={() => setMode("signin")}
                className={`cursor-pointer rounded-md py-3 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-[#fffefa] shadow-sm"
                    : "text-[#6f716d]"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode("create")}
                className={`cursor-pointer rounded-md py-3 text-sm font-semibold transition ${
                  mode === "create"
                    ? "bg-[#fffefa] shadow-sm"
                    : "text-[#6f716d]"
                }`}
              >
                Create account
              </button>
            </div>
          )}

          <p className="mt-7 text-sm font-semibold">
            {accountRole === "guest"
              ? "Browse the archive as a..."
              : `I am ${
                  mode === "create" ? "creating an" : "signing in to an"
                }...`}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["student", "faculty", "guest"] as Role[]).map((item) => {
              const active = accountRole === item
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAccountRole(item)}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 text-left transition ${
                    active
                      ? "border-[#a92d35] bg-[#f8eeee]"
                      : "border-[#dedbd4] hover:border-[#aaa7a0]"
                  }`}
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-md ${
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
                            : "user"
                      }
                      size={22}
                    />
                  </span>
                  <span>
                    <strong className="block text-sm capitalize">
                      {item === "guest" ? "Guest access" : `${item} account`}
                    </strong>
                    <span className="mt-1 block text-xs leading-4 text-[#6f716d]">
                      {item === "student"
                        ? "Submit work and manage your project."
                        : item === "faculty"
                          ? "Review, approve, and curate projects."
                          : "Browse approved projects without an account."}
                    </span>
                  </span>
                  <i
                    className={`ml-auto size-4 shrink-0 rounded-full border ${
                      active
                        ? "border-[#a92d35] bg-[#a92d35]"
                        : "border-[#b9b7b0]"
                    }`}
                  />
                </button>
              )
            })}
          </div>

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
              <button
                type="submit"
                className="h-14 w-full cursor-pointer rounded-lg bg-[#a92d35] text-sm font-semibold text-white transition hover:bg-[#8f252d]"
              >
                Continue as guest
              </button>
            ) : (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    University email
                  </span>
                  <span className="flex h-13 items-center gap-3 rounded-lg border border-[#d6d4ce] px-4 focus-within:border-[#a92d35]">
                    <Icon name="mail" className="text-[#777873]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={
                        accountRole === "student"
                          ? "name@spartans.ut.edu"
                          : "name@ut.edu"
                      }
                      className="h-full w-full bg-transparent text-sm outline-none"
                    />
                  </span>
                </label>
                <div
                  className={`mt-5 grid gap-4 ${
                    mode === "create" ? "sm:grid-cols-2" : ""
                  }`}
                >
                  <label>
                    <span className="mb-2 flex items-center justify-between text-sm font-semibold">
                      Password
                      {mode === "signin" && (
                        <button
                          type="button"
                          className="cursor-pointer text-xs text-[#a92d35]"
                        >
                          Forgot password?
                        </button>
                      )}
                    </span>
                    <span className="flex h-13 items-center gap-3 rounded-lg border border-[#d6d4ce] px-4 focus-within:border-[#a92d35]">
                      <Icon name="lock" className="text-[#777873]" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        className="h-full w-full bg-transparent text-sm outline-none"
                      />
                    </span>
                  </label>
                  {mode === "create" && (
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        Confirm password
                      </span>
                      <span className="flex h-13 items-center gap-3 rounded-lg border border-[#d6d4ce] px-4 focus-within:border-[#a92d35]">
                        <Icon name="lock" className="text-[#777873]" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Re-enter password"
                          className="h-full w-full bg-transparent text-sm outline-none"
                        />
                      </span>
                    </label>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 h-14 w-full cursor-pointer rounded-lg bg-[#a92d35] text-sm font-semibold text-white transition hover:bg-[#8f252d]"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "signin"
                      ? `Sign in as ${accountRole}`
                      : `Create ${accountRole} account`}
                </button>
              </>
            )}
          </form>
          {(formError || error) && (
            <p className="mt-4 rounded bg-[#fbefef] p-3 text-sm text-[#8f252d]">
              {formError || error}
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded bg-[#e8f1ea] p-3 text-sm text-[#347153]">
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

  const changeRole = (nextRole: Role) => {
    setRole(nextRole)
    setView(nextRole === "faculty" ? "review" : "projects")
  }

  const loadUserRole = async (userId: string) => {
    const accountRole = await getProfileRole(userId)
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
        if (data.session?.user) await loadUserRole(data.session.user.id)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
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
      await loadUserRole(data.user.id)
    } catch (error) {
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
    if (!supabase) return
    await reviewProject(projectId, decision)
    const [queueRows, projectRows] = await Promise.all([
      getReviewQueue(),
      getApprovedProjects(),
    ])
    setReviewQueue(queueRows.map(toReviewItem))
    setArchiveProjects(projectRows.map(toProject))
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
    <div className="min-h-screen bg-[#f4f1ea] text-[#171a18]">
      <Header
        role={role}
        view={view}
        onView={setView}
        onSubmit={() => setSubmitOpen(true)}
        onSignOut={() => {
          setAuthenticated(false)
          if (supabase) void supabase.auth.signOut()
          setRole("student")
          setView("projects")
          setSubmitOpen(false)
          setSelectedProject(null)
        }}
      />
      {view === "projects" && (
        <ProjectsView
          role={role}
          projects={archiveProjects}
          loadError={projectLoadError}
          onOpen={(project) => setSelectedProject(project)}
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
      {view === "profile" && <ProfileView role={role} />}
      {submitOpen && role === "student" && (
        <SubmitModal
          onClose={() => setSubmitOpen(false)}
          onSubmit={handleProjectSubmit}
        />
      )}
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
