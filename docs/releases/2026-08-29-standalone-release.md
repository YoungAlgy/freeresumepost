# FreeResumePost standalone release runbook

Date: 2026-08-29

Status: Local release candidate. Production is still held behind the backup, migration-ledger, inventory, preview, and smoke-test gates below. The PII-free `resume-uploaded-notify` compatibility no-op is already live as version 14. No database or Worker release has happened.

## Release boundary

This release makes FreeResumePost a standalone resume upload and profile tool. It keeps historical matches and applications stored. It disables new automatic matching and turns recruiter contact settings off for FreeResumePost profiles.

The database and frontend must roll out as one coordinated release. The boundary database change is backward compatible with the currently deployed frontend. The frontend is not backward compatible with the old database because it calls new source-scoped RPCs. A second database migration locks submission and storage down only after the replacement Worker passes its production watch.

## Database migration allowlist

The release has two migration stages. Apply the boundary migration before the frontend:

`supabase/migrations/20260828010000_freeresumepost_standalone_boundary.sql`

Apply the lockdown migration only after the replacement Worker is live and has passed the post-deploy watch:

`supabase/migrations/20260829020000_freeresumepost_server_only_lockdown.sql`

Do not apply these two files together. Do not blindly push every local migration file. Do not use an include-all migration option against production.

These earlier files contain definitions superseded by the standalone migration:

- `supabase/migrations/20260820_check_candidate_email_deleted_rpc.sql`
- `supabase/migrations/20260820b_narrow_consume_candidate_edit_rpc.sql`
- `supabase/migrations/20260820c_fix_update_public_candidate_rpc_silent_noop.sql`

Confirm those three versions against the production migration ledger. If the ledger does not match the expected history, stop and reconcile it before applying anything. The standalone migration replaces the affected functions with the final source-scoped definitions.

### Authoritative shared-database runner

`C:\Users\Algy\avahealth-crm` is the only owner of the linked migration ledger for project `tsruqbodyrmxqzhvxret`. FreeResumePost keeps the two files above as reviewed source artifacts. Never run a linked database push from this repository.

When Supabase is healthy, prepare a clean Ava release worktree under `C:\Users\Algy\Desktop\Files\Ava-Health-Platform-Migration\supabase-release-runner`. Its active `supabase\migrations` folder must equal the remotely applied ledger plus exactly one approved pending migration. Held Ava, FreeJobPost, and later FreeResumePost SQL must stay outside that active folder.

For each stage:

1. Run `supabase migration list --linked` from the clean Ava runner and confirm the project ref and remote ledger.
2. Require `supabase db push --linked --dry-run` to propose zero files before staging anything.
3. Run `supabase migration new <stage-name>` in the Ava runner. The generated version must be fourteen numeric digits, unique, and greater than the highest remote version.
4. Copy the reviewed stage body byte-for-byte into that one generated file. Confirm its SHA-256 hash matches the source file above.
5. Run the linked migration list and dry run again. Stop unless exactly that one generated file is pending.
6. Run `supabase db push --linked`, then confirm the generated version appears remotely and zero files remain pending.

Stage the boundary alone. Do not create or place the lockdown file in the active migration folder until the Worker and Edge release has passed a full 15-minute production watch. Do not use `--include-all` or `migration repair`. A duplicate-version error, remote-only version, older unexpected pending file, or second pending file blocks the release.

## Edge Function allowlist

- `resume-uploaded-notify` version 14 is already live with `verify_jwt=false`. It sends no email, reads no candidate data, and returns a compatibility success response to the old Worker.
- Deploy the reviewed source-scoped `resume-edit-link` after the boundary migration with `verify_jwt=false`. It must claim tokens through the service-only, row-locked `issue_freeresumepost_recovery_link_rpc`. Capture its current live version and source first.
- Deploy the reviewed source-scoped `get-resume-url` after the boundary migration with `verify_jwt=true`. It depends on `get_my_freeresumepost_candidate()` from that migration. Capture its current live version and source first.

The replacement submit, upload, and OTP flows run through Next Server Actions with a server-only `SUPABASE_SERVICE_ROLE_KEY`.

## Rolling compatibility contract

### Currently deployed frontend

- The browser uploads the resume before it creates the profile.
- It sends the bare object name through `p_resume_url` on `submit_public_candidate_rpc`.
- The migration accepts an empty or null path for a profile-only submission.
- A supplied path must be a lowercase, root-level UUID ending in `.pdf` or `.docx`.
- The object must already exist in the private `resumes` bucket.
- Its stored MIME type must match its extension.
- Invalid, missing, type-confused, DOC, URL, nested, or non-UUID paths return code 400 before a candidate row is inserted.
- Legacy matching and contact arguments remain in the RPC signature. The function ignores them and stores all retired flags as false.

