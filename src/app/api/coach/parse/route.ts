import { NextRequest, NextResponse } from "next/server";
import { parseCheckIn } from "@/lib/coach/parse";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "No ANTHROPIC_API_KEY set. Use the sliders." }, { status: 503 });
  }
  return NextResponse.json(await parseCheckIn(text));
}
