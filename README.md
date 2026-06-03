# freeresumepost.co

**A free, two-sided healthcare hiring marketplace** — the candidate side, paired with its employer-side sibling [freejobpost.co](https://github.com/YoungAlgy/freejobpost). Built and operated solo.

🔗 **Live:** [freeresumepost.co](https://freeresumepost.co)

## What it does
- **Resume upload → parse → structured candidate profile**, with opt-in public profiles.
- **Cross-matches candidates to the live listings** on the sibling employer app — the two-sided loop.
- Candidate dashboard: matched jobs + application history.
- **SEO-first** — indexable opt-in profile pages, sitemaps, structured data.

## Architecture / stack
- **Next.js 16** (app router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + auth + storage), row-level security throughout
- **Vercel**
- Vitest test suite

## Engineering notes
- The core challenge is **resume parsing → normalized profile**: turning unstructured uploads into a queryable candidate schema that can be matched against the employer-side job corpus.
- Privacy-by-default: profiles are private until a candidate explicitly opts into a public, indexable page.

## Dev
```bash
npm install
cp .env.example .env.local   # add your own Supabase anon key
npm run dev                  # http://localhost:3000
```

## Related
- [freejobpost.co](https://github.com/YoungAlgy/freejobpost) — the employer side of the marketplace
- Part of a broader healthcare-data + hiring stack I build and operate solo. More at [youngalgy.com](https://youngalgy.com).
