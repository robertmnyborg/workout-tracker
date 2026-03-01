import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST() {
  try {
    execSync("npx prisma db seed", {
      cwd: process.cwd(),
      env: { ...process.env },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset program" },
      { status: 500 }
    );
  }
}
