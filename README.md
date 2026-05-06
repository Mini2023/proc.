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

## Notes

- The app is in German — it's built for a specific user.
- AI calls cascade through model versions: primary fails → fallback model → algorithmic summary.
- Mobile layout uses a bottom nav bar; desktop uses a sidebar. Both are driven by CSS classes, not JS.
