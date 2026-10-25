# YouTube extraction brief (Jeff Nippard + Renaissance Periodization), read with corpus/BRIEF.md

Source files: corpus/sources/youtube/<id>.md (metadata, description, '[m:ss] text' transcript lines).
These are mostly principle/explanation videos, so most value goes into a principles file, not new exercises.

Outputs per group (<g> given in your prompt):
1. corpus/principles/yt-<g>.md: the actionable principles the videos state, grouped by topic. Every bullet ends with a
   citation "(Channel, <id> @ m:ss)". Close paraphrase or short quote; never invent numbers. Where two videos disagree,
   say so. Mark anything you infer beyond the videos "[inference]". 600-1500 words. End with "## Rules the engine could use":
   concrete, checkable rules (e.g. "deload when 2+ fatigue indicators persist for a week") each with its citation.
2. corpus/library/yt-<g>.json: ONLY drills/exercises a video teaches with enough detail to perform (setup + execution),
   that are NOT already in the library. Existing ids: /private/tmp/claude-501/-Users-robertnyborg/68e0d486-aa17-4654-9060-4666a729d6c0/scratchpad/existing-ids.txt
   (also check names/aliases by grepping corpus/library/*.json). source.kind "youtube", source.ref "<url> @ m:ss", videoUrl set.
   [] is valid. ids must not collide with any other file (prefix nothing; just pick distinct kebab names; check the list).
3. For exercises ALREADY in the library that a video gives coaching cues/errors for, put them in the principles file under
   "## Cues for existing exercises" as "### <existing-id>" with bullets + citations. Do not edit other library files.
Run `cd ~/Projects/personal/workout-tracker && npm run -s corpus:check` until your files are clean.
