# Claude Design Brief — EduSynth

> Paste this entire file into a fresh Claude conversation (claude.ai or Claude Code) as your *first* message. Then ask for screens one by one. This is the system context that turns Claude into your design partner for EduSynth.

---

## 1. The Product (read this first)

**EduSynth** is an AI-native study platform for university students. Lecturers upload their course notes, textbooks, and past papers; the system extracts text, embeds it, and serves each student a **personal AI tutor grounded in their actual syllabus** — not the open internet, not a generic LLM, the lecturer's content with `[Ref: Page N]` citations on every answer.

Three feature pillars matter:

1. **AI Tutor (Socratic).** A chat surface that asks back as often as it answers. Page-cited. Per-subject sessions. Renamable. Deletable.
2. **Assessments.** Three surfaces: **Quizzes** (5 MCQ, fast practice), **Challenges** (10 MCQ, ~20 min mock exam), and **Sample Exam Paper** (free-response, structured like the lecturer's real paper, generated fresh — never copied from past papers).
3. **Privacy-conscious gamification.** A **Ready-Score** combining quiz performance and AI-Tutor interaction depth (60/40 weighting). XP, streaks, achievement badges, and a leaderboard that shows **Study Handles** (self-chosen aliases like `@QuietHeron`) — never real names. The privacy default is server-enforced, not just UI-hidden.

The signature architectural contribution is a **dual-tier RAG pipeline**: public study material is visible to all students; past papers live in a restricted tier that students never see directly — the AI uses them only as a structural template when generating new Sample Exam Papers.

### Users

| | Primary | Secondary |
|---|---|---|
| **Who** | University undergraduate, year 2–4 | Lecturer |
| **Goal** | Pass a specific exam on a specific syllabus | Help cohort, see weak topics |
| **Device** | 13–15" laptop in library / dormitory; mobile in transit | Desktop in office |
| **Mood** | Tired, focused, time-constrained | Brisk, low patience for friction |
| **Stake** | Their grade | Cohort outcomes |

### Personality (this is the hardest thing to get right)

EduSynth is **scholarly with confident gamified moments**. Not Duolingo (no cartoon mascots, no glittery rewards). Not enterprise SaaS (no purple-gradient hero, no "Elevate your learning" copy). Not casino (no slot-machine XP, no juicy notifications). The gamification is *earned*, not *button-mashed* — students reach "Cognitive Adept" because they actually studied, and the visual treatment respects that.

Inspirational references (positive):
- **Linear** — restraint, density, motion that means something
- **Anki** — function-first study tool that earned a cult on substance
- **Apple Health rings** — gamification with quiet visual confidence
- **GitHub** — typography hierarchy under information density
- **Notion** — friendly without being childish, reading-first, calm

Anti-references (avoid feeling like):
- **Duolingo's cartoon energy** — too childish for degree-level study
- **Generic SaaS dashboard cliché** — big purple gradients, hero numbers, identical icon-cards
- **AI-slop dashboard** — glassmorphism on every card, gradient text everywhere, indigo `#6366f1`, "AI-powered" copy

---

## 2. The Visual Register

Three dials. Honor them.

| Dial | Value | What it means |
|---|---|---|
| **Density** | **4 / 10** | Daily-app balanced. Reading-first. Side-by-side workflows respected. Never cockpit, never gallery. |
| **Variance** | **8 / 10** | Asymmetric grids (`1fr 1.4fr 1fr`, `2fr 1fr`) preferred over equal thirds. Symmetric grids only when parity *is* the message (stat tiles). |
| **Motion** | **6 / 10** | Spring physics on every interactive element. Perpetual loops only on the four "live" surfaces (Ready-Score gauge ring, Today's-Focus indicator, footer online dot, AI Tutor typing dots). Everything else is event-driven. |

---

## 3. Design Tokens (use these literal values)

### Color — Light theme "Alabaster"

| Token | Hex | HSL (for CSS vars) | Role |
|---|---|---|---|
| `--background` | `#F8FBFA` | `180 22% 98%` | Canvas. Almost-white, faintly tinted teal. **Never `#FFFFFF`.** |
| `--card` | `#FFFFFF` | `0 0% 100%` | Opaque card fill. |
| `--foreground` | `#161E2F` | `220 30% 12%` | Primary text. **Never `#000000`.** |
| `--muted` | `#EEF3F2` | `180 16% 95%` | Subtle surface tint. |
| `--muted-foreground` | `#5B6776` | `215 16% 42%` | Secondary text. |
| `--border` | `#DCE2E6` | `200 14% 88%` | 1 px structural lines. |
| `--primary` | `#178D82` | `175 72% 32%` | Brand teal. Single dominant accent. ≤ 10% surface. |
| `--accent` | `#DB840F` | `35 92% 45%` | XP amber. Gamification only. |
| `--lecturer` | `#8454DD` | `262 72% 60%` | Role tag for lecturers. |
| `--success` | `#1DA67A` | `160 70% 38%` | Online dot, success toasts. |
| `--info` | `#1592C2` | `195 80% 42%` | Analytics chart accent. |
| `--destructive` | `#E5414C` | `0 78% 56%` | Errors, delete. |
| `--gold / --silver / --bronze` | `#E6A012` / `#C5C7CC` / `#A65A1A` | — | Leaderboard top-3 only. |

### Color — Dark theme "Obsidian"

| Token | Hex | HSL | Role |
|---|---|---|---|
| `--background` | `#0F141B` | `220 18% 7%` | Deep tinted ink. **Never `#000000`.** |
| `--card` | `#161B23` | `220 16% 10%` | One stop above the canvas. Opaque. |
| `--foreground` | `#EFF3F2` | `180 15% 95%` | Primary text. **Never `#FFFFFF`.** |
| `--muted` | `#1D2229` | `220 14% 13%` | Tinted muted surface. |
| `--muted-foreground` | `#9CA3B0` | `215 14% 65%` | Secondary text. |
| `--border` | `#2C3138` | `220 12% 20%` | Structural lines. |
| `--primary` | `#36D9C3` | `175 75% 52%` | Brighter teal for dark contrast. |
| `--accent` | `#F7B635` | `40 95% 58%` | Brighter amber for dark contrast. |
| `--lecturer` | `#A28EF1` | `262 80% 70%` | Brighter lecturer purple. |

All colors live as `--*` custom properties on `:root` and `.dark`. Components reach for the tokens via Tailwind utilities like `bg-primary`, `text-muted-foreground`, `border-border`. **Never raw hex in components.**

### Typography

| Role | Font | Weights | Source |
|---|---|---|---|
| **Display** | `Inter Tight` | 500 / 600 / 700 / 800 | Google Fonts |
| **Body** | `Geist` | 300 / 400 / 500 / 600 / 700 | Google Fonts |
| **Mono** | `Geist Mono` | 400 / 500 / 600 | Google Fonts |

Load in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Scale:

| Token | Size | Use |
|---|---|---|
| `text-2xs` | 12 px | Labels, badges. **Hard floor — never go smaller.** |
| `text-xs` | 13 px | Chip text, dense list rows. |
| `text-sm` | 14 px | Body small, secondary content. |
| `text-base` | 16 px | Body default. |
| `text-lg → text-2xl` | 18–24 px | Subtitles, section heads. |
| `text-3xl → text-5xl` | 30–48 px | Page titles, hero numbers. |

Body line-length: cap at `max-w-[65ch]`. Tabular numbers (`tabular-nums`) on every runtime-changing value. Use display font on headings with `tracking-tight leading-none` at large sizes.

### Spacing & radius

- Base: 4 px grid. Use `gap-3` (12 px), `gap-4` (16 px), `gap-5` (20 px), `gap-6` (24 px) for major sections. Avoid `gap-1.5` / `gap-2.5` mixing.
- Radius: `--radius: 0.75rem` (12 px) default. `rounded-md` for inputs, `rounded-lg` for cards, `rounded-xl` for modals, `rounded-2xl` (16 px) for hero "Bento" panels.
- Padding: `p-4 md:p-6` for content cards; `p-6 md:p-8` for hero panels.

### Touch targets

- 40 px minimum for any tappable control (`h-10`).
- 36 px for nav items (`h-9`) — acceptable because most users use ⌘1–7 shortcuts.
- 44 px on touch-only viewports where space allows.

---

## 4. Component Pattern Library

Use **shadcn/ui** as the primitive layer. Customize the defaults — never ship them raw. Use **lucide-react** for icons (1.5 px stroke). Use **Framer Motion** for animation.

### Cards (two levels)

```css
/* Default card — most surfaces */
.card-elevated {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04),
              0 1px 3px hsl(var(--foreground) / 0.04);
}

/* Bento-style hero panel — reserved for "moment" surfaces */
.bento-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1.5rem;
  box-shadow: 0 20px 40px -15px hsl(var(--foreground) / 0.06);
}

/* Glassmorphism — ONLY for genuine overlays (Notification Panel, Command Palette, Toasts) */
.glass-overlay {
  background: hsl(var(--popover) / 0.85);
  backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid hsl(var(--border) / 0.8);
}
```

**Rule:** if it's a card and it's not a hero or an overlay, use `.card-elevated`. Glassmorphism is a privilege, not a default.

### Buttons

shadcn `Button` primitive with `active:scale-[0.98]` baked into the base class. Variants: `default` (filled primary), `outline` (border + bg-background), `ghost` (hover bg only), `destructive`.

### Inputs

Label **above** the input. Helper text optional, below. Error text below, in `text-destructive`, with `aria-invalid` flipping the border. Standard `gap-2` between label / input / helper.

### Loaders

Skeletal placeholders that **match the layout of the loaded content** — same dimensions, same rhythm. Plain `bg-muted animate-pulse rounded-md` blocks. **No circular spinners.**

### Empty states

Pattern: small Lucide icon (`text-muted-foreground/60`), primary heading, one-line instruction in `text-sm text-muted-foreground`. **Never** "No data found" or sad-face icons. Always tell the user *how to populate it*.

### Modals

Radix `Dialog`. Spring-physics entrance (`scale 0.92 → 1`). `glass-overlay` backdrop. `rounded-xl` body. Close on Escape, click-outside, and explicit X.

### Badges

`Badge` shadcn primitive, customized: `text-2xs h-4-5 px-1.5`, role-coloured (`bg-primary/10 text-primary border-primary/30` etc.), Lucide icon prefix when meaningful.

---

## 5. Motion Philosophy

**Library:** Framer Motion (`motion`, `AnimatePresence`).

**Default transition:** spring, `{ type: 'spring', stiffness: 110, damping: 18, mass: 0.9 }`. **Linear easing is banned.**

**Stagger:** parent uses `staggerChildren: 0.06, delayChildren: 0.02`. Lists and grids never mount instantly.

### The four sanctioned perpetual loops

| Animation | Where | Why |
|---|---|---|
| `ring-pulse` | Ready-Score gauge | Signals live progress |
| `breathe` | Today's Focus indicator + footer online dot | Signals "system alive" |
| `progress-shimmer` | Ready-Score progress fill | Reinforces fill is active |
| `typing-bounce` (×3) | AI Tutor thinking state | Conveys waiting for response |

Everything else is event-driven: XP float fires once when XP is awarded, confetti fires once on milestone, scale-in fires once on modal mount.

### Hardware acceleration

Only `transform` and `opacity` are animated. **Never** `width`, `height`, `top`, `left`. `will-change` applied sparingly.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  html { scroll-behavior: auto; }
}
```

---

## 6. Surfaces to Generate

EduSynth has **13 distinct surfaces**. Generate them one at a time. Use the structure below as the spec for each.

### 6.1 Authentication

**Login** — Email + password + optional tenant code. Branded but restrained: small EduSynth logotype top-left, copy that respects the user's time ("Sign in to continue"). Asymmetric layout: form left-aligned, brand visual right. Forgot-password link below submit. No "Sign in with Google" filler.

**Register** — Multi-step (1 personal, 2 role + handle). Role picker: 2-column toggle (Student | Lecturer) with Lucide icons (`GraduationCap` / `Presentation`). Study Handle field for students (optional, default-generated server-side). Tenant code field for institutional onboarding.

### 6.2 App Shell

Three-column header: `[ logo ]  [ centered nav ]  [ notifications + avatar dropdown ]`. Nav items: Dashboard / Courses / Neural Lab / Challenges / Analytics (lecturers only) / Badges / Ranks. Keyboard shortcuts ⌘1–7. Active nav: `bg-background text-primary shadow-sm` inside a `bg-muted/50 p-1 rounded-lg` pill container. Mobile: horizontal scroll nav below the header.

Footer: minimal. Three elements left (role indicator with breathing dot, app name, ⌘K hint) + date right.

### 6.3 Dashboard ("Command Center")

The most-trafficked surface. Bento-style:

1. **Hero panel (bento-card):** Avatar + name + XP title badge + role badge | XP progress bar to next title + literal XP count | Primary actions (Courses, Challenges).
2. **Today's Focus card (bento-card with breathing primary indicator):** the highest-priority in-progress module. Single CTA: "Resume".
3. **Stat tiles row (4-up, card-elevated):** XP Points / Streak / Subjects Mastered / Avg Ready-Score.
4. **Activity chart + Streak summary (asymmetric 2:1):** Weekly area chart (Recharts) of queries × minutes | Streak counter + denormalised stats.
5. **Readiness gauge + Available Subjects (asymmetric 1:2):** Animated Ready-Score gauge (SVG, 160 px) with the 60/40 formula breakdown beneath | Scrollable list of enrolled subjects with progress bars.
6. **Insights + AI Recs + Learning Path (asymmetric 1:1.4:1):** Three different cards, deliberately distinct in content.
7. **Subject Progress + Activity Feed (symmetric 2-up):** Per-subject mini-bars | Recent activity timeline.

### 6.4 Courses ("Course Sector")

**List view:** Search + subject filter row. Asymmetric grid of course cards (each card: cover/initials, title, lecturer name, document count, progress bar). Lecturer role gets an "Upload Materials" button top-right.

**Detail view:** Breadcrumb back. Course header card with lecturer badge + (lecturer only) "Lecturer View" badge. Two-panel split: **Study Material** (visible to everyone) + **Past Papers** (lecturer-only; students never see this panel exist). Plus a skill-tree visualisation of module nodes connected by curved SVG paths, with stars and locked states.

### 6.5 AI Tutor ("Neural Lab")

Two-column: Session list left (per-subject, renamable, deletable) + chat surface right. Chat header: subject name + document context + clear/rename/delete actions. Messages: user bubbles right, tutor bubbles left, with `[Ref: Page N]` chips inline (small red badges). Composer: auto-grow textarea + send button + suggested prompts. Typing indicator: three dots with `typing-bounce` animation when waiting.

### 6.6 Challenges ("Mastery Raids")

List of challenges by subject. Each card shows: subject + difficulty toggle + recommended-readiness indicator + "Start Challenge" CTA. Modal opens on start: 10 MCQ runner with progress dots, timer (soft, top-right), per-question feedback after submit, final results screen with score + XP earned + per-topic breakdown.

### 6.7 Sample Exam Paper

Dedicated reader modal. Header: subject + "Sample Exam Paper" title + downloadable PDF indicator + "Reveal answers" toggle (hidden by default). Body: rendered like a real exam — sections with weighting badges, numbered questions, marks per question, structured "answer this in 4 lines" prompts. Reveal toggle shows model answers below each question with `text-success` colour.

### 6.8 Quizzes (modal)

Same runner pattern as Challenges but 5 questions, lighter framing. Used on per-module practice.

### 6.9 Flashcards (modal)

Card-flip animation (3D, `rotateY`). Front shows the prompt, back shows the answer + a "I knew this" / "Review again" choice that informs spaced repetition. Pagination dots at bottom.

### 6.10 Achievements ("Badges")

Grid of badge cards by category (learning / streak / mastery / social / special). Locked: greyscale + Lock icon. Unlocked: Lucide icon in the category colour. Each card: title + description + progress bar (if not unlocked) + XP reward.

### 6.11 Leaderboard ("Ranks")

Top 3 podium: vertical with #1 in the centre, gold/silver/bronze ring glows (Apple-Watch style), Study Handle + XP + current title under each. Below: list of remaining ranks with rank number + handle + title + XP + streak. Each row: subtle hover lift. Current user row highlighted with `bg-primary/10 border-primary/30`.

### 6.12 Analytics (lecturer only)

Lecturer-facing only (RBAC). 4-up stat row (cohort size, avg readiness, queries this week, at-risk count). Per-subject radar chart (Recharts). Per-student drill-down list with current readiness, trend, and an "open" link to their cohort row.

### 6.13 Profile Settings + Welcome Onboarding + Command Palette

**Profile Settings (modal):** Avatar + name + Study Handle editor + email + password change + theme picker. Lecturer additional fields (department, office hours).

**Welcome Onboarding (full-screen overlay, first-load only):** 3-step wizard with horizontal slide animation. Step 1: Welcome + name confirm. Step 2: Tour the AI Tutor / Challenges / Sample Exam. Step 3: "Start exploring" with CTAs.

**Command Palette (⌘K modal):** `glass-overlay` modal. Recent + suggestions + nav shortcuts + create-action options. Fuzzy-search across courses and chat sessions.

---

## 7. Anti-Patterns (BANNED — non-negotiable)

If you're about to output any of these, **stop and use something different**.

**Visual / CSS**
- `#FFFFFF` or `#000000` anywhere — always use tinted neutrals
- Neon outer glows or decorative `box-shadow` glows
- Oversaturated accent colors (saturation > 80%)
- Gradient text on headings
- Glassmorphism as the default card style — only `glass-overlay` for true overlays
- Custom mouse cursors
- Animated radial-gradient mesh backgrounds, HUD scanlines, watermark overlays
- Side-stripe coloured borders > 1 px

**Typography**
- `Inter` (vanilla), `Roboto`, `Arial`, any system font as display — always Geist + Inter Tight
- Oversized H1s competing with content
- Serif fonts in dashboard surfaces
- Sub-12 px text anywhere

**Layout & spacing**
- 3-column equal-card "feature row" — use asymmetric grids
- Centered Hero layouts — use split / left-aligned / asymmetric whitespace
- `h-screen` — use `min-h-[100dvh]` (iOS Safari fix)
- `calc()` percentage hacks in Flexbox math
- Overlapping text on images
- Nested cards

**Content / data**
- Emojis anywhere — replace with Lucide icons
- Generic names ("John Doe", "Jane Smith", "Acme Inc")
- Fake-perfect numbers (`99.99%`, `100%`, `50%`) — use organic values like `47.2%`, `+1 (312) 847-1928`
- AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen", "Empower")
- Filler UI text ("Scroll to explore", "Swipe down", bouncing chevron icons)
- `Unsplash` direct links — use `picsum.photos/seed/{slug}/{w}/{h}` or local assets
- Lucide user-icon default avatar — use 2-letter initials

**Components**
- Animated counters on stats that don't actually count up over time
- shadcn defaults straight from the kit — customize radius, color, shadow
- Hover effects that depend on a wide hover hit area (causes glitchy reveals)

---

## 8. Tech Constraints

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS 3 + shadcn/ui + Framer Motion + lucide-react + Zustand + Recharts + axios.

**File structure:**
```
src/
├── App.tsx                         (router root)
├── main.tsx                        (entry)
├── index.css                       (Tailwind layers + design tokens + utilities)
├── components/
│   ├── ui/                         (shadcn primitives — customized)
│   └── edusynth/                   (app-specific surfaces)
├── pages/                          (Login, Register only — everything else in AppShell via Zustand state)
├── store/edusynth-store.ts         (Zustand store)
├── services/api.ts                 (axios + per-domain APIs)
└── context/ (AuthContext, ThemeContext, SocketContext)
```

**Build output expectation:**
- Components import tokens via Tailwind utilities (`bg-primary`, `text-foreground`) — never raw hex
- Every interactive element has `:focus-visible` from the shared focus-ring utility
- Every list / grid has skeleton + empty + error states
- Both light and dark themes work without inline `dark:bg-[...]` overrides — design tokens carry the difference
- Mobile (< 768 px) collapses every multi-column layout to single column

---

## 9. Delivery Format (what I want from each generation)

When I ask for a screen, deliver:

1. **The component file** as a complete `.tsx` artifact — no placeholders, no `// TODO`, no truncations
2. **Loading skeleton** built into the same file (or a sibling `*Skeleton.tsx`)
3. **Empty state** built into the same file
4. **Error state** built into the same file
5. **Mobile behaviour** — every multi-column layout must collapse cleanly below 768 px
6. **Both themes** — no inline dark-mode overrides; trust the tokens
7. **Type safety** — proper TypeScript props, no `any` unless explicitly justified
8. **Imports** — only from libraries listed in section 8

Output as a single React artifact when generating in claude.ai (so I can preview it). When generating in Claude Code, save to the correct file path.

---

## 10. How to Use This Brief

1. **First message:** paste this entire file to Claude.
2. **Then:** ask for one screen at a time, in this order:
   - Login + Register (so the brand identity solidifies)
   - AppShell (header + footer + nav scaffold)
   - Dashboard / Command Center (the most-trafficked surface; sets the visual tone)
   - Courses (list + detail)
   - AI Tutor / Neural Lab
   - Challenges + Quiz modal
   - Sample Exam Paper viewer
   - Achievements
   - Leaderboard
   - Analytics (lecturer)
   - Modals: Profile Settings, Welcome Onboarding, Command Palette
   - Flashcards
3. **For each screen:** review the artifact, screenshot what feels off, tell Claude *specifically* what to change. Bad: "make it nicer." Good: "the hero card padding is too tight on mobile; bump from p-4 to p-6 at the md: breakpoint."
4. **Between screens:** if you've adjusted a token (added a new colour role, changed type scale), update this brief and re-paste the section that changed before the next request.
5. **For animation iteration:** Claude tends to over-animate. The taste-skill rule is *perpetual loops only on the four sanctioned surfaces*. If a generated screen has a pulsing icon outside that list, ask for it to be removed.

### Iteration cycle for "this doesn't feel right"

Three-pass formula that works:

- **Pass 1 — Brutal honest read.** "Does this look AI-generated? List specific tells."
- **Pass 2 — Token discipline.** "Show me every raw hex literal in this component and convert each to a token."
- **Pass 3 — Motion audit.** "Show me every animation in this component, classify each as event-driven or perpetual, and justify each perpetual one."

If those three passes turn up clean, the screen is shippable.

---

## 11. Quick-Start Prompt (paste-ready)

If you want a one-message kickoff after pasting this brief, this is the next message:

```
Brief loaded. Generate the Login screen as a single self-contained
React + TypeScript + Tailwind + Framer Motion + lucide-react artifact.

Include:
- Loading state for the submit button
- Inline error state for invalid credentials
- Mobile collapse (form full-width, brand visual hides below md:)
- Both light and dark themes work from tokens only
- Asymmetric layout (form left, brand visual right on desktop)
- Tactile active:scale-[0.98] on the submit button
- Spring physics on entry: form fields stagger in with stiffness 110 damping 18

Reuse the EduSynth design tokens exactly as specified in section 3.
No emojis, no Inter font, no #000/#fff, no gradient text.
```

After that screen, the cycle continues: pick the next surface from section 6, write a similarly specific prompt, review, iterate.
