-- FreeResumePost standalone boundary.
--
-- Deployment order matters: apply this shared-database migration before the
-- frontend that calls the new source-scoped RPCs. This migration is safe to
-- apply while the previous frontend is still running because every existing
-- RPC signature remains available.
--
-- This deliberately does not delete public_matches, hot_match notifications,
-- or direct job applications. It stops future automatic match generation and
-- leaves historical rows available for a separately approved retention pass.

-- Rows created by the FreeResumePost browser flow already carry this durable
-- marker in parsed_profile. Backfill only those known-provenance rows. Do not
-- guess that every legacy `self_upload` row belongs to this product.
UPDATE public.public_candidates
SET
  source = 'freeresumepost.upload.v1',
  remote_only = false,
  contact_via_email = false,
  contact_via_sms = false,
  parsed_profile = CASE
    WHEN jsonb_typeof(parsed_profile) = 'object'
      THEN parsed_profile
        - 'freeresumepost_resume_window_started_at'
        - 'freeresumepost_resume_window_count'
    ELSE jsonb_build_object('source', 'freeresumepost.upload.v1')
  END,
  updated_at = now()
WHERE parsed_profile->>'source' = 'freeresumepost.upload.v1'
  AND (
    source IS DISTINCT FROM 'freeresumepost.upload.v1'
    OR remote_only IS DISTINCT FROM false
    OR contact_via_email IS DISTINCT FROM false
    OR contact_via_sms IS DISTINCT FROM false
    OR parsed_profile ? 'freeresumepost_resume_window_started_at'
    OR parsed_profile ? 'freeresumepost_resume_window_count'
  );

