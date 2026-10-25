import { NextRequest, NextResponse } from "next/server";
import { parseCheckIn } from "@/lib/coach/parse";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  try {
    return NextResponse.json(await parseCheckIn(text));
  } catch (e) {
    // No subscription token on this host, or Claude could not read the note: the sliders still work.
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
}
