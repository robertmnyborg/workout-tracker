// A chat message ("played an hour of hoops, knees are cranky, 30 min left") -> edit of the current CheckIn.
// Claude only reads the user's words; the engine (src/lib/engine) decides the training.
// Runs on a Claude subscription through the Agent SDK (same pattern as Peek's mimic): locally it uses
// the logged-in Claude Code session, in production a `claude setup-token` value in CLAUDE_CODE_OAUTH_TOKEN.
import { query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { BODY_AREAS, GOALS, type Goal } from "../../../corpus/schema";
import type { CheckIn } from "../engine/plan";

const CheckInSchema = z.object({
  energy: z.number().int().min(1).max(5).describe("1 = exhausted, 3 = normal, 5 = great"),
  soreness: z.number().int().min(1).max(5).describe("1 = none, 3 = normal training soreness, 5 = very sore"),
  sleep: z.number().int().min(1).max(5).nullable().describe("1 = terrible, 5 = great; null if never mentioned"),
  painAreas: z.array(z.enum(BODY_AREAS)).describe("Areas with pain or injury (not normal soreness)"),
  focus: z.array(z.enum(GOALS)).min(1).describe("What to work on today"),
  minutes: z.number().int().min(5).max(120).describe("Training time still available today"),
  outsideActivity: z.array(z.object({
    kind: z.string().describe("basketball, run, hike, soccer..."),
    minutes: z.number().int().min(1).max(600),
    hard: z.boolean().describe("true for games, intervals, hard practice; false for easy walks or light shooting"),
    jumping: z.boolean().describe("true when the activity involves repeated jumping, e.g. basketball, volleyball"),
  })).describe("Sport or cardio already done TODAY outside this app"),
  override: z.boolean().describe("true only if the user insists on training something the coach advised resting"),
  goal: z.string().nullable().describe("A NEW standing goal the user states (\"my goal is to dunk\"); null otherwise"),
  goalFocus: z.array(z.enum(GOALS)).describe("Focus areas for that new goal; [] when goal is null"),
  summary: z.string().describe("One short sentence, second person, restating what the user told you. Never describe the session's contents: the planner decides those and may rule out what they asked for"),
});

export type ParsedCheckIn = CheckIn & { summary: string; goal: string | null; goalFocus: Goal[] };

const SYSTEM = `You turn chat messages about how someone feels into training settings for a workout planner.
You get the CURRENT settings as JSON and the user's NEW message. Return the full updated settings: change only what the message changes and keep every other field as it is. If the user just agrees ("sounds good", "let's do it"), return the settings unchanged.
Pain areas are places that hurt or are injured, not ordinary muscle soreness. "Tight" or "stiff" alone is not pain; treat it as a mobility focus on that area.
Focus mapping: jumping higher or dunking -> jump (plus power); feeling tight, crooked or unbalanced, posture, alignment -> posture (plus mobility); feeling beat up or wanting an easy day -> recovery; back or joint pain -> pain-relief; getting stronger -> strength; cardio or wind -> conditioning.
"I want to push harder" raises energy; "I need to recover" sets focus to recovery. Minutes is the time left for this session, not time already spent on other activity.
Outside activity is sport or cardio already done today; keep earlier entries unless the user corrects them.`;

export async function parseCheckIn(text: string, current: CheckIn, goal: string | null): Promise<ParsedCheckIn> {
  // An API key outranks the OAuth token in the CLI's credential lookup; drop it so the subscription is used.
  const { ANTHROPIC_API_KEY: _drop, ...env } = process.env;
  for await (const m of query({
    prompt: `CURRENT settings: ${JSON.stringify(current)}\nStanding goal: ${goal ?? "none"}\n\nNEW message: ${text}`,
    options: {
      systemPrompt: SYSTEM,
      model: "claude-opus-5-5",
      effort: "low",
      tools: [], // reading a note needs no tools
      settingSources: [], // ignore ~/.claude config, hooks and CLAUDE.md
      persistSession: false,
      maxTurns: 3,
      env,
      outputFormat: { type: "json_schema", schema: z.toJSONSchema(CheckInSchema, { target: "draft-7" }) },
    },
  })) {
    if (m.type !== "result") continue;
    const parsed = m.subtype === "success" ? CheckInSchema.safeParse(m.structured_output) : null;
    if (!parsed?.success) throw new Error("Could not read that note. Use Adjust instead.");
    return { ...parsed.data, sleep: parsed.data.sleep ?? undefined, goalFocus: parsed.data.goal ? parsed.data.goalFocus : [] };
  }
  throw new Error("Could not read that note. Use Adjust instead.");
}
