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
  card_image_path: string | null
  additional_media_paths: string[]
  card_image_url?: string | null
  additional_media?: { url: string; type: "image" | "video" }[]
}

export type ProjectSubmission = {
  title: string
  category: string
  term: "Spring" | "Fall" | "Summer"
  academicYear: number
  description: string
  teamMembers: string[]
  repositoryUrl: string | null
  cardImage: File | null
  additionalMedia: File[]
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

export type AuthorizedUser = {
  email: string
  role: "student" | "faculty" | "admin"
  created_at: string
}

export async function getProfileRole(userId: string) {
  const client = requireSupabase()
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userId)
    .single()

  if (profileError) throw profileError
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  const email = userData.user?.email?.toLowerCase()
  if (!email) throw new Error("This account does not have a verified email.")

  const { data: authorization, error: authorizationError } = await client
    .from("authorized_users")
    .select("role")
    .eq("email", email)
    .maybeSingle()
  if (authorizationError) throw authorizationError
  if (!authorization || !profile)
    throw new Error("This email is not authorized to access Deimos.")
  if (authorization.role === "admin" && !profile.is_admin)
    throw new Error("Administrator access has not been configured for this account.")
  return authorization.role as "student" | "faculty" | "admin"
}

export async function getAuthorizedUsers() {
  const client = requireSupabase()
  const { data, error } = await client
    .from("authorized_users")
    .select("email, role, created_at")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as AuthorizedUser[]
}

export async function addAuthorizedUser(
  email: string,
  role: AuthorizedUser["role"],
) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error("Sign in with an admin account first.")
  const { error } = await client.from("authorized_users").insert({
    email: email.trim().toLowerCase(),
    role,
    added_by: userData.user.id,
  })
  if (error) throw error
}

export async function removeAuthorizedUser(email: string) {
  const client = requireSupabase()
  const { error } = await client
    .from("authorized_users")
    .delete()
    .eq("email", email.toLowerCase())
  if (error) throw error
}

export async function getApprovedProjects() {
  const client = requireSupabase()
  const { data, error } = await client
    .from("projects")
    .select(
      "id, title, category, term, academic_year, description, team_members, technologies, repository_url, repository_access, card_image_path, additional_media_paths",
    )
    .eq("status", "approved")
    .order("academic_year", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as ArchiveProjectRow[]
  const paths = rows.flatMap((row) => [
    ...(row.card_image_path ? [row.card_image_path] : []),
    ...row.additional_media_paths,
  ])
  const signed = new Map<string, string>()
  if (paths.length) {
    const { data: urls, error: urlError } = await client.storage
      .from("project-media")
      .createSignedUrls(paths, 60 * 60)
    if (urlError) throw urlError
    for (const item of urls ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl)
    }
  }
  return rows.map((row) => ({
    ...row,
    card_image_url: row.card_image_path
      ? signed.get(row.card_image_path) ?? null
      : null,
    additional_media: row.additional_media_paths.flatMap((path) => {
      const url = signed.get(path)
      if (!url) return []
      const extension = path.split(".").pop()?.toLowerCase()
      const type: "video" | "image" = [
        "mp4",
        "mov",
        "webm",
        "m4v",
      ].includes(extension ?? "")
        ? "video"
        : "image"
      return [{ url, type }]
    }),
  }))
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

  const projectId = crypto.randomUUID()
  const uploadedPaths: string[] = []
  const upload = async (file: File, key: string) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin"
    const path = `${userData.user.id}/${projectId}/${key}-${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await client.storage
      .from("project-media")
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError
    uploadedPaths.push(path)
    return path
  }

  try {
    const cardImagePath = submission.cardImage
      ? await upload(submission.cardImage, "card")
      : null
    const additionalMediaPaths: string[] = []
    for (const [index, file] of submission.additionalMedia.entries()) {
      additionalMediaPaths.push(await upload(file, `detail-${index + 1}`))
    }
    const { error } = await client.from("projects").insert({
      id: projectId,
      title: submission.title,
      category: submission.category,
      term: submission.term,
      academic_year: submission.academicYear,
      description: submission.description,
      team_members: submission.teamMembers,
      repository_url: submission.repositoryUrl,
      submitted_by: userData.user.id,
      status: "pending_review",
      card_image_path: cardImagePath,
      additional_media_paths: additionalMediaPaths,
    })

    if (error) throw error
  } catch (error) {
    if (uploadedPaths.length) {
      await client.storage.from("project-media").remove(uploadedPaths)
    }
    throw error
  }
}
