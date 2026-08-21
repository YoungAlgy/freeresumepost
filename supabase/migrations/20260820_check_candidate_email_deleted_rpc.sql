-- Detect a soft-deleted public_candidates row sharing an email, so the
-- upload flow can stop misdirecting returning-but-deleted candidates into
-- a recovery loop that can never succeed.
--
-- Background: public_candidates_email_key is a plain UNIQUE btree on
-- (email) with no `WHERE deleted_at IS NULL` filter (unlike this table's
-- other soft-delete-aware indexes). submit_public_candidate_rpc does a
-- plain INSERT with no upsert/resurrect path. So once a candidate's row
-- is soft-deleted (e.g. via the "email us to delete my profile" flow),
-- any future /upload submission with that email hits the UNIQUE
-- constraint (23505). Today's handler for that case tells the candidate
-- to use the edit link we already emailed them or request a fresh one --
-- but consume_candidate_edit_rpc and get_my_candidate() both exclude
-- deleted_at IS NOT NULL rows, so that link (old or freshly reissued)
-- always fails. This RPC lets the frontend tell the two cases apart and
-- show a message that doesn't loop the candidate into a dead end.
--
-- Deliberately NOT resurrecting the deleted row here (mirrors the
-- ava_candidate_ref upsert's explicit choice not to implicitly revive a
-- soft-deleted row on conflict -- see freejobpost's
-- 20260527_cross_site_candidate_profile_rpc.sql). Whether/how to let a
-- deleted candidate rejoin is a product decision, not a mechanical one.
--
-- Not an enumeration risk beyond what the 23505 conflict itself already
-- reveals (that an account with this email exists) -- this only adds
-- whether that existing account is soft-deleted, and is only meant to be
-- called from the frontend after that conflict is already known.
--
-- NOTE: pending a coordinated deploy with the freeresumepost frontend
-- change that calls this (src/app/upload/actions.ts). Not applied live
-- by this session -- see repo audit notes for 2026-08-20.

CREATE OR REPLACE FUNCTION public.check_candidate_email_deleted_rpc(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.public_candidates
    WHERE lower(email) = lower(p_email)
      AND deleted_at IS NOT NULL
  );
$$;

-- Round 9 correction: an earlier draft of this file skipped the GRANT block,
-- on the stated grounds that submit_public_candidate_rpc "relies on the
-- default PUBLIC execute grant" and that "this project doesn't REVOKE EXECUTE
-- FROM PUBLIC on candidate-facing RPCs". Checked against the live DB, that is
-- backwards. Every RPC in this family carries an explicit ACL with no PUBLIC
-- entry -- submit_public_candidate_rpc, update_public_candidate_rpc,
-- consume_candidate_edit_rpc, get_resume_upload_context_rpc and
-- subscribe_job_alert_rpc are all exactly
--   postgres=X/postgres | anon=X/postgres | authenticated=X/postgres
-- i.e. REVOKE ALL FROM PUBLIC followed by explicit grants (see
-- 20260430220000_revoke_public_on_security_definer_pii_funcs.sql, and
-- avahealth-crm's 20260820190200_booking_context_rpc.sql, which does the same
-- REVOKE/GRANT pair for the newest anon-callable SECURITY DEFINER reader).
--
-- Left as-was, this migration would have created a SECURITY DEFINER function
-- over candidate PII that every role on the project can execute, and it would
-- have landed as a fresh anon_security_definer_function_executable advisor
-- warning the moment it was applied. Matching the convention explicitly.
REVOKE ALL ON FUNCTION public.check_candidate_email_deleted_rpc(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_candidate_email_deleted_rpc(text) TO anon, authenticated;
