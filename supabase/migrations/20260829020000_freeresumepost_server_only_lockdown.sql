-- FreeResumePost post-cutover server-only lockdown.
--
-- Apply this only after the service-role Server Actions are live, their upload
-- and replacement smoke tests pass, and the production watch is complete. The
-- prior standalone-boundary migration intentionally keeps legacy anon access
-- during the rolling window.

REVOKE ALL ON FUNCTION public.submit_public_candidate_rpc(
  text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_candidate_rpc(
  text, text, text, text, text, text, text, text, integer,
  boolean, boolean, boolean, boolean, text, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.attach_freeresumepost_resume_rpc(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_freeresumepost_resume_rpc(uuid, text, text)
  TO service_role;

-- The replacement submit action performs this deleted-profile check through
-- the same server-only client. It no longer needs to expose email state through
-- a public RPC after the old Worker has left the rolling window.
REVOKE ALL ON FUNCTION public.check_candidate_email_deleted_rpc(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_candidate_email_deleted_rpc(text)
  TO service_role;

-- The legacy browser wrote directly to this private bucket. The replacement
-- Worker writes with service_role, which bypasses Storage RLS. Remove both
-- broad legacy upload policies. Keep Ava CRM uploads working through one
-- explicit internal-membership policy.
DROP POLICY IF EXISTS resumes_anon_insert ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS resumes_internal_insert ON storage.objects;
CREATE POLICY resumes_internal_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND public.is_internal_user()
  );

DO $$
BEGIN
  IF has_function_privilege(
    'anon',
    'public.submit_public_candidate_rpc(text,text,text,text,text,text,text,text,integer,boolean,boolean,boolean,boolean,text,jsonb)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.submit_public_candidate_rpc(text,text,text,text,text,text,text,text,integer,boolean,boolean,boolean,boolean,text,jsonb)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'FreeResumePost lockdown failed: public submit execution remains';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.attach_freeresumepost_resume_rpc(uuid,text,text)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.attach_freeresumepost_resume_rpc(uuid,text,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'FreeResumePost lockdown failed: public attachment execution remains';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'public.submit_public_candidate_rpc(text,text,text,text,text,text,text,text,integer,boolean,boolean,boolean,boolean,text,jsonb)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.attach_freeresumepost_resume_rpc(uuid,text,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'FreeResumePost lockdown failed: service_role execution is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN (
        'resumes_anon_insert',
        'Authenticated users can upload resumes'
      )
  ) THEN
    RAISE EXCEPTION 'FreeResumePost lockdown failed: a broad resume upload policy remains';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'resumes_internal_insert'
      AND cmd = 'INSERT'
      AND 'authenticated' = ANY (roles)
      AND NOT ('anon' = ANY (roles))
      AND NOT ('public' = ANY (roles))
      AND coalesce(with_check, '') ILIKE '%bucket_id%'
      AND coalesce(with_check, '') ILIKE '%resumes%'
      AND coalesce(with_check, '') ILIKE '%is_internal_user%'
  ) THEN
    RAISE EXCEPTION 'FreeResumePost lockdown failed: internal resume upload policy is missing or too broad';
  END IF;
END;
$$;
