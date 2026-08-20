-- consume_candidate_edit_rpc returned 'candidate': to_jsonb(v_candidate) --
-- the ENTIRE public_candidates row, not a scoped subset. That value flows
-- straight from page.tsx (getEditableCandidate) into ProfileEditForm, a
-- 'use client' component. Next.js serializes every field of a Server-to-
-- Client Component prop into the RSC flight payload regardless of which
-- fields the client JSX actually reads. So opening a candidate's own edit
-- link shipped, in page source: parsed_profile (full raw extracted resume
-- text, up to 50,000 chars), resume_url (private-bucket storage path),
-- user_id, ava_candidate_ref/ava_candidate_type (internal CRM/Ava
-- cross-system foreign keys), zip, desired_salary_min/max, sms_opt_in_at,
-- email_verified_at, status, source, created_at/updated_at, deleted_at --
-- none of which ProfileEditForm displays or needs.
--
-- get_my_candidate() already does this correctly with an explicit narrow
-- RETURNS TABLE(...) that Postgres itself enforces. This mirrors that
-- pattern here: build an explicit jsonb_build_object() listing only the
-- fields ProfileEditForm (src/app/profile/[slug]/edit-form.tsx) actually
-- uses, instead of forwarding the whole row via to_jsonb().
--
-- Self-contained: consume_candidate_edit_rpc is only called from
-- freeresumepost's src/app/profile/[slug]/page.tsx (getEditableCandidate),
-- which already casts the result to a narrow Candidate TS type covering
-- exactly this field list -- so narrowing the RPC's actual return value to
-- match doesn't change any currently-working behavior. No other repo calls
-- this RPC (avahealth-crm's edge functions only reference it in comments
-- about token-format compatibility).

CREATE OR REPLACE FUNCTION public.consume_candidate_edit_rpc(p_candidate_id uuid, p_nonce text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_candidate public.public_candidates;
  v_token_row public.marketplace_notifications;
  v_matches jsonb;
BEGIN
  IF p_candidate_id IS NULL OR p_nonce IS NULL OR length(p_nonce) < 16 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input', 'code', 400);
  END IF;

  SELECT * INTO v_token_row
  FROM public.marketplace_notifications
  WHERE type = 'candidate_edit_token'
    AND entity_type = 'public_candidates'
    AND entity_id = p_candidate_id
    AND (metadata->>'nonce') = p_nonce
  ORDER BY created_at DESC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired edit token', 'code', 401);
  END IF;

  -- Tokens expire after 7 days
  IF (v_token_row.metadata->>'issued_at')::timestamptz < (now() - interval '7 days') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Edit token expired', 'code', 410);
  END IF;

  SELECT * INTO v_candidate FROM public.public_candidates WHERE id = p_candidate_id;
  IF NOT FOUND OR v_candidate.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Candidate not found', 'code', 404);
  END IF;

  -- Top 10 matches, sorted by score DESC. Filter to currently-active jobs so
  -- the candidate UI never shows dead links.
  SELECT COALESCE(jsonb_agg(m), '[]'::jsonb) INTO v_matches
  FROM (
    SELECT jsonb_build_object(
      'job_id', pj.id,
      'job_slug', pj.slug,
      'job_title', pj.title,
      'job_city', pj.city,
      'job_state', pj.state,
      'job_specialty', pj.specialty,
      'job_remote_hybrid', pj.remote_hybrid,
      'job_employment_type', pj.employment_type,
      'salary_min', pj.salary_min,
      'salary_max', pj.salary_max,
      'score', pm.score,
      'reasons', pm.reasons
    ) AS m
    FROM public.public_matches pm
    JOIN public.public_jobs pj ON pj.id = pm.job_id
    WHERE pm.candidate_id = p_candidate_id
      AND pj.status = 'active'
      AND pj.deleted_at IS NULL
      AND pj.expires_at > now()
    ORDER BY pm.score DESC, pm.updated_at DESC
    LIMIT 10
  ) sub;

  RETURN jsonb_build_object(
    'success', true,
    -- Narrow, explicit projection -- mirrors get_my_candidate()'s pattern.
    -- Only fields ProfileEditForm actually uses. Do NOT widen this back to
    -- to_jsonb(v_candidate) -- see comment at top of this migration.
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
      'remote_only', v_candidate.remote_only,
      'contact_via_email', v_candidate.contact_via_email,
      'contact_via_sms', v_candidate.contact_via_sms,
      'is_public', v_candidate.is_public
    ),
    'matches', v_matches,
    'code', 200
  );
END;
$function$;
