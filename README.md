# FreeResumePost

FreeResumePost is a standalone resume upload and profile tool for nurses and allied health professionals.

## Current product

- Read PDF and DOCX resumes in the browser.
- Let the user review and correct extracted profile fields before saving.
- Store the original file in a private Supabase Storage bucket.
- Keep profiles private by default, with an optional limited share link.
- Let a signed-in profile owner reopen the editor, replace the file, and use the optional resume tailoring tool.

FreeResumePost does not list jobs, submit applications, publish candidates into recruiter tools, or run candidate-to-job matching.

## Stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- Supabase Postgres, Auth, and Storage
- Cloudflare Workers through OpenNext
- Vitest

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use the shared Supabase project keys in `.env.local`. Apply
`supabase/migrations/20260828010000_freeresumepost_standalone_boundary.sql`
before deploying the source-scoped frontend. Set `SUPABASE_SERVICE_ROLE_KEY`
only in the server environment. It powers profile submission, source-scoped
OTP checks, and private resume storage without putting that key in the browser.
The first migration stops the old automatic matching cron without deleting
historical match or application rows.

After the new Worker passes its production watch, apply
`supabase/migrations/20260829020000_freeresumepost_server_only_lockdown.sql`.
That second migration removes legacy anonymous submit and storage access. Keep
the two migrations in separate rollout stages.

Production releases must follow
`docs/releases/2026-08-29-standalone-release.md`. That runbook contains the
staged migration allowlist, rolling frontend compatibility contract, rollout
order, and rollback triggers. Do not push every local migration file as a
batch.
