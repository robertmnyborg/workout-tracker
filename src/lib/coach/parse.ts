// Free text ("knees are cranky, slept badly, want to work on my jump, 30 min") -> typed CheckIn.
// Claude only reads the user's words; the engine (src/lib/engine) decides the training.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { BODY_AREAS, GOALS } from "../../../corpus/schema";
import type { CheckIn } from "../engine/plan";

const CheckInSchema = z.object({
  energy: z.number().int().min(1).max(5).describe("1 = exhausted, 3 = normal, 5 = great"),
  soreness: z.number().int().min(1).max(5).describe("1 = none, 3 = normal training soreness, 5 = very sore"),
  sleep: z.number().int().min(1).max(5).nullable().describe("1 = terrible, 5 = great; null if not mentioned"),
  painAreas: z.array(z.enum(BODY_AREAS)).describe("Areas with pain or injury (not normal soreness)"),
  focus: z.array(z.enum(GOALS)).min(1).describe("What they want to work on today"),
  minutes: z.number().int().min(5).max(120).describe("Time available; 30 if not mentioned"),
  summary: z.string().describe("One sentence restating how they feel and what they want, in second person"),
});

export type ParsedCheckIn = CheckIn & { summary: string };

const SYSTEM = `You turn a short note about how someone feels into training inputs for a workout planner.
Use only what the note says. Leave sleep null if it is not mentioned. Default energy and soreness to 3 and minutes to 30 when the note is silent.
Pain areas are places that hurt or are injured, not ordinary muscle soreness. "Tight" or "stiff" alone is not pain; treat it as a mobility focus on that area.
Focus mapping: jumping higher or dunking -> jump (plus power); posture, alignment, standing straighter -> posture; feeling beat up or wanting an easy day -> recovery; back or joint pain -> pain-relief; getting stronger -> strength; cardio or wind -> conditioning.`;

export async function parseCheckIn(text: string): Promise<ParsedCheckIn> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(CheckInSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: text }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Could not read that note. Set the sliders instead.");
  }
  const p = response.parsed_output;
  return { ...p, sleep: p.sleep ?? undefined };
}
