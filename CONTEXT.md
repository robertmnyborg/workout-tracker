# Workout Tracker

## Purpose
Personal web app to track a combined training program: vertical jump / strength training, basketball cardio conditioning, and PT-inspired stabilizer work integrated into warm-ups. Log sets/reps/weight, view progress over time, and use rest timers.

## Tech Stack
- Next.js 16 (App Router)
- Prisma 6 + Neon Postgres (cloud DB)
- Tailwind CSS 4
- Recharts for progress charts
- Two-profile support (no auth, localStorage-based switching)
- Hosted on Fly.io: https://robert-workout-tracker.fly.dev (app `robert-workout-tracker`, personal org, sjc, scale-to-zero).
  Push to main deploys via `.github/workflows/fly-deploy.yml` (repo secret FLY_API_TOKEN, 1-year deploy token).
  The old Vercel URL https://workout-tracker-eta-nine.vercel.app now only redirects to Fly (`vercel.json`).

## Source Data
- Google Doc: `1Psu0QVlvmQ52xvu1uACJFeaLELMGruPZqgNnIjtJuxU` ("4-Day Vertical Jump Program")
- Cardio plan: 3-week basketball cardiovascular training (provided inline)
- PT routines: `physical_therapy_routines/` folder (2018, 2020, 2026 programs)
- Full program is seeded via `prisma/seed.ts`

## Data Model
- Profile (id, name) — two workout partners, no auth
- Program → ProgramDay → Section → Exercise
- WorkoutSession → SetLog (records weight/reps per set)
- WorkoutSession.profileId → Profile (each session belongs to one profile)
- WeekSchedule → ScheduleEntry → ProgramDay (calendar-based scheduling)
- ScheduleEntry supports multiple workouts per day (e.g., lifting + cardio) via `order` field
- Rest days are entries with `isRest: true` and optional notes

### Meal Tracker
- NutritionTarget (profileId unique, calories, protein, carbs, fat) — per-profile daily macro targets
- Food (name unique, per-100g macros, defaultServingGrams/Label, tags: String[]) — food DB, ~70 seeded
- MealPlan → MealPlanMeal → MealPlanItem (gramsMale/Female + food) — plan templates per profile
- MealLog (profileId, date, mealType) → MealLogItem (grams + macro snapshot + food)
- `Food.tags` drives weekly non-negotiables (e.g., `fattyFish`, `organReplacement`, `darkLeafyGreens`)
- MealLogItem stores a **macro snapshot** at log time (stable if Food is edited later)
- Dates stored as **local midnight** (parsed via `parseLocalDate` in `src/lib/meal-dates.ts` to avoid UTC off-by-one bugs)

## Programs
### 4-Day Vertical Jump Program (lifting + jump training)
- Day 1: Lower Strength (squat patterns, hip hinge, single-leg)
- Day 2: Upper Body + Core (push/pull, scapular health, core circuit)
- Day 3: Lower Power (plyometrics, reactive strength, explosive power)
- Day 4: Athletic Full Body (complexes, rotational power, agility)

### Basketball Cardio Program (3-week conditioning)
- Day 1: Steady-State Cardio (20-30 min, 65-70% max HR)
- Day 2: Intervals — Base (6-8 rounds, 30s hard / 90s easy)
- Day 3: Long Easy Run (30-40 min)
- Day 4: Intervals — Ramp (8-10 rounds, 40s hard / 80s easy)
- Day 5: Basketball Intervals (suicide sprints, defensive slides)
- Day 6: Taper Jog (easy 20 min)

### PT-Inspired Warm-Up Additions
Sourced from 2018/2020/2026 physical therapy routines, deduplicated against existing activation exercises:
- **Day 1**: Prone Press Up (lumbar extension prep) + Hip IR/ER Rotation (hip mobility)
- **Day 2**: Thoracic Rotation Open Book (T-spine mobility)
- **Day 3**: Reverse Clamshell (internal rotators) + Quadruped Train Tracks (deep hip stabilizers)
- **Day 4**: TA March (dynamic TVA, replaced static breathing) + Forward T (single-leg proprioception)

