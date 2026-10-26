import { requireSupabase } from "./supabase"

export type ArchiveProjectRow = {
  id: string
  title: string
  category: string
  term: string
  academic_year: number
  description: string
  team_members: string[]
  technologies: string[]
  repository_url: string | null
  repository_access: "Public repository" | "University access"
}

export type ProjectSubmission = {
  title: string
  category: string
  term: "Spring" | "Fall" | "Summer"
  academicYear: number
  description: string
  teamMembers: string[]
  repositoryUrl: string | null
}

export type SubmissionRow = {
  id: string
  title: string
  status: "pending_review" | "changes_requested" | "approved" | "rejected" | "archived"
  review_note: string | null
  created_at: string
}

export type ReviewQueueRow = {
  id: string
  title: string
  category: string
  created_at: string
  status: "pending_review" | "changes_requested"
}

export async function getProfileRole(userId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data.role as "student" | "faculty"
}

export async function getApprovedProjects() {
  const client = requireSupabase()
  const { data, error } = await client
    .from("projects")
    .select(
      "id, title, category, term, academic_year, description, team_members, technologies, repository_url, repository_access",
    )
    .eq("status", "approved")
    .order("academic_year", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as ArchiveProjectRow[]
}

export async function getMySubmissions() {
  const client = requireSupabase()
  const { data, error } = await client
    .from("projects")
    .select("id, title, status, review_note, created_at")
    .not("submitted_by", "is", null)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as SubmissionRow[]
}

export async function getReviewQueue() {
  const client = requireSupabase()
  const { data, error } = await client
    .from("projects")
    .select("id, title, category, created_at, status")
    .in("status", ["pending_review", "changes_requested"])
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as ReviewQueueRow[]
}

export async function reviewProject(
  projectId: string,
  decision: "approved" | "changes_requested",
) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user)
    throw new Error("Sign in with a faculty account to review.")

  const { error } = await client
    .from("projects")
    .update({
      status: decision,
      reviewed_by: userData.user.id,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", projectId)

  if (error) throw error
}

export async function submitProject(submission: ProjectSubmission) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user)
    throw new Error("Sign in with a student account to submit.")

  const { error } = await client.from("projects").insert({
    title: submission.title,
    category: submission.category,
    term: submission.term,
    academic_year: submission.academicYear,
    description: submission.description,
    team_members: submission.teamMembers,
    repository_url: submission.repositoryUrl,
    submitted_by: userData.user.id,
    status: "pending_review",
  })

  if (error) throw error
}
