-- FreeResumePost release inventory.
-- Read-only by construction. Every result is a count or schema permission.
-- It does not return names, email addresses, phone numbers, resume text, tokens,
-- object names, or other candidate-level data.

BEGIN TRANSACTION READ ONLY;

WITH classified_candidates AS (
  SELECT
    c.id,
    c.email,
    c.status,
    c.deleted_at,
    c.resume_url,
    CASE
      WHEN c.source = 'freeresumepost.upload.v1'
        THEN 'source_marked'
      WHEN c.parsed_profile->>'source' = 'freeresumepost.upload.v1'
        THEN 'proven_pending_backfill'
      WHEN c.source = 'self_upload'
        THEN 'unmarked_self_upload'
      ELSE 'other'
    END AS provenance
  FROM public.public_candidates c
),
token_counts AS (
  SELECT
    n.entity_id,
    bool_or(n.created_at >= now() - interval '7 days') AS has_current_token
  FROM public.marketplace_notifications n
  WHERE n.type = 'candidate_edit_token'
    AND n.entity_type = 'public_candidates'
  GROUP BY n.entity_id
)
SELECT
  c.provenance,
  count(*) AS total_rows,
  count(*) FILTER (
    WHERE c.status = 'active' AND c.deleted_at IS NULL
  ) AS active_rows,
  count(*) FILTER (WHERE c.resume_url IS NOT NULL) AS rows_with_resume_path,
  count(*) FILTER (WHERE t.entity_id IS NOT NULL) AS rows_with_any_edit_token,
  count(*) FILTER (WHERE t.has_current_token) AS rows_with_current_edit_token,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE lower(u.email) = lower(c.email)
    )
  ) AS rows_with_matching_auth_user
FROM classified_candidates c
LEFT JOIN token_counts t ON t.entity_id = c.id
GROUP BY c.provenance
ORDER BY c.provenance;

SELECT
  count(*) AS total_resume_bucket_objects,
  count(*) FILTER (
    WHERE o.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|docx)$'
  ) AS supported_root_objects,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM public.public_candidates c
      WHERE c.resume_url = o.name
        AND c.source = 'freeresumepost.upload.v1'
    )
  ) AS referenced_by_source_marked_rows,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM public.public_candidates c
      WHERE c.resume_url = o.name
        AND c.source IS DISTINCT FROM 'freeresumepost.upload.v1'
        AND c.parsed_profile->>'source' = 'freeresumepost.upload.v1'
    )
  ) AS referenced_by_proven_pending_backfill_rows
FROM storage.objects o
WHERE o.bucket_id = 'resumes';

SELECT
  id,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'resumes';

SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee IN ('PUBLIC', 'anon', 'authenticated')
  AND table_schema IN ('public', 'storage')
ORDER BY grantee, table_schema, table_name, privilege_type;

SELECT
  grantee,
  specific_schema,
  specific_name,
  routine_name,
  privilege_type
FROM information_schema.routine_privileges
WHERE grantee IN ('PUBLIC', 'anon', 'authenticated')
  AND specific_schema = 'public'
ORDER BY grantee, routine_name, specific_name, privilege_type;

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

COMMIT;