The deployed file picker also accepts TXT. It parses TXT in the browser, then tries to store it with `text/plain`. The existing `resumes` bucket MIME allowlist rejects that storage write. The old frontend deliberately continues by submitting the extracted profile without a resume path, so TXT becomes a text-only legacy submission during the rolling window. The replacement frontend accepts only PDF and DOCX.

The old edit page also remains callable during the short overlap. `consume_candidate_edit_rpc` returns the old boolean fields as fixed false values and returns `matches: []`. It does not query match or job tables. The old update signature stays available, but its matching and contact inputs cannot turn those fields back on.

### Replacement frontend

- After Turnstile passes, its server action creates the source-scoped profile with `p_resume_url: null` through `SUPABASE_SERVICE_ROLE_KEY`.
- A second server action checks the candidate UUID and seven-day nonce before it handles the file.
- The server requires a 5 MB or smaller PDF or DOCX with matching extension and MIME. It requires PDF magic plus a final EOF marker. For DOCX, it validates the ZIP central directory and requires the core OOXML package parts without bundling the browser parsers into the Worker.
- The server uploads the reviewed bytes through service role, then calls `attach_freeresumepost_resume_rpc`.
- If the attachment is rejected or throws, the server deletes the object it just uploaded.
- The attachment RPC locks the source-scoped candidate row and permits at most five file attachments in a rolling 24-hour window.
- A successful replacement returns only the prior root storage path to the service-only action. The action deletes that prior PDF or DOCX after the new path is committed. The orphan purge remains a fallback if that cleanup call fails.
- Initial and replacement uploads use the same server path. Browser code no longer writes to Supabase Storage.
- Candidate OTP requests first check for an active, non-deleted `freeresumepost.upload.v1` profile on the server. Only a match can send a code or create an Auth user. Every valid request gets the same accepted response.

## Pre-deploy gates

- [ ] The active Supabase incident is resolved and normal response times have returned.
- [ ] A fresh database backup has completed successfully.
- [ ] The production migration ledger is readable and reconciled with the allowlist above.
- [ ] `docs/releases/2026-08-29-freeresumepost-inventory.sql` has run in a read-only transaction. Its count-only output and disposition are saved in the Desktop Files release folder.
- [ ] Known-marker rows, proven rows awaiting backfill, unmarked `self_upload` rows, active rows with edit tokens, rows with resume paths, and matching Auth users have all been counted. No ambiguous row is backfilled by guess.
- [ ] Every table grant, function grant, and RLS policy available to a generic `authenticated` user in the shared project has been reviewed. Stop if a newly created Auth user can read or change Ava CRM or another product's data.
- [ ] Shared Auth signup settings, the FreeResumePost OTP template, and the transactional sender identity have been checked. The message must present FreeResumePost as its own product.
- [ ] `FREERESUMEPOST_SUPPORT_EMAIL` is set in the Worker environment to a verified, monitored, exact `@freeresumepost.co` mailbox. Missing or invalid values render no email link and block release. There is no Ava fallback or client-side copy.
- [ ] A FreeResumePost-owned recovery sender and reply address have been confirmed before replacing the current `avahealth.co` recovery sender. Public DNS currently does not prove a receiving mailbox exists on `freeresumepost.co`.
- [ ] Current definitions for the touched RPCs and the current matching cron state have been captured read-only for incident comparison.
- [ ] The `resumes` bucket is private and still has its 5 MB limit and MIME allowlist.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` exist as secrets in the preview and production Worker environments. Neither is stored in a `NEXT_PUBLIC` variable, source file, build log, or client artifact.
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` exists in the intended Worker environment. A missing secret, missing token, wrong Turnstile action, invalid token, and Cloudflare verification failure all block the service-role submit action.
- [ ] The migration has passed on an isolated database copy with representative schema and storage metadata.
- [ ] Unit tests, TypeScript, and lint pass from the intended release tree. The one `npm run cf:build` run below must supply the final Next and OpenNext build evidence. Do not run a second release build.
- [ ] The intended artifact has `experimental.serverActions.bodySizeLimit` set to 6 MB, leaving multipart overhead above the enforced 5 MB file limit.
- [ ] The previous Cloudflare production deployment ID is recorded.
- [ ] The current live source and version for `resume-edit-link` and `get-resume-url` are saved for rollback.
- [ ] The exact Worker artifact hash and file count are recorded before any upload.

## Build once and promote the same Worker version

