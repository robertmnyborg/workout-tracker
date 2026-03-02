# Workout Tracker

## Purpose
Personal web app to track a 4-day vertical jump program. Log sets/reps/weight, view progress over time, and use rest timers.

## Tech Stack
- Next.js 16 (App Router)
- Prisma 6 + Neon Postgres (cloud DB)
- Tailwind CSS 4
- Recharts for progress charts
- No auth (single user)
- Deployed on Vercel: https://workout-tracker-eta-nine.vercel.app

## Source Data
- Google Doc: `1Psu0QVlvmQ52xvu1uACJFeaLELMGruPZqgNnIjtJuxU` ("4-Day Vertical Jump Program")
- Full program is seeded via `prisma/seed.ts`

## Data Model
- Program → ProgramDay → Section → Exercise
- WorkoutSession → SetLog (records weight/reps per set)

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
| `/api/workouts` | GET, POST | List sessions, start new session |
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

## Key Decisions
- Used Prisma 6 (not 7) because Prisma 7 requires adapter-based client init which adds complexity
- Switched from SQLite to Neon Postgres for Vercel deployment
- Tailwind CSS used freely (not Peek design system — this is a personal project)
- Phase indicator on dashboard is static for now (could be dynamic based on week count)
- Recommendations fetched in parallel with session creation (Promise.all) for no added latency

## Status
- [x] Project setup
- [x] Database schema + seed (all 4 days, all exercises with cues)
- [x] API routes
- [x] Dashboard page
- [x] Active Workout page (set logging, rest timer, workout timer)
- [x] Progress page (weight/volume charts, personal bests)
- [x] History page (calendar, session detail)
- [x] Program Editor (inline edit, delete exercises)
- [x] PWA support (manifest, apple-web-app)
- [x] Progressive overload recommendations (pre-fill weights, hint text, progression indicator)
- [x] Deployed to Vercel + Neon Postgres
- [x] Build passes
