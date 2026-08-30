// Public FreeResumePost pages only render profiles created through this site's
// own upload flow. Shared CRM records and imported candidate data stay private.
export const FREE_RESUME_POST_UPLOAD_SOURCE = 'freeresumepost.upload.v1'

type PublicProfileBoundary = {
  source?: unknown
  is_public?: unknown
  status?: unknown
  deleted_at?: unknown
}

export function isPublishableFreeResumePostProfile(profile: PublicProfileBoundary): boolean {
  return (
    profile.source === FREE_RESUME_POST_UPLOAD_SOURCE &&
    profile.is_public === true &&
    profile.status === 'active' &&
    profile.deleted_at == null
  )
}
