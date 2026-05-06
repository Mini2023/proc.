# proc. 2.0

A personal productivity app for students. Tracks exams, todos, and focus sessions — with a daily morning and evening ritual powered by AI.

Built for daily use, not for show.

---

## What it does

**Dashboard** — overview of today: briefing status, open todos, focus time, next exam.

**Briefing** — a two-part daily ritual.
- Morning: set your intention, energy level, and get 3–4 tasks for the day.
- Evening: reflect on the day, get follow-up questions, and a short mentor-style summary.
- Falls back to an algorithmic summary if the AI is unavailable.

**Focus** — a session timer with deep work mode. Logs every session with category and duration.

**Klausuren** — exam tracker with dates, grades, and subject averages. Generates a day-by-day study plan for each exam.

**Todos** — priority-based task list. Tasks from the morning briefing land here automatically.

---

## Stack

- **Next.js 14** (App Router)
- **Supabase** — auth, database, row-level security
- **Gemini API** — AI briefings (with cascade fallback across model versions)
- **Framer Motion** — animations
- **Tailwind CSS** + custom CSS design system ("Arctic Glass")
- **PWA** — installable, works offline-adjacent on mobile

---

## Getting started

```bash
npm install
npm run dev
```

### Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database

The app expects a Supabase project with the following tables: `profiles`, `klausuren`, `todos`, `focus_sessions`, `briefings`. Row-level security is enabled on all tables.

---

## Project structure

```
app/
  (auth)/login/        Login page (magic link, password, register)
  (app)/               Protected routes (dashboard, briefing, focus, klausuren, todos, settings)
  api/briefing/        Morning and evening AI routes
  auth/callback/       OAuth / magic link callback

components/
  layout/              Sidebar, BottomNav
  proc/                Feature components (MorningRitual, EveningRitual, KlausurCard, ...)

lib/
  ai/                  Gemini client, prompt builders, context serializer
  hooks/               useKlausuren, useTodos, useFocusSessions, useMediaQuery
  supabase/            Client, server, and middleware setup
```

---

## Notes

- The app is in German — it's built for a specific user.
- AI calls cascade through model versions: primary fails → fallback model → algorithmic summary.
- Mobile layout uses a bottom nav bar; desktop uses a sidebar. Both are driven by CSS classes, not JS.
