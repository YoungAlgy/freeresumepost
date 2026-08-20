-- update_public_candidate_rpc's UPDATE statement already had
-- `WHERE id = p_candidate_id AND deleted_at IS NULL`, so a save against a
-- soft-deleted (or nonexistent) candidate row silently matched zero rows --
-- but the function never checked that, and unconditionally returned
-- {success: true, code: 200} regardless. Same defect class as the
-- silent-write-success bug fixed extensively elsewhere across both repos'
-- frontends/edge functions this marathon (checking only `error`, not
-- rows-affected, on a write) -- this is the SQL-side equivalent, inside the
-- SECURITY DEFINER RPC itself rather than a JS caller.
--
-- Narrow window in practice (the candidate would need to be deleted, e.g.
-- via the CRM's soft-delete, in the gap between the candidate opening their
-- emailed edit link and clicking Save), but real: the candidate's edit-form.tsx
-- shows "Saved." and, if the profile was public, even claims the public URL
-- is now live -- while nothing was actually written. Fixed by mirroring
-- consume_candidate_edit_rpc's explicit existence check: look the row up
-- first and reject with 404 before attempting the UPDATE, rather than
-- letting the UPDATE's WHERE clause fail silently.
--
-- Self-contained: same signature, same {success,error,code} shape the
-- caller (src/app/profile/[slug]/actions.ts updateCandidate) already
-- switches on -- it already renders r.error on any success:false, so no
-- frontend change needed.

CREATE OR REPLACE FUNCTION public.update_public_candidate_rpc(p_candidate_id uuid, p_nonce text, p_first_name text, p_last_name text, p_phone text, p_credential text, p_specialty text, p_city text, p_state text, p_years_experience integer, p_remote_only boolean, p_contact_via_email boolean, p_contact_via_sms boolean, p_is_public boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_token_row public.marketplace_notifications;
  v_exists boolean;
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
  IF NOT FOUND OR (v_token_row.metadata->>'issued_at')::timestamptz < (now() - interval '7 days') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired edit token', 'code', 401);
  END IF;

  -- Explicit existence check (mirrors consume_candidate_edit_rpc) so a
  -- deleted/missing candidate returns a real error instead of the UPDATE
  -- below silently matching zero rows and this function still reporting
  -- success.
  SELECT EXISTS(
    SELECT 1 FROM public.public_candidates WHERE id = p_candidate_id AND deleted_at IS NULL
  ) INTO v_exists;
  IF NOT v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Candidate not found', 'code', 404);
  END IF;

  UPDATE public.public_candidates SET
    first_name = trim(p_first_name),
    last_name = trim(p_last_name),
    phone = NULLIF(trim(coalesce(p_phone, '')), ''),
    credential = NULLIF(trim(coalesce(p_credential, '')), ''),
    specialty = NULLIF(trim(coalesce(p_specialty, '')), ''),
    city = NULLIF(trim(coalesce(p_city, '')), ''),
    state = NULLIF(upper(trim(coalesce(p_state, ''))), ''),
    years_experience = p_years_experience,
    remote_only = coalesce(p_remote_only, false),
    contact_via_email = coalesce(p_contact_via_email, true),
    contact_via_sms = coalesce(p_contact_via_sms, false),
    is_public = coalesce(p_is_public, false),
    updated_at = now()
  WHERE id = p_candidate_id AND deleted_at IS NULL;

  RETURN jsonb_build_object('success', true, 'code', 200);
END;
$function$;
