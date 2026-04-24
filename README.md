# freeresumepost.co

Free healthcare resume upload + matching — candidate side of a two-sided marketplace with [freejobpost.co](https://freejobpost.co).

## Stack
- Next.js 16 (app router) + React 19
- Tailwind CSS v4 (@tailwindcss/postcss)
- Supabase (shared project: `tsruqbodyrmxqzhvxret`) for DB + auth + storage
- Deployed on Vercel

## Dev
```bash
npm install
cp .env.example .env.local  # fill in Supabase anon key
npm run dev                  # http://localhost:3000
```

## Structure
- `/` — landing
- `/upload` — resume drop-zone → parse → profile edit
- `/profile/[slug]` — public profile (opt-in)
- `/candidate/dashboard` — matched jobs + application history

## Related
- [freejobpost.co](https://github.com/YoungAlgy/freejobpost) — employer side
- [avahealth-crm](https://github.com/YoungAlgy/avahealth) — admin/back-office
- Plan doc: `~/.claude/plans/compiled-frolicking-moler.md`