The Worker owns the `DOQueueHandler` Durable Object. Use an immutable uploaded version and a version override for the remote smoke test. Do not rebuild between preview, upload, and production.

1. Run the full test suite, TypeScript, and lint from the final release commit.
2. Run `npm run cf:build` once.
3. Run `npm run cf:hash -- --output <Desktop-Files-release-record>\open-next-manifest.sha256`. Save the printed aggregate SHA-256 and file count. Do not edit `.open-next` after hashing.
4. Run `npm run cf:preview` for the local Workers-runtime pass against approved preview bindings.
5. Run `npm run cf:hash` again and require the same aggregate SHA-256 and file count.
6. Record the current production version with `wrangler deployments list`.
7. Run `npm run cf:upload`. The pinned `--strict --keep-vars` flags block conflicting remote configuration and preserve dashboard-managed plain variables. This uploads the existing `.open-next` output and does not rebuild it. Capture the new Worker version ID.
8. Run `npm run cf:hash` again and require the same aggregate SHA-256 and file count.
9. Run `wrangler versions view <new-version-id> --json`. Confirm the uploaded version has the service-role and Turnstile secret bindings plus the intended Supabase, app URL, and Turnstile site-key variables. Stop on any missing or unexpected binding.
10. Put the new version into the active deployment at zero percent with `npm run cf:deploy -- <old-version-id>@100 <new-version-id>@0 --yes`.
11. Send smoke requests to `https://www.freeresumepost.co` with `Cloudflare-Workers-Version-Overrides: freeresumepost="<new-version-id>"`. Apply the header to document, asset, and Server Action requests. Confirm the invoked version in Cloudflare observability.
12. After the override smoke passes, promote the exact same version with `npm run cf:deploy -- <new-version-id>@100 --yes`.

The zero-percent deployment changes no ordinary user traffic. It only makes the uploaded version addressable by the explicit override header. If the override is not confirmed, stop instead of assuming the new version handled the smoke test.

## Exact rollout order

1. Freeze other shared-schema migrations and confirm no parallel Ava, FreeJobPost, or FreeResumePost migration is running.
2. Recheck the fresh backup, migration ledger, count-only inventory, generic authenticated-user audit, and sender identity. Stop on any unknown or mismatch.
3. Confirm the server-only service-role and Turnstile secrets plus the public Turnstile site key exist in the Cloudflare preview and production environments without printing secret values.
4. From the clean Ava runner, stage and apply only a freshly versioned byte-for-byte copy of `20260828010000_freeresumepost_standalone_boundary.sql`.
5. Verify the source-scoped function definitions, rolling `anon`, `authenticated`, and `service_role` grants, disabled matching function, and missing matching cron with read-only checks. Require `pg_get_functiondef('public.cron_health_check()'::regprocedure)` to contain no `refresh-marketplace-matches` reference before continuing.
6. Deploy `resume-edit-link` with `verify_jwt=false` and `get-resume-url` with `verify_jwt=true`. Run OPTIONS checks, then approved source-scoped functional checks. Stop if either function can reach a shared Ava CRM candidate.
7. Keep the old frontend live long enough to verify that an existing edit link opens with contact settings off and an empty match list. Its direct upload and text-only TXT fallback remain available only during this stage.
8. Build once, hash the final `.open-next` artifact, run the local Workers-runtime preview, upload that artifact as a new immutable version, and place it at zero percent beside the old version.
9. With the version-override header, first send a missing, invalid, and wrong-action Turnstile token. Confirm each request fails and creates no candidate row or resume object. Then, with an approved Algy-owned real resume, verify profile submission, PDF or DOCX upload, edit, account login, OTP, file replacement, private resume access, and profile visibility. Do not create placeholder candidate data.
10. Confirm a mismatched extension/MIME and a damaged document are rejected before storage. Confirm an attachment rejection deletes the just-uploaded object in the isolated or override test setup.
11. Promote the exact tested Worker version ID to 100 percent.
12. Repeat the approved real-data smoke paths and watch Worker errors, Edge errors, Supabase errors, response time, Auth errors, and storage failures for at least 15 minutes.
13. Confirm production traffic is using the new Server Actions and no rollback to the legacy Worker is required.
14. Only now, from the clean Ava runner, generate, hash-check, stage, and apply a fresh canonical copy of `20260829020000_freeresumepost_server_only_lockdown.sql`. The dry run must name that file alone.
15. Verify `anon` and `authenticated` can no longer execute submit, attach, or deleted-email-check RPCs. Verify `service_role` still can. Verify both broad upload policies are gone and `resumes_internal_insert` is internal-only.
16. Repeat one approved production profile save, one replacement upload, and one OTP request. Watch the same error sources for at least 15 more minutes.
17. Record the Worker version, Edge Function versions, artifact hash, inventory result, and both final Ava migration-ledger entries in the handoff.

