import { NextResponse } from "next/server";

import { processImageQueue } from "@/lib/queue/imageQueue";

export async function GET() {
  await processImageQueue();
  return NextResponse.json({ ok: true });
}
