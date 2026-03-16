# Workout Tracker

## Purpose
Personal web app to track a 4-day vertical jump program. Log sets/reps/weight, view progress over time, and use rest timers.

## Tech Stack
- Next.js 16 (App Router)
- Prisma 6 + Neon Postgres (cloud DB)
- Tailwind CSS 4
- Recharts for progress charts
- Two-profile support (no auth, localStorage-based switching)
- Deployed on Vercel: https://workout-tracker-eta-nine.vercel.app

## Source Data
- Google Doc: `1Psu0QVlvmQ52xvu1uACJFeaLELMGruPZqgNnIjtJuxU` ("4-Day Vertical Jump Program")
- Full program is seeded via `prisma/seed.ts`

## Data Model
- Profile (id, name) — two workout partners, no auth
- Program → ProgramDay → Section → Exercise
- WorkoutSession → SetLog (records weight/reps per set)
- WorkoutSession.profileId → Profile (each session belongs to one profile)
- Multiple programs supported — dashboard and program page render all programs

## Pages
| Route | Description |
|-------|-------------|
| `/` | Dashboard: week overview, day cards, start workout, recent history |
| `/workout/[dayId]` | Active workout: exercise cards, set logging, rest timer, workout timer |
| `/progress` | Charts: weight over time, volume over time, personal bests |
| `/history` | Calendar view, session detail on click, summary stats |
| `/program` | View/edit program structure, inline exercise editing |

## API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/programs` | GET | Full program with nested days/sections/exercises |
| `/api/programs/exercises` | POST, PATCH, DELETE | CRUD individual exercises |
| `/api/programs/reset` | POST | Re-seed database to default |
| `/api/profiles` | GET, POST, PATCH | Profile CRUD (list, create, rename) |
| `/api/workouts` | GET, POST | List sessions (profileId filter), find-or-create session |
| `/api/workouts/[id]` | GET, PATCH | Get/update session (e.g., completedAt) |
| `/api/workouts/[id]/sets` | POST | Upsert a set log |
| `/api/workouts/recommendations` | GET | Progressive overload recommendations based on last completed session |
| `/api/progress` | GET | Exercise list or progress data for charts |

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npx prisma db seed   # Re-seed database
npx prisma studio    # Visual DB browser
```

## Progressive Overload System
- **API**: `GET /api/workouts/recommendations?programDayId=X` — finds last completed session, computes per-set weight suggestions
- **Algorithm**: All sets completed at target reps → +5% weight (rounded to 2.5 lbs, min +2.5). Otherwise → same weight.
- **UX**: Inputs pre-fill with suggested values. Hint text shows "Last: 185 × 8 · Suggested: 195 lbs ↑". Bodyweight exercises show rep reference only.
- **Helpers**: `parseTargetReps()` handles "8-10", "6", "45 seconds" formats. `roundToNearest()` for weight rounding.
- **Files**: `src/app/api/workouts/recommendations/route.ts`, changes in `SetInput.tsx`, `ExerciseCard.tsx`, `workout/[dayId]/page.tsx`, `utils.ts`

## Profile System
- **Context**: `src/lib/profile-context.tsx` — React Context + localStorage. Stores profiles and activeProfileId. Instant switching, no API call.
- **Setup**: `src/components/ProfileSetup.tsx` — Full-screen overlay on first visit when no profiles in localStorage. Two name inputs → POST to `/api/profiles`.
- **Switcher**: `src/components/ProfileSwitcher.tsx` — Toggle pill in header (via `ClientLayout.tsx`). Active profile = `bg-primary text-white`.
- **Layout**: `src/components/ClientLayout.tsx` — Client component wrapping children with `ProfileProvider`, header with nav + switcher, and `ProfileSetup`.
- **Dashboard sync**: `src/components/DashboardProfileSync.tsx` — Keeps URL `?profile=id` in sync with context for the server-rendered dashboard.
- **Workout page**: Holds `sessions: Record<profileId, Session>` and `recs: Record<profileId, SetRecommendation[]>`. Switching profiles loads that profile's session lazily (cached once loaded). Finish button only completes the active profile's session.
- **Find-or-create**: `POST /api/workouts` checks for existing uncompleted same-day session for that profile before creating a new one.
- **All pages filter by profileId**: Dashboard (server queries), history, progress, recommendations.
- **Migration**: `20260302042656_add_profiles` — Creates Profile table, inserts "Default" profile, assigns existing sessions to it.

## Dark Mode
- **CSS**: `globals.css` — `@variant dark (&:where(.dark, .dark *))` enables class-based dark mode in Tailwind v4. `.dark {}` block overrides all theme CSS variables (background, foreground, primary, accent, muted, border, card, danger, warning).
- **Critical**: Must use `@theme` (NOT `@theme inline`) so Tailwind utilities reference CSS custom properties (`var(--color-card)`) instead of hardcoded values (`#ffffff`). Without this, `.dark {}` overrides have no effect on utility classes.
- **Apple HIG palette**: Dark mode uses Apple's elevation system — Level 0 `#000000` (page bg), Level 1 `#1c1c1e` (cards), Separator `#38383a` (borders), Labels `#f5f5f7` → `#8e8e93` (primary → secondary text). Includes `color-scheme: dark` for native form controls.
- **Context**: `src/lib/theme-context.tsx` — ThemeProvider persists preference in localStorage (`workout-theme`). Falls back to `prefers-color-scheme: dark` system preference on first visit.
- **Toggle**: `src/components/ThemeToggle.tsx` — Moon/sun SVG icon button in header nav. Calls `toggleTheme()` from context.
- **Flash prevention**: Inline `<script>` in `layout.tsx` `<head>` reads localStorage and applies `.dark` class before React hydrates.
- **Section badges**: Workout and program pages use `dark:` Tailwind variants for section type colors (e.g., `dark:text-amber-400 dark:bg-amber-900/30`) since those use hardcoded Tailwind colors outside the CSS variable system.

