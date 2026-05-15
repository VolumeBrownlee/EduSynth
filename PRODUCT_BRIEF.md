# EduSynth — Product & Design Brief

## What this is

**EduSynth is an AI-native study platform for university courses.** Lecturers upload course materials (textbooks, notes, past papers); students study them inside a secure reader paired with a Socratic AI tutor that's grounded in the uploaded documents (RAG). Progress is tracked across courses, scored against an AI-calibrated readiness metric, and gamified with XP, streaks, badges, and "Mastery Raid" quizzes. Think *Coursera meets Notion AI meets Duolingo*, built for university lecture-room workflows.

Tagline: **"Your professor's notes, taught by AI."**

## Users

Two roles share the same shell:

- **Students** (default) — open courses, read documents in a secure non-downloadable viewer, ask the AI questions about what they're reading, take quizzes when ready, track XP and rank.
- **Lecturers** (`teacher` in DB) — upload course materials by category (Textbook / Notes / Past Paper), see who's struggling, manage the cohort. Past papers are *restricted-tier* — students never see them; the AI uses them only to calibrate quiz difficulty.

Role is detected at login; the navigation, dashboard, and quick-actions adapt accordingly.

## The 7 views (current information architecture)

1. **Command Center** — personal dashboard. Hero greeting + 4 stat tiles (XP · Streak · Subjects Mastered · Avg Readiness) + Today's Focus + Daily Challenge + weekly activity chart. *Should feel like Coursera's "Continue Learning" home.*
2. **Course Sector** — list of available courses → on click, a single course's detail with skill tree + documents + module performance. *Coursera/Udemy course-card grid feel.*
3. **Neural Lab** *(signature feature)* — split-pane: secure PDF viewer (left, ~60%) + Socratic AI chat (right, ~40%) + collapsible session-history sidebar. The viewer fetches real document text from the backend; the chat is grounded in that document's vector embeddings. Has Focus Mode (PDF only) and Zen Mode (full distraction-free).
4. **Mastery Raids** — quiz arena. Locked until ready-score ≥70 per subject. AI generates 5 questions, timed, scored, victory animation on pass.
5. **Analytics** — performance insights: readiness gauge, subject radar, trend line, at-risk subjects.
6. **Achievements (Badges)** — unlockable badges across Learning / Streak / Mastery / Special categories. Currently 12 total.
7. **Leaderboard (Ranks)** — top-3 podium + full cohort rankings by XP, with streak indicators.

## Data shapes you'll bind to (summary)

- `Profile`: id · full_name · email · role · xp_points · streak_count · current_title · avatar_url
- `Classroom`: id · name · description · subject · documents[] · modules[] · member_count · lecturer_name
- `Document`: id · title · category (`textbook`/`exam`/`notes`) · processing_status · subject · topic · page_count
- `StudyProgressItem`: classroom_id · ready_score (0-100) · quiz_avg · interaction_depth (0-10) · queries_count · time_spent_minutes
- `Achievement`: title · description · icon (emoji) · category · unlocked · progress · maxProgress · xpReward
- `LeaderboardEntry`: id · name · xp · streak · title
- `ChatMessage`: role (`user`/`assistant`) · content · created_at
- Title ladder by XP: Novice Scholar → Neural Initiate (1k) → Apprentice (2.5k) → Adept (5k) → Synthesis Master (10k) → Grand Archon (20k)

The full TypeScript interfaces live in `src/store/edusynth-store.ts`.

## Visual direction (CRITICAL)

**Reference platforms**: Coursera, Udemy, Khan Academy. **Anti-references**: anything dark-themed, anything with glassmorphism, anything with HUD/sci-fi visual chrome.

- **Light mode only** — dark mode is explicitly disabled. Don't design any dark variants.
- **White surfaces** + 1px hairline borders (`#E2E8F0`) + subtle shadow-sm on hover. No glass, no blur, no glow on default surfaces.
- **One confident primary color**: deep teal `#0F766E`. Used for primary CTAs, active nav, focus rings, brand accents — *not* on every card.
- **Accent palette** (semantic, used sparingly): amber `#D97706` for streaks/featured · purple `#7C3AED` for special/lecturer · green `#059669` for success · red `#DC2626` for danger.
- **Typography**: Inter (already loaded). Confident hierarchy — big numbers for stats (44px+ for hero metrics, tabular-nums always).
- **Spacing**: generous whitespace. Cards: 12px radius. Buttons: 8px radius. Page max-width: 1280px.
- **Motion**: 150-220ms transitions. No infinite animations on default surfaces. Celebrations earned (only on quiz victory, streak milestone, badge unlock).

## Current pain points (what to fix)

1. The original design was dark/glassmorphism/gamified-maximalist. It looked unprofessional for an educational product. Stripped it but the views still feel "scattered" — too much information competing for attention.
2. The dashboard tries to show 6+ sections at once. Better: 4 hero metrics + drill-into-details on tap (this pattern is partly built — keep building on it).
3. Empty states are inconsistent across views. Need a unified `<EmptyState>` pattern.
4. Hover states and elevation are inconsistent — sometimes shadow, sometimes border, sometimes glow. Pick one (shadow lift on hover, border darkens slightly).
5. Course cards in the Course Sector look generic — Coursera-style cards with the course icon, progress meter, and a clear "Resume / Start" CTA would feel more native.
6. The skill tree (SVG, in CourseSector) is good but its surrounding chrome is dated.

## Tech stack (so generated code drops in cleanly)

Vite + React 18 + TypeScript · Tailwind CSS · shadcn/ui (40+ components installed: Card, Button, Avatar, Badge, Progress, Sheet, Popover, Dropdown, Dialog, Tabs, Tooltip, Input, Textarea, etc.) · Framer Motion · Recharts (charts) · lucide-react (icons) · react-markdown · Zustand (state).

State is in `useEduSynthStore()` — read-only consumption is fine; don't redesign the store.

## Out of scope

Don't redesign: login/register flow, command palette (already clean), backend, auth, the secure PDF protection mechanism. **Do** redesign: the 7 views above, the AppShell header/nav/footer, card patterns, empty states, the floating dock.

---

**Deliverable I'm hoping for**: a Tailwind + shadcn React component set for the 7 views above, in a clean educational-platform aesthetic, that drops into the existing data store and replaces the current view files.
