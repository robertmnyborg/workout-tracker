# Chat coach (2026-10-25)

Goal: open /coach, the coach speaks first (what you trained recently, your goal, a suggestion), you answer in plain language, it builds the session. Follow-ups ("make it 10 min", "skip jumps", "I already played an hour of basketball") edit and rebuild.

## Principles
- Rules choose exercises, doses and recovery. Claude only turns your words into check-in fields (plus outside activity, goal, override).
- The corpus informs rules, not copied programs. Every recovery rule cites the principle line it comes from; inferred spacing is labelled [inference].
- The coach recommends; you can override ("I know, I still want to jump"). Overrides turn recovery rules into warnings.

## Pieces
1. `src/lib/engine/recovery.ts` (pure): load events from logged sessions and outside activity, then rules:
   - Explosive work (plyo/power) not on consecutive days; at most 2 explosive days per week (yt-athletic rule 11, yt-athletic 24:39).
   - Same region (lower/upper/core) loaded yesterday or earlier today: no loading of that region in Main (yt-programming rule 24, yt-athletic rule 5).
   - Hard sport or conditioning today or yesterday: no heavy legs (yt-athletic rule 7, 42:12).
   - Conditioning already done today: no conditioning added (yt-athletic 44:36).
   - `suggestFocus(goal, recovery)` for the opening message.
2. `buildPlan` takes the recovery result and filters the Main block (unless override).
3. DB (additive): `Profile.goal`, `Profile.goalFocus`; `CheckIn.outsideActivity`, `CheckIn.override`.
4. Parser: edits the current check-in from a new message; extracts outside activity, goal, override.
5. API: `GET /api/coach/opening`, `POST /api/coach/chat` (message or manual check-in edit; one CheckIn row per conversation, updated each turn). Replaces `/api/coach/parse` and `/api/coach/plan`.
6. UI: /coach becomes a chat; the plan card renders inside the coach's reply; sliders move under "Adjust".

## Done when
- Engine tests cover each recovery rule and override.
- Live: "played an hour of basketball, 30 min, want to jump" yields no plyos and no heavy legs, with cited reasons; "make it 10 minutes" shrinks it; opening message reflects a logged session.