## Weekly Calendar Schedule
Dashboard is calendar-based (Mon-Sun) with a week toggle (1/2/3). Each day shows stacked workouts or rest.

### Week 1 — Base Building
| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Lifting | Lower Strength | - | Upper + Core | - | Lower Power | Athletic Full Body | - |
| Cardio | Steady-State | Intervals Base | Steady-State | **Rest** | Intervals Base | Steady-State | Long Easy Run |

### Week 2 — Intensity Ramp
| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Lifting | Lower Strength | - | Upper + Core | - | Lower Power | Athletic Full Body | - |
| Cardio | Steady-State | Intervals Ramp | Intervals Ramp | **Rest** | Basketball Intervals | Steady-State | Intervals Ramp |

### Week 3 — Peak + Taper
| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Lifting | Lower Strength | Upper + Core | - | - | - | - | - |
| Cardio | Intervals (moderate) | Intervals (moderate) | Taper Jog | **Rest** | **Rest** | **Rest** | **Game Day** |

## Pages
| Route | Description |
|-------|-------------|
| `/` | **Today (unified daily log)** — app opens here. Resolves today's weekday → all of today's schedule entries in order → stacks every section (PT Activation → Strength → Cardio) into ONE scroll with one timer and one "Finish Day". Rest-day + day-complete states. Week toggle (no start-date anchor yet, defaults to week 1). Component: `src/components/DayLog.tsx` (find-or-creates one WorkoutSession per program day, merged only in the view). Added 2026-06-08. |
| `/week` | Calendar dashboard (the former `/`): Mon-Sun schedule, week toggle (1/2/3), today highlighted, stacked workouts per day, rest days, recent history |
| `/workout/[dayId]` | Single-day active workout (still used by `/week` cards and Today's "Redo"): exercise cards, set logging, rest timer, workout timer |
| `/progress` | Charts: weight over time, volume over time, personal bests |
| `/history` | Calendar view, session detail on click, summary stats |
| `/program` | View/edit all programs, inline exercise editing |
| `/meals` | Daily meal log with macro progress bars, meal-by-meal sections, weekly non-negotiables card, date picker |
| `/meals/plans` | Browse both plan templates (Western + Asian), activate, reset to defaults |
| `/meals/foods` | Food database search + add custom food |
| `/meals/progress` | 7/30/90-day macro line charts vs targets (calories, protein, carbs, fat) |

## API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/programs` | GET | All programs with nested days/sections/exercises |
| `/api/programs/exercises` | POST, PATCH, DELETE | CRUD individual exercises |
| `/api/programs/reset` | POST | Re-seed database to default |
| `/api/profiles` | GET, POST, PATCH | Profile CRUD (list, create, rename) |
| `/api/schedule` | GET | Weekly schedule by `?week=N` with entries and program days |
| `/api/workouts` | GET, POST | List sessions (profileId filter), find-or-create session |
| `/api/workouts/[id]` | GET, PATCH | Get/update session (e.g., completedAt) |
| `/api/workouts/[id]/sets` | POST | Upsert a set log |
| `/api/workouts/recommendations` | GET | Progressive overload recommendations based on last completed session |
| `/api/progress` | GET | Exercise list or progress data for charts |
| `/api/nutrition/targets` | GET, PATCH | Per-profile daily macro targets |
| `/api/foods` | GET, POST | Food DB search + create |
| `/api/foods/[id]` | PATCH, DELETE | Edit/remove a food |
| `/api/meals` | GET, POST | List/create meal logs (profile + date scoped) |
| `/api/meals/[id]` | PATCH, DELETE | Update/delete a meal log |
| `/api/meals/[id]/items` | POST | Add food item to meal log (server computes macro snapshot) |
| `/api/meals/items/[id]` | PATCH, DELETE | Edit/remove an item |
| `/api/meals/totals` | GET | Daily macro totals for a profile+date |
| `/api/meals/weekly-compliance` | GET | 7-day rolling non-negotiables checklist |
| `/api/meals/progress` | GET | Daily macros over a rolling window (for charts) |
| `/api/meals/bootstrap` | POST | First-run setup: creates targets (male/female preset) + seeds plan templates |
| `/api/meal-plans` | GET | All plans for a profile with nested meals/items |
| `/api/meal-plans/[id]/activate` | POST | Make a plan active (deactivates others) |
| `/api/meal-plans/reset` | POST | Wipe+rebuild default Western + Asian templates for profile (preserves logs) |

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
- **Dashboard sync**: `src/components/DashboardProfileSync.tsx` — Keeps URL `?profile=id` and `?week=N` in sync with context for the server-rendered dashboard.
- **Workout page**: Holds `sessions: Record<profileId, Session>` and `recs: Record<profileId, SetRecommendation[]>`. Switching profiles loads that profile's session lazily (cached once loaded). Finish button only completes the active profile's session.
- **Find-or-create**: `POST /api/workouts` checks for existing uncompleted same-day session for that profile before creating a new one.
- **All pages filter by profileId**: Dashboard (server queries), history, progress, recommendations.

## Color Theme — Navy Blue
- **Light mode**: Navy primary `#1a3a5c`, columbia blue accent `#4a90d9`, cool gray bg `#f0f4f8`, slate-blue muted `#6b839e`, soft blue-gray borders `#c8d6e5`
- **Dark mode**: Steel blue primary `#5b9bd5`, sky accent `#75b8f4`, deep navy bg `#0a1222`, dark navy cards `#111d2e`, dark slate borders `#1e2d42`
- **Section type badges** use distinct Tailwind colors (amber, red, blue, green, purple, orange, cyan, rose) for functional differentiation — not theme colors
- PWA manifest and icon also use navy `#1a3a5c`

## Dark Mode
- **CSS**: `globals.css` — `@variant dark (&:where(.dark, .dark *))` enables class-based dark mode in Tailwind v4. `.dark {}` block overrides all theme CSS variables.
- **Critical**: Must use `@theme` (NOT `@theme inline`) so Tailwind utilities reference CSS custom properties. Without this, `.dark {}` overrides have no effect on utility classes.
- **Context**: `src/lib/theme-context.tsx` — ThemeProvider persists preference in localStorage (`workout-theme`). Falls back to `prefers-color-scheme: dark` system preference on first visit.
- **Toggle**: `src/components/ThemeToggle.tsx` — Moon/sun SVG icon button in header nav.
- **Flash prevention**: Inline `<script>` in `layout.tsx` `<head>` reads localStorage and applies `.dark` class before React hydrates.

## Key Decisions
- Used Prisma 6 (not 7) because Prisma 7 requires adapter-based client init which adds complexity
- Switched from SQLite to Neon Postgres for Vercel deployment
- Tailwind CSS used freely (not Peek design system — this is a personal project)
- Recommendations fetched in parallel with session creation (Promise.all) for no added latency
- Profiles stored in localStorage (no auth) — switching is instant, no round-trip
- Workout page caches both sessions in state so toggling between profiles is seamless
- Dark mode uses class-based strategy with CSS variable overrides — must use `@theme` (not `@theme inline`) so utilities resolve via CSS vars
- Multi-program support: dashboard/API/program page all use `findMany` instead of `findFirst`
- Calendar-based scheduling via WeekSchedule + ScheduleEntry tables — maps Mon-Sun to program days with week toggle
- PT exercises integrated into existing activation sections (not separate) — deduplicated against existing warm-up exercises
- Week 3 taper drops to 2 lifting days for fresh legs before game day
- Navy blue color theme throughout (replaced original purple/indigo)

## Meal Tracker
- **Two plan templates** seeded per profile: Western Power + Asian-Based (user can activate one)
- **Daily targets**: Male preset 2,900 kcal / 215p / 325c / 87f · Female preset 2,000 kcal / 145p / 200c / 65f
- **Free-form food entry**: 70 seeded foods (eggs, salmon, oysters, spinach, brown rice, natto, …). Users can add custom foods with per-100g macros + tags.
- **Macro snapshot at log time**: when a MealLogItem is created, server computes calories/p/c/f from Food's per-100g values × grams/100. Snapshot is persisted so later edits to Food don't retroactively change old logs.
- **Weekly non-negotiables**: 9 tags (fattyFish, darkLeafyGreens, vitC, zincSource, brazilNuts, vitE, organReplacement, fermentedK2, iodine). UI filters irrelevant ones based on active plan (Asian vs Western).
- **Liver replacement**: the "1x/week liver anchor" from the nutritionist plans was swapped for **oysters/clams/mussels** — closest non-organ match for zinc, copper, B12, selenium, iron. Vit A/folate already covered by sweet potato + leafy greens elsewhere in the plan.
- **Plan independence**: each profile gets their own copies of Western + Asian (per-profile unique key: `@@unique([profileId, name])`). Editing one profile's plan doesn't affect the other.
- **Bootstrap**: first-visit `/meals` for a profile without a NutritionTarget shows a preset chooser (Male/Female). Clicking seeds target + both plan templates. See `src/components/meals/BootstrapPrompt.tsx`.
- **Plan suggestions**: on empty meal sections, the active plan's meals for that type are shown as read-only hints (not auto-logged — free-form entry preferred).
- **Food tags**: stored as `String[]` on Food; AVAILABLE_TAGS + COMPLIANCE_TAGS in `src/lib/meal-constants.ts`.
- **Seed flow**: `prisma/seed.ts` calls `seedMeals()` at the end — upserts foods (idempotent), creates targets per profile (first profile = Male, subsequent = Female), wipes+recreates plan templates. Plan templates also exported from `src/lib/meal-plan-templates.ts` for reuse by the reset endpoint.
- **Date handling**: YYYY-MM-DD query strings are parsed as LOCAL midnight via `parseLocalDate` (`src/lib/meal-dates.ts`). Prevents UTC off-by-one where `new Date("2026-04-22")` would map to April 21 in Pacific time.

## Status
- [x] Project setup
- [x] Database schema + seed (4 lifting days + 6 cardio sessions + 3-week schedule)
- [x] API routes (programs, schedule, workouts, profiles, progress)
- [x] Calendar-based dashboard (Mon-Sun, week toggle, stacked workouts, rest days, today highlight)
- [x] Active Workout page (set logging, rest timer, workout timer)
- [x] Progress page (weight/volume charts, personal bests)
- [x] History page (calendar, session detail)
- [x] Program Editor (inline edit, delete exercises, all programs)
- [x] PWA support (manifest, apple-web-app)
- [x] Progressive overload recommendations (pre-fill weights, hint text, progression indicator)
- [x] Deployed to Vercel + Neon Postgres
- [x] Two-profile support (setup modal, toggle switcher, per-profile sessions/recs/history/progress)
- [x] Dark mode (toggle in header, system preference detection, localStorage persistence, no flash)
- [x] Basketball Cardio Program (6 session types across 3 weeks)
- [x] PT-inspired warm-up exercises (stabilizer muscles, deduplicated from 3 PT routines)
- [x] 3-week calendar schedule (WeekSchedule + ScheduleEntry, lifting + cardio combined per day)
- [x] Navy blue color theme (light + dark modes)
- [x] Meal tracker: schema (NutritionTarget, Food, MealPlan, MealPlanMeal, MealPlanItem, MealLog, MealLogItem)
- [x] Meal tracker: 70 seeded foods + Western + Asian plan templates (per profile, oyster-based liver swap)
- [x] Meal tracker: API routes (foods, meals, totals, weekly-compliance, progress, plans, bootstrap)
- [x] Meal tracker: UI (/meals daily log, /meals/plans, /meals/foods, /meals/progress) with macro bars, compliance checklist, plan suggestions
- [x] Build passes

## Unified corpus + Coach (2026-10-24)
Plan: `plans/unified-corpus-and-coach.md`.

### Corpus (`corpus/`)
- `library/*.json`: 151 exercises (2026-10-25: +24 from Jeff Nippard and Renaissance Periodization channels; see yt-*.json)
  Previously 127, one record per movement, typed by `corpus/schema.ts`:
  bat 26 (BAT 28-day, from `~/Projects/bat-28day`), pt 27 (2018/2020/2026 PT), trainer 72 (seed.ts lifting/jump/cardio),
  youtube 2 (RP / Dr. Mike jump video n1-KuZ9aOHM). Each has category, bodyAreas, goals, intensity 1-5, impact,
  progression method + easier/harder links, cues, errors.
- `programs/*.json`: bat-28day (Day 0-28), pt-2018/2020/2026, vertical-jump-4day, basketball-cardio.
- `principles/*.md`: bat-alignment, pt-notes, jump-science, schedule, yt-athletic, yt-pt, yt-programming, yt-technique
  (timestamped citations; yt-pt states the Jeff-vs-BAT posture disagreement; yt-programming lists engine gaps).
- `sources/youtube/channels/`: full catalogs of both channels (YouTube Data API via Antigravity), `candidates.json`
  (keyword pass, 487) and `shortlist.json` (34 picked; 31 transcribed, 3 members-only excluded; 4 via Gemini video
  understanding because captions were off or garbled). Neither channel has a true vertical-jump/plyometric video. Reference text for an AI planner.
- `sources/youtube/<id>.md`: raw transcripts.
- `npm run corpus:check` validates (enums, unique ids, link targets). `npm run corpus:import` upserts into the DB.
- **Never run `prisma db seed` / `/api/programs/reset`: they delete all profiles and sessions.** `corpus:import` is additive.
- Gaps: BAT Day 27 lesson was never captured and Circle access is gone; Day 27 is RECONSTRUCTED from the Day 20 three-axis
  pattern + Week 4 plan doses (see its focus note). Day 26 = Day 25 (lesson title says Repeat). Day 14 is photos only.
- Adding a YouTube source: Antigravity pulls it (Google data access), never Claude scraping:
  `agy -p "Get the full transcript and key coaching points of <url>; write corpus/sources/youtube/<id>.md" --print-timeout 600s`.
  Then extract to `library/<source>.json`, `npm run corpus:check`, `npm run corpus:import`.
  (n1-KuZ9aOHM was re-pulled this way on 2026-10-25: native transcript, description, top 20 jump comments.)

### DB additions (migration 20261024120000, additive)
`LibraryExercise` (corpus mirror, `data` = full JSON), `Exercise.libraryId`, `Program.corpusId`,
`ProgramEnrollment` (profile + program + startDate; day N = calendar days since start, UTC-date storage via `src/lib/program-day.ts`),
`CheckIn` (parsed inputs + saved plan JSON). All 92 seeded exercises are linked to library ids.

### BAT on Today
`BatCard` on `/`: Start (pick Day 0 date) → "BAT Day N of 28". The BAT day stacks first in the daily log every day, rest days included.

### Engine (`src/lib/engine/`, pure, `npm test` = 20 node:test cases)
- `readiness` = round((energy + (6 - soreness) + sleep) / 3) - 1 if any pain. Max intensity: r1→2, r2→3, r3→4, r4-5→5.
  High impact only at readiness 4+ and no knee/ankle/lumbar/hip pain.
- Painful areas get only gentle work (breathing/alignment/mobility/stability, intensity ≤ 2).
- Blocks: Alignment (BAT day if enrolled, else breathing/alignment) → Prep (mobility/stability on the focus's body areas) →
  Main (explosive capped at 2 plyo + 1 power + 1 skill, then strength). Readiness ≤ 2 or no trainable focus = recovery day, no Main.
- `progression.nextDose`: load +5% (min +2.5 lb, max +10 lb) after hitting every set; reps +2; hold +5 s; complexity → harder after 3 clean
  sessions. Two stalled sessions → deload: half the sets, 10% lighter (RP). Readiness ≤ 2 → today only: 10% lighter / one set fewer / easier variation.
- Open engine gaps (from yt-programming.md): no scheduled deload every 4-8 weeks, no training-age gate, no RPE input, no
  game-day taper (yt-athletic.md has the rules), no per-exercise pain swap (yt-pt.md rules), readiness ignores stress/appetite/jump height.

### Coach (`/coach`) — chat since 2026-10-25 (plan: `plans/chat-coach.md`)
`GET /api/coach/opening` (no AI: last 7 days of logged sessions + outside activity, standing goal, recovery rules →
suggested focus + question) → each message `POST /api/coach/chat` (Claude edits the current check-in: fields, outside
activity like "an hour of basketball", new standing goal, override) → engine rebuilds → plan card in the reply → "Start
this session" → `POST /api/coach/start`. One CheckIn row per conversation, updated each turn. "Adjust settings by hand"
posts the same route with no message. Claude never picks exercises or loads; its summary only restates what you said.
- Recovery (`src/lib/engine/recovery.ts`), each rule cites a principle line, shown under the plan:
  48 h between hard jump days (plyo/power/skill at intensity ≥4, or jumping sport) and 2 a week (PJF); region
  (lower/upper/core, full-body = all) loaded yesterday or earlier today rests from Main; hard sport earlier TODAY → no heavy
  legs (the day after, slow heavy strength is fine, PJF); cardio already done today → no extra conditioning. Knee (any) pain
  pulls pain-relief tendon isometrics (Spanish squat etc.) into Prep.
- Jump corpus (2026-10-25): Antigravity picked The Movement System (Dr. Matt Casturo, DPT) and PJF Performance (Paul
  Fabritz, NBA) from 14 channels (`corpus/sources/youtube/jump/README.md`); 12 transcripts → `principles/yt-jump.md`
  (20 engine rules) + 20 drills in `library/yt-jump.json`. Not yet in the engine: weekly contact caps by training age,
  12-week phase clock, weekly jump test log. Built 2026-10-25 from the /setup questionnaire (Profile.athlete JSON, `src/lib/engine/athlete.ts`):
  per-session contact caps by plyo age (beginner 100/0 high, intermediate 120/20, advanced 150/30; sets trimmed to fit), depth jumps
  locked until 6+ mo plyo and 6+ mo lifting (also blocks progression swaps into them), jerk budget (jumping sport 3x/wk, or 2x/wk with
  knee/ankle history, drops fast power lifts except low-landing ones), approach-standing gap < 4 in ranks skill drills first, knee/ankle
  history adds the tendon isometric primer on jump days. No answers = beginner limits; the opening message says so. "Train through" (override) keeps the plan and shows the rules as warnings.
- DB (migration 20261025120000, additive): `Profile.goal`, `Profile.goalFocus`; `CheckIn.outsideActivity`, `CheckIn.override`.
- Runs on Robert's Claude subscription via the Claude Agent SDK, the same pattern as Peek's mimic: Fly secret
  `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` (valid 1 year, created 2026-10-25; rotate by re-running and
  `fly secrets set`). Locally it uses the logged-in Claude Code session. Any ANTHROPIC_API_KEY is stripped from the
  child env because it would outrank the token. Parse takes ~12 s. Without a token, chat returns 503 and Adjust still works.
- Why Fly, not Vercel: the SDK bundles a 278MB Claude binary (linux-x64); Vercel functions cap at 250MB.

### Status 2026-10-24
- [x] Corpus, import, BAT enrollment on Today, engine + tests, coach page, verified at 390px in Chrome.
- [x] Coach on subscription, live on Fly (2026-10-25).
- [ ] More YouTube sources (user to send links).
- [x] Duplicate Robert/Casey copies removed 2026-10-25 (all empty); POST /api/profiles now reuses an existing name, so a new device joins the same profiles.

- 2026-10-25: Restyled to the Peek dashboard tokens (marketing-tracker look): Roboto, #FAFAFA page, white hairline cards, radius 4
  (Tailwind radius tokens all 4px), navy primary with `text-on-primary`, teal only for the active tab/focus. Light/Dark segmented
  switch in the header (`theme-context` setTheme). Emoji nav and rainbow section pills removed. Coach is a transcript with a plan table.
  Gotcha: the app re-creates any profile listed in a browser's localStorage that is missing from the DB (profile-context reconcile),
  so clear the test browser's storage before deleting a test profile.