## Cardio Program
- **"Basketball Cardio Program"** — 3-week cardiovascular plan for basketball game prep
- 6 session types as ProgramDays: Steady-State, Intervals Base (Wk1), Long Easy Run, Intervals Ramp (Wk2), Basketball Intervals, Taper Jog (Wk3)
- No week-based auto-scheduling — user picks the right session based on their week
- Section types `cardio` (cyan) and `intervals` (rose) added to program page color map
- Uses existing schema — `reps` field stores durations like "20-30 min", "30s hard / 90s easy"
- Week schedule reference:
  - **Week 1**: 3x Steady-State + 2x Intervals Base + 1x Long Easy Run
  - **Week 2**: 2x Steady-State + 3x Intervals Ramp + 1x Basketball Intervals
  - **Week 3 (taper)**: 2x Intervals (moderate) + 1x Taper Jog + rest days before game

## Key Decisions
- Used Prisma 6 (not 7) because Prisma 7 requires adapter-based client init which adds complexity
- Switched from SQLite to Neon Postgres for Vercel deployment
- Tailwind CSS used freely (not Peek design system — this is a personal project)
- Phase indicator on dashboard is static for now (could be dynamic based on week count)
- Recommendations fetched in parallel with session creation (Promise.all) for no added latency
- Profiles stored in localStorage (no auth) — switching is instant, no round-trip
- Workout page caches both sessions in state so toggling between profiles is seamless
- Dark mode uses class-based strategy (`.dark` on `<html>`) with CSS variable overrides — must use `@theme` (not `@theme inline`) so utilities resolve via CSS vars. Apple HIG color palette for proper elevation hierarchy.
- Multi-program support: dashboard/API/program page all use `findMany` instead of `findFirst`, week overview uses day IDs (not day numbers) to handle overlapping numbering across programs

## Status
- [x] Project setup
- [x] Database schema + seed (4 lifting days + 6 cardio session types)
- [x] API routes
- [x] Dashboard page
- [x] Active Workout page (set logging, rest timer, workout timer)
- [x] Progress page (weight/volume charts, personal bests)
- [x] History page (calendar, session detail)
- [x] Program Editor (inline edit, delete exercises)
- [x] PWA support (manifest, apple-web-app)
- [x] Progressive overload recommendations (pre-fill weights, hint text, progression indicator)
- [x] Deployed to Vercel + Neon Postgres
- [x] Two-profile support (setup modal, toggle switcher, per-profile sessions/recs/history/progress)
- [x] Dark mode (toggle in header, system preference detection, localStorage persistence, no flash)
- [x] Multi-program support (dashboard, API, program page all show multiple programs)
- [x] Basketball Cardio Program (6 session types: steady-state, base intervals, long run, ramp intervals, basketball intervals, taper jog)
- [x] Build passes