Do not combine historical match deletion, old upload cleanup, unique-email redesign, or unrelated bucket-policy work with this release.

## Read-only database checks after migration

Confirm all of the following after the boundary migration and before the frontend deployment:

- The standalone migration appears once in the ledger.
- `submit_public_candidate_rpc` stores `source = 'freeresumepost.upload.v1'`.
- Its non-null legacy resume path branch checks `storage.objects` and the matching MIME type.
- `consume_candidate_edit_rpc` returns fixed false contact fields and an empty `matches` array.
- `update_public_candidate_rpc` forces the retired flags to false.
- `submit_public_candidate_rpc`, `consume_candidate_edit_rpc`, and `check_candidate_email_deleted_rpc` include `service_role`. The legacy browser roles remain only for the rolling stage.
- `attach_freeresumepost_resume_rpc` is service-role only from the boundary stage. The old Worker never calls it.
- The attachment RPC holds the candidate row `FOR UPDATE`, stores its 24-hour attachment window under reserved `parsed_profile` keys, rejects the sixth attachment in the same window, and returns the prior root path for server cleanup.
- `issue_freeresumepost_recovery_link_rpc` is service-role only, source-scoped, row-locked, and performs its token count and insert in one transaction before returning mail fields to the Edge gateway.
- `refresh_marketplace_matches()` returns `automatic_matching_retired` with zero inserts and updates.
- No cron command still calls `refresh_marketplace_matches`.
- `pg_get_functiondef('public.cron_health_check()'::regprocedure)` no longer contains `refresh-marketplace-matches`, so the intentional unschedule cannot create a false missing-job alert.
- Historical `public_matches`, hot-match notifications, and direct applications still exist.

After the post-cutover lockdown, confirm all of the following:

- `anon` and `authenticated` have no execute privilege on `submit_public_candidate_rpc`, `attach_freeresumepost_resume_rpc`, or `check_candidate_email_deleted_rpc`.
- `service_role` still has execute privilege on those functions.
- `consume_candidate_edit_rpc` and `update_public_candidate_rpc` remain available to the nonce-gated edit flow.
- `resumes_anon_insert` and `Authenticated users can upload resumes` are absent from `pg_policies`.
- `resumes_internal_insert` is the only reviewed authenticated insert path for the `resumes` bucket and requires `public.is_internal_user()`.
- The inventory shows no other `anon`, `public`, or generic authenticated INSERT policy can write to the `resumes` bucket.
- The bucket remains private.

## Rollback triggers

Stop before the frontend deployment if any database verification fails.

Roll the frontend back to the recorded prior Cloudflare deployment if any of these happen after its release:

- A valid profile-first upload or file replacement fails twice in a row.
- A sixth attachment is accepted inside one candidate's 24-hour window, or a successful replacement leaves the prior root object referenced nowhere after the cleanup window.
- Owner login or edit links fail for existing source-scoped profiles.
- Private resume access is exposed to an anonymous user.
- A FreeResumePost page shows a shared CRM candidate.
- Worker or Supabase errors exceed 1 percent for five minutes.

Treat any of the following as a database incident and stop the rollout:

- A malformed or nonexistent resume path is stored.
- A candidate row is inserted with a source outside `freeresumepost.upload.v1`.
- A FreeResumePost row has `remote_only`, `contact_via_email`, or `contact_via_sms` set to true after submit or edit.
- The edit RPC returns a resume path, parsed resume text, CRM references, or real match rows.
- The matching cron or match-generation cross join runs again.

Before the lockdown migration, a frontend failure can leave the backward-compatible database boundary in place and roll back only the Worker. After lockdown, the legacy Worker cannot submit or upload. Roll back to it only with a reviewed forward migration that temporarily restores the exact rolling grants and `resumes_anon_insert` policy. If a database function is broken, prefer a narrow forward correction. Do not restore the old automatic matching function or reschedule its cron. Do not restore an old submit or edit definition without reviewing it for source, contact, and matching behavior first.

## Known follow-up work

- The shared global unique-email constraint still needs a product-safe ownership design.
- A failed post-profile upload can leave a profile without a file.
- Historical uploads without the durable FreeResumePost source marker remain hidden.
- The public support contact now fails closed behind the server-rendered `FREERESUMEPOST_SUPPORT_EMAIL` binding. No verified, monitored value is recorded yet, so this remains a release blocker.
- The recovery sender still uses `avahealth.co` until a verified, monitored `freeresumepost.co` sending and reply path is confirmed.
