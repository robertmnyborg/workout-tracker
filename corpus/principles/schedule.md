# 3-Week Schedule and Load Progression

Source: `prisma/seed.ts` (weekly schedules) and `src/app/api/workouts/recommendations/route.ts` (progression).
Lifting days come from `programs/vertical-jump-4day.json`; cardio days from `programs/basketball-cardio.json`.
When a day lists two sessions, the lifting session comes first and the cardio follows it.

## Calendar

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| 1. Base Building | Lower Strength + Steady-State Cardio | Intervals — Base | Upper Body + Core + Steady-State Cardio | Rest (recovery day) | Lower Power + Intervals — Base | Athletic Full Body + Steady-State Cardio | Long Easy Run |
| 2. Intensity Ramp | Lower Strength + Steady-State Cardio | Intervals — Ramp | Upper Body + Core + Intervals — Ramp | Rest (recovery day) | Lower Power + Basketball Intervals (sport-specific, after lifting) | Athletic Full Body + Steady-State Cardio | Intervals — Ramp |
| 3. Peak + Taper | Lower Strength + Intervals — Base (moderate effort, don't go all-out) | Upper Body + Core + Intervals — Base (moderate effort, last interval session) | Taper Jog | Rest (fresh legs for game day) | Rest or light walk | Rest (stay off your feet) | Game Day |

Week notes from the seed:
- Week 1: 3x steady-state + 2x base intervals + 1x long run. All 4 lifting days.
- Week 2: 2x steady-state + 3x ramp intervals + 1x basketball intervals. All 4 lifting days.
- Week 3: 2 lifting days only (Mon/Tue). 2x moderate intervals + 1x taper jog. Rest Thu-Sat. Game Sunday.

Program-level rules: train the 4 lifting days per week, rest or light mobility on off days; stop hard cardio training 4-5 days before game day.

## Load progression (weighted lifts)

Evaluate per exercise, from the last session's logged sets:

| Condition | Next session load |
|---|---|
| Every prescribed set completed at or above target reps | Last load × 1.05, rounded to the nearest 2.5 lb. If rounding gives no increase, last load + 2.5 lb (minimum +2.5 lb). |
| Any set missed, or fewer sets completed than prescribed | Same load |

Example: 135 lb × 1.05 = 141.75 → 142.5 lb. 40 lb × 1.05 = 42 → rounds to 42.5 lb.