-- Keep the legacy signature during the coordinated rollout, but enforce the
-- standalone product boundary inside the SECURITY DEFINER function. The
-- currently deployed uploader sends a private-bucket path after uploading the
-- file first. Preserve that path only when it is a canonical UUID PDF/DOCX
-- object that already exists with the matching MIME type. The replacement
-- frontend sends NULL here, then uses the nonce-gated attachment RPC after the
-- profile exists. Matching/contact inputs stay ignored in both flows.
CREATE OR REPLACE FUNCTION public.submit_public_candidate_rpc(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_credential text,
  p_specialty text,
  p_city text,
  p_state text,
  p_years_experience integer,
  p_remote_only boolean,
  p_contact_via_email boolean,
  p_contact_via_sms boolean,
  p_is_public boolean,
  p_resume_url text,
  p_parsed_profile jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate_id uuid;
  v_email_lc text;
  v_nonce text;
  v_recent_count integer;
  v_slug text;
  v_slug_base text;
  v_suffix text;
  v_resume_path text;
BEGIN
  v_email_lc := lower(trim(coalesce(p_email, '')));

  IF v_email_lc !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(v_email_lc) > 254 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email', 'code', 400);
  END IF;
  IF length(trim(coalesce(p_first_name, ''))) NOT BETWEEN 1 AND 100
     OR length(trim(coalesce(p_last_name, ''))) NOT BETWEEN 1 AND 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'First and last name must be 1-100 characters',
      'code', 400
    );
  END IF;
  IF length(trim(coalesce(p_phone, ''))) > 30
     OR length(trim(coalesce(p_credential, ''))) > 20
     OR length(trim(coalesce(p_specialty, ''))) > 100
     OR length(trim(coalesce(p_city, ''))) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'One or more fields are too long', 'code', 400);
  END IF;
  IF nullif(upper(trim(coalesce(p_state, ''))), '') IS NOT NULL
     AND NOT (upper(trim(p_state)) = ANY (ARRAY[
       'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
       'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
       'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
       'VA','WA','WV','WI','WY','DC'
     ]::text[])) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a valid U.S. state', 'code', 400);
  END IF;
  IF p_years_experience IS NOT NULL
     AND p_years_experience NOT BETWEEN 0 AND 60 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Years of experience must be between 0 and 60', 'code', 400);
  END IF;

  -- Rolling-deploy compatibility for the old upload-first browser. Empty and
  -- NULL paths are valid profile-only submissions. Every non-empty path must
  -- be a root-level UUID object with a lowercase PDF/DOCX extension, must
  -- already exist in the private resumes bucket, and must have the MIME type
  -- that matches its extension. This rejects dangling or type-confused paths
  -- before a candidate row is inserted.
  v_resume_path := nullif(p_resume_url, '');
  IF v_resume_path IS NOT NULL THEN
    IF v_resume_path <> trim(v_resume_path)
       OR v_resume_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|docx)$'
       OR NOT EXISTS (
         SELECT 1
         FROM storage.objects o
         WHERE o.bucket_id = 'resumes'
           AND o.name = v_resume_path
           AND lower(coalesce(o.metadata->>'mimetype', '')) = CASE
             WHEN v_resume_path ~ '\.pdf$' THEN 'application/pdf'
             WHEN v_resume_path ~ '\.docx$' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
             ELSE ''
           END
       ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid resume attachment', 'code', 400);
    END IF;
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.public_candidates
  WHERE lower(email) = v_email_lc
    AND source = 'freeresumepost.upload.v1'
    AND created_at >= now() - interval '24 hours';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many uploads from this email in the past 24 hours.',
      'code', 429
    );
  END IF;

  v_slug_base := public.slugify(
    trim(p_first_name) || ' ' || trim(p_last_name) ||
    CASE WHEN nullif(trim(coalesce(p_state, '')), '') IS NOT NULL
      THEN ' ' || upper(trim(p_state)) ELSE '' END ||
    CASE WHEN nullif(trim(coalesce(p_credential, '')), '') IS NOT NULL
      THEN ' ' || trim(p_credential) ELSE '' END
  );
  IF coalesce(length(v_slug_base), 0) = 0 THEN
    v_slug_base := 'healthcare-profile';
  END IF;

  LOOP
    v_suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    v_slug := v_slug_base || '-' || v_suffix;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.public_candidates WHERE slug = v_slug
    );
  END LOOP;

  v_nonce := md5(random()::text || clock_timestamp()::text) ||
             md5(random()::text || gen_random_uuid()::text);

  INSERT INTO public.public_candidates (
    slug,
    first_name,
    last_name,
    email,
    phone,
    credential,
    specialty,
    vertical,
    city,
    state,
    resume_url,
    parsed_profile,
    years_experience,
    remote_only,
    is_public,
    contact_via_email,
    contact_via_sms,
    source,
    status
  ) VALUES (
    v_slug,
    trim(p_first_name),
    trim(p_last_name),
    v_email_lc,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_credential, '')), ''),
    nullif(trim(coalesce(p_specialty, '')), ''),
    'healthcare',
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(upper(trim(coalesce(p_state, ''))), ''),
    v_resume_path,
    jsonb_build_object(
      'source', 'freeresumepost.upload.v1',
      'extracted_at', now()::text
    ),
    p_years_experience,
    false,
    coalesce(p_is_public, false),
    false,
    false,
    'freeresumepost.upload.v1',
    'active'
  ) RETURNING id INTO v_candidate_id;

  INSERT INTO public.marketplace_notifications (
    type,
    priority,
    entity_type,
    entity_id,
    message,
    metadata
  ) VALUES (
    'candidate_edit_token',
    4,
    'public_candidates',
    v_candidate_id,
    'FreeResumePost edit token issued',
    jsonb_build_object('nonce', v_nonce, 'issued_at', now()::text)
  );

  RETURN jsonb_build_object(
    'success', true,
    'candidate_id', v_candidate_id,
    'candidate_slug', v_slug,
    'nonce', v_nonce,
    'code', 201
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_candidate_rpc(
  text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean, text, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_candidate_rpc(
  text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean, text, jsonb
) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.submit_public_candidate_rpc(
  text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean, text, jsonb
) IS 'Creates a source-scoped FreeResumePost profile and one seven-day edit token. Does not publish to recruiter matching.';

-- Return only fields required by the edit screens. The three retired boolean
-- fields remain as fixed false values for the previous frontend during the
-- rolling window. The top-level matches array remains present but always
-- empty. This keeps the old UI functional without exposing jobs, recruiter
-- contact settings, parsed resume text, storage paths, or CRM references.
CREATE OR REPLACE FUNCTION public.consume_candidate_edit_rpc(
  p_candidate_id uuid,
  p_nonce text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate public.public_candidates;
BEGIN
  IF p_candidate_id IS NULL OR p_nonce IS NULL OR p_nonce !~ '^[0-9a-fA-F]{64}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input', 'code', 400);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.marketplace_notifications n
    WHERE n.type = 'candidate_edit_token'
      AND n.entity_type = 'public_candidates'
      AND n.entity_id = p_candidate_id
      AND n.metadata->>'nonce' = p_nonce
      AND n.created_at >= now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired edit token', 'code', 401);
  END IF;

  SELECT * INTO v_candidate
  FROM public.public_candidates
  WHERE id = p_candidate_id
    AND source = 'freeresumepost.upload.v1'
    AND status = 'active'
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found', 'code', 404);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'candidate', jsonb_build_object(
      'id', v_candidate.id,
      'slug', v_candidate.slug,
      'first_name', v_candidate.first_name,
      'last_name', v_candidate.last_name,
      'email', v_candidate.email,
      'phone', v_candidate.phone,
      'credential', v_candidate.credential,
      'specialty', v_candidate.specialty,
      'city', v_candidate.city,
      'state', v_candidate.state,
      'years_experience', v_candidate.years_experience,
      'remote_only', false,
      'contact_via_email', false,
      'contact_via_sms', false,
      'is_public', v_candidate.is_public,
      'source', v_candidate.source,
      'has_resume', v_candidate.resume_url IS NOT NULL
    ),
    'matches', '[]'::jsonb,
    'code', 200
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_candidate_edit_rpc(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_candidate_edit_rpc(uuid, text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.consume_candidate_edit_rpc(uuid, text) IS
  'Consumes a FreeResumePost edit token and returns a narrow source-scoped profile. Retired contact flags are false and matches are always empty for rolling compatibility.';

CREATE OR REPLACE FUNCTION public.update_public_candidate_rpc(
  p_candidate_id uuid,
  p_nonce text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_credential text,
  p_specialty text,
  p_city text,
  p_state text,
  p_years_experience integer,
  p_remote_only boolean,
  p_contact_via_email boolean,
  p_contact_via_sms boolean,
  p_is_public boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_candidate_id IS NULL OR p_nonce IS NULL OR p_nonce !~ '^[0-9a-fA-F]{64}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input', 'code', 400);
  END IF;
  IF length(trim(coalesce(p_first_name, ''))) NOT BETWEEN 1 AND 100
     OR length(trim(coalesce(p_last_name, ''))) NOT BETWEEN 1 AND 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'First and last name must be 1-100 characters',
      'code', 400
    );
  END IF;
  IF length(trim(coalesce(p_phone, ''))) > 30
     OR length(trim(coalesce(p_credential, ''))) > 20
     OR length(trim(coalesce(p_specialty, ''))) > 100
     OR length(trim(coalesce(p_city, ''))) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'One or more fields are too long', 'code', 400);
  END IF;
  IF nullif(upper(trim(coalesce(p_state, ''))), '') IS NOT NULL
     AND NOT (upper(trim(p_state)) = ANY (ARRAY[
       'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
       'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
       'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
       'VA','WA','WV','WI','WY','DC'
     ]::text[])) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Choose a valid U.S. state', 'code', 400);
  END IF;
  IF p_years_experience IS NOT NULL
     AND p_years_experience NOT BETWEEN 0 AND 60 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Years of experience must be between 0 and 60', 'code', 400);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.marketplace_notifications n
    WHERE n.type = 'candidate_edit_token'
      AND n.entity_type = 'public_candidates'
      AND n.entity_id = p_candidate_id
      AND n.metadata->>'nonce' = p_nonce
      AND n.created_at >= now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired edit token', 'code', 401);
  END IF;

  UPDATE public.public_candidates
  SET
    first_name = trim(p_first_name),
    last_name = trim(p_last_name),
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    credential = nullif(trim(coalesce(p_credential, '')), ''),
    specialty = nullif(trim(coalesce(p_specialty, '')), ''),
    city = nullif(trim(coalesce(p_city, '')), ''),
    state = nullif(upper(trim(coalesce(p_state, ''))), ''),
    years_experience = p_years_experience,
    remote_only = false,
    contact_via_email = false,
    contact_via_sms = false,
    is_public = coalesce(p_is_public, false),
    updated_at = now()
  WHERE id = p_candidate_id
    AND source = 'freeresumepost.upload.v1'
    AND status = 'active'
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found', 'code', 404);
  END IF;

  RETURN jsonb_build_object('success', true, 'code', 200);
END;
$$;

REVOKE ALL ON FUNCTION public.update_public_candidate_rpc(
  uuid, text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_public_candidate_rpc(
  uuid, text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean
) TO anon, authenticated;

COMMENT ON FUNCTION public.update_public_candidate_rpc(
  uuid, text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean
) IS 'Updates only an active source-scoped FreeResumePost profile with a valid edit token. Matching and contact flags remain disabled.';

CREATE OR REPLACE FUNCTION public.attach_freeresumepost_resume_rpc(
  p_candidate_id uuid,
  p_nonce text,
  p_resume_path text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate public.public_candidates;
  v_previous_resume_path text;
  v_window_started_at timestamptz;
  v_attachment_count integer;
  v_profile jsonb;
BEGIN
  IF p_candidate_id IS NULL
     OR p_nonce IS NULL
     OR p_nonce !~ '^[0-9a-fA-F]{64}$'
     OR p_resume_path IS NULL
     OR p_resume_path <> trim(p_resume_path)
     OR p_resume_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|docx)$'
     OR NOT EXISTS (
       SELECT 1
       FROM storage.objects o
       WHERE o.bucket_id = 'resumes'
         AND o.name = p_resume_path
         AND lower(coalesce(o.metadata->>'mimetype', '')) = CASE
           WHEN p_resume_path ~ '\.pdf$' THEN 'application/pdf'
           WHEN p_resume_path ~ '\.docx$' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
           ELSE ''
         END
     ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid resume attachment', 'code', 400);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.marketplace_notifications n
    WHERE n.type = 'candidate_edit_token'
      AND n.entity_type = 'public_candidates'
      AND n.entity_id = p_candidate_id
      AND n.metadata->>'nonce' = p_nonce
      AND n.created_at >= now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired edit token', 'code', 401);
  END IF;

  SELECT * INTO v_candidate
  FROM public.public_candidates
  WHERE id = p_candidate_id
    AND source = 'freeresumepost.upload.v1'
    AND status = 'active'
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found', 'code', 404);
  END IF;

  -- One valid seven-day nonce must not become an unlimited storage-write
  -- ticket. Keep the rolling 24-hour counter on the source-scoped row so it
  -- is atomic with the attachment update and does not need a new public table.
  BEGIN
    v_window_started_at := nullif(
      v_candidate.parsed_profile->>'freeresumepost_resume_window_started_at',
      ''
    )::timestamptz;
  EXCEPTION WHEN invalid_datetime_format THEN
    v_window_started_at := NULL;
  END;

  BEGIN
    v_attachment_count := coalesce(nullif(
      v_candidate.parsed_profile->>'freeresumepost_resume_window_count',
      ''
    )::integer, 0);
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    v_attachment_count := 0;
  END;
  v_attachment_count := greatest(v_attachment_count, 0);

  IF v_window_started_at IS NULL
     OR v_window_started_at > now()
     OR v_window_started_at < now() - interval '24 hours' THEN
    v_window_started_at := now();
    v_attachment_count := 0;
  END IF;

  IF v_attachment_count >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many resume file changes in the past 24 hours.',
      'code', 429
    );
  END IF;

  v_attachment_count := v_attachment_count + 1;
  v_profile := CASE
    WHEN jsonb_typeof(v_candidate.parsed_profile) = 'object'
      THEN v_candidate.parsed_profile
    ELSE '{}'::jsonb
  END;
  v_profile := jsonb_set(
    jsonb_set(
      v_profile,
      '{freeresumepost_resume_window_started_at}',
      to_jsonb(v_window_started_at),
      true
    ),
    '{freeresumepost_resume_window_count}',
    to_jsonb(v_attachment_count),
    true
  );

  v_previous_resume_path := v_candidate.resume_url;

  UPDATE public.public_candidates
  SET
    resume_url = p_resume_path,
    parsed_profile = v_profile,
    updated_at = now()
  WHERE id = p_candidate_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_resume_path', v_previous_resume_path,
    'code', 200
  );
END;
$$;

REVOKE ALL ON FUNCTION public.attach_freeresumepost_resume_rpc(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_freeresumepost_resume_rpc(uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.attach_freeresumepost_resume_rpc(uuid, text, text) IS
  'Service-only attachment for one MIME-matched private resume. Requires a source-scoped seven-day edit token, caps changes, and returns the previous root path for cleanup.';

CREATE OR REPLACE FUNCTION public.get_my_freeresumepost_candidate()
RETURNS TABLE (
  id uuid,
  slug text,
  first_name text,
  last_name text,
  email text,
  specialty text,
  credential text,
  city text,
  state text,
  status text,
  resume_url text,
  is_public boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    c.id,
    c.slug,
    c.first_name,
    c.last_name,
    c.email,
    c.specialty,
    c.credential,
    c.city,
    c.state,
    c.status,
    c.resume_url,
    c.is_public
  FROM public.public_candidates c
  WHERE auth.uid() IS NOT NULL
    AND nullif(auth.jwt()->>'email', '') IS NOT NULL
    AND lower(c.email) = lower(auth.jwt()->>'email')
    AND c.source = 'freeresumepost.upload.v1'
    AND c.status = 'active'
    AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_freeresumepost_candidate() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_freeresumepost_candidate() TO authenticated;

COMMENT ON FUNCTION public.get_my_freeresumepost_candidate() IS
  'Returns a narrow FreeResumePost profile only when its email matches the authenticated user.';

CREATE OR REPLACE FUNCTION public.issue_my_freeresumepost_edit_token_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate public.public_candidates;
  v_nonce text;
  v_recent_count integer;
BEGIN
  IF auth.uid() IS NULL OR nullif(auth.jwt()->>'email', '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sign in required', 'code', 401);
  END IF;

  SELECT * INTO v_candidate
  FROM public.public_candidates c
  WHERE lower(c.email) = lower(auth.jwt()->>'email')
    AND c.source = 'freeresumepost.upload.v1'
    AND c.status = 'active'
    AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found', 'code', 404);
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.marketplace_notifications n
  WHERE n.type = 'candidate_edit_token'
    AND n.entity_type = 'public_candidates'
    AND n.entity_id = v_candidate.id
    AND n.created_at >= now() - interval '24 hours';

  IF v_recent_count >= 6 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many edit links requested today. Try again tomorrow.',
      'code', 429
    );
  END IF;

  v_nonce := md5(random()::text || clock_timestamp()::text) ||
             md5(random()::text || gen_random_uuid()::text);

  INSERT INTO public.marketplace_notifications (
    type,
    priority,
    entity_type,
    entity_id,
    message,
    metadata
  ) VALUES (
    'candidate_edit_token',
    4,
    'public_candidates',
    v_candidate.id,
    'FreeResumePost edit token issued from authenticated account',
    jsonb_build_object('nonce', v_nonce, 'issued_at', now()::text)
  );

  RETURN jsonb_build_object(
    'success', true,
    'candidate_id', v_candidate.id,
    'candidate_slug', v_candidate.slug,
    'nonce', v_nonce,
    'code', 200
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_my_freeresumepost_edit_token_rpc() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_my_freeresumepost_edit_token_rpc() TO authenticated;

COMMENT ON FUNCTION public.issue_my_freeresumepost_edit_token_rpc() IS
  'Issues a short-lived edit token only for the authenticated user''s own source-scoped FreeResumePost profile.';

CREATE OR REPLACE FUNCTION public.issue_freeresumepost_recovery_link_rpc(
  p_email text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate public.public_candidates;
  v_email_lc text;
  v_nonce text;
  v_recent_count integer;
BEGIN
  v_email_lc := lower(trim(coalesce(p_email, '')));
  IF v_email_lc !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(v_email_lc) > 254 THEN
    RETURN jsonb_build_object('success', false, 'code', 200);
  END IF;

  -- Serialize recovery claims for this source-scoped candidate. The lock makes
  -- the token count and insert one atomic rate-limit decision under concurrent
  -- gateway requests.
  SELECT * INTO v_candidate
  FROM public.public_candidates c
  WHERE c.email = v_email_lc
    AND c.source = 'freeresumepost.upload.v1'
    AND c.status = 'active'
    AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 200);
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.marketplace_notifications n
  WHERE n.type = 'candidate_edit_token'
    AND n.entity_type = 'public_candidates'
    AND n.entity_id = v_candidate.id
    AND n.created_at >= now() - interval '24 hours';

  IF v_recent_count >= 6 THEN
    RETURN jsonb_build_object('success', false, 'code', 200);
  END IF;

  v_nonce := md5(random()::text || clock_timestamp()::text) ||
             md5(random()::text || gen_random_uuid()::text);

  INSERT INTO public.marketplace_notifications (
    type,
    priority,
    entity_type,
    entity_id,
    message,
    metadata
  ) VALUES (
    'candidate_edit_token',
    4,
    'public_candidates',
    v_candidate.id,
    'FreeResumePost edit token re-issued by recovery gateway',
    jsonb_build_object('nonce', v_nonce, 'issued_at', now()::text)
  );

  RETURN jsonb_build_object(
    'success', true,
    'candidate_id', v_candidate.id,
    'candidate_slug', v_candidate.slug,
    'first_name', v_candidate.first_name,
    'email', v_candidate.email,
    'nonce', v_nonce,
    'code', 200
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_freeresumepost_recovery_link_rpc(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_freeresumepost_recovery_link_rpc(text) TO service_role;

COMMENT ON FUNCTION public.issue_freeresumepost_recovery_link_rpc(text) IS
  'Atomically rate-limits and issues one source-scoped recovery token for the service-only FreeResumePost email gateway.';

CREATE OR REPLACE FUNCTION public.check_candidate_email_deleted_rpc(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.public_candidates c
    WHERE lower(c.email) = lower(trim(coalesce(p_email, '')))
      AND c.source = 'freeresumepost.upload.v1'
      AND c.deleted_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.check_candidate_email_deleted_rpc(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_candidate_email_deleted_rpc(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.check_candidate_email_deleted_rpc(text) IS
  'Returns whether an email belongs to a soft-deleted source-scoped FreeResumePost profile.';

-- The retired matching cron is currently part of Ava's critical and silence
-- monitor lists. Remove that name from the existing health-check definition in
-- the same transaction so intentionally unscheduling it cannot open a false
-- operations incident. Preserve every other detector and threshold verbatim.
DO $cron_health$
DECLARE
  current_definition text;
  updated_definition text;
BEGIN
  IF to_regprocedure('public.cron_health_check()') IS NULL THEN
    RAISE EXCEPTION 'public.cron_health_check() is required';
  END IF;

  SELECT pg_get_functiondef('public.cron_health_check()'::regprocedure)
    INTO current_definition;

  updated_definition := regexp_replace(
    current_definition,
    E',\\r?\\n[ \\t]*''refresh-marketplace-matches''\\r?\\n',
    E'\n',
    'g'
  );
  updated_definition := regexp_replace(
    updated_definition,
    E'[ \\t]*\\(''refresh-marketplace-matches'', 30\\),\\r?\\n',
    '',
    'g'
  );

  IF updated_definition LIKE '%refresh-marketplace-matches%' THEN
    RAISE EXCEPTION
      'cron_health_check() no longer matches the expected marketplace monitor definition';
  END IF;

  IF updated_definition <> current_definition THEN
    EXECUTE updated_definition;
  END IF;
END
$cron_health$;

-- Retire the scheduled O(candidates x jobs) aggregate matching pass. Use
-- dynamic SQL so this remains safe in environments where pg_cron is absent.
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    FOR v_job_id IN
      EXECUTE $query$
        SELECT jobid
        FROM cron.job
        WHERE jobname IN ('refresh-marketplace-matches', 'marketplace-match-refresh')
           OR command ILIKE '%refresh_marketplace_matches%'
      $query$
    LOOP
      EXECUTE 'SELECT cron.unschedule($1)' USING v_job_id;
    END LOOP;
  END IF;
EXCEPTION WHEN undefined_table OR invalid_schema_name OR undefined_function THEN
  RAISE NOTICE 'pg_cron unavailable; no marketplace match schedule to remove';
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_marketplace_matches()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_internal_user() THEN
    RAISE EXCEPTION 'permission denied: refresh_marketplace_matches requires internal user'
      USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'disabled', true,
    'reason', 'automatic_matching_retired',
    'inserted', 0,
    'updated', 0,
    'hot_match_notifications', 0,
    'duration_ms', 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_marketplace_matches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_marketplace_matches() TO authenticated, service_role;

COMMENT ON FUNCTION public.refresh_marketplace_matches() IS
  'Retired compatibility no-op. Automatic candidate/job matching is disabled. Historical matches and direct applications are preserved.';

-- Migration-time safety assertions. Fail the transaction if a future edit
-- accidentally restores the cross join or loses the product source marker.
DO $$
DECLARE
  v_definition text;
  v_has_scheduled_job boolean := false;
BEGIN
  v_definition := pg_get_functiondef('public.refresh_marketplace_matches()'::regprocedure);
  IF position('automatic_matching_retired' IN v_definition) = 0
     OR position('CROSS JOIN' IN upper(v_definition)) > 0 THEN
    RAISE EXCEPTION 'Standalone boundary assertion failed: marketplace matching is still active';
  END IF;

  v_definition := pg_get_functiondef('public.cron_health_check()'::regprocedure);
  IF position('refresh-marketplace-matches' IN v_definition) > 0 THEN
    RAISE EXCEPTION 'Standalone boundary assertion failed: retired cron remains monitored';
  END IF;

  v_definition := pg_get_functiondef(
    'public.submit_public_candidate_rpc(text,text,text,text,text,text,text,text,integer,boolean,boolean,boolean,boolean,text,jsonb)'::regprocedure
  );
  IF position('freeresumepost.upload.v1' IN v_definition) = 0
     OR position('''self_upload''' IN v_definition) > 0
     OR position('v_resume_path' IN v_definition) = 0
     OR position('storage.objects' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'Standalone boundary assertion failed: upload source is not scoped';
  END IF;

  v_definition := pg_get_functiondef(
    'public.consume_candidate_edit_rpc(uuid,text)'::regprocedure
  );
  IF position('''matches'', ''[]''::jsonb' IN v_definition) = 0
     OR position('''contact_via_email'', false' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'Standalone boundary assertion failed: rolling edit compatibility is unsafe';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    EXECUTE $query$
      SELECT EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname IN ('refresh-marketplace-matches', 'marketplace-match-refresh')
           OR command ILIKE '%refresh_marketplace_matches%'
      )
    $query$ INTO v_has_scheduled_job;

    IF v_has_scheduled_job THEN
      RAISE EXCEPTION 'Standalone boundary assertion failed: marketplace match cron remains scheduled';
    END IF;
  END IF;
END;
$$;
