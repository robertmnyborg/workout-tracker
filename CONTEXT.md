# Workout Tracker

## Purpose
Personal web app to track a combined training program: vertical jump / strength training, basketball cardio conditioning, and PT-inspired stabilizer work integrated into warm-ups. Log sets/reps/weight, view progress over time, and use rest timers.

## Tech Stack
- Next.js 16 (App Router)
- Prisma 6 + Neon Postgres (cloud DB)
- Tailwind CSS 4
- Recharts for progress charts
- Two-profile support (no auth, localStorage-based switching)
- Deployed on Vercel: https://workout-tracker-eta-nine.vercel.app

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
| `/` | Calendar dashboard: Mon-Sun schedule, week toggle (1/2/3), today highlighted, stacked workouts per day, rest days, recent history |
| `/workout/[dayId]` | Active workout: exercise cards, set logging, rest timer, workout timer |
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
