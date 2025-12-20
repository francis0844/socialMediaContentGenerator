import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { removeMemoryPreferenceByText } from "@/lib/ai/memory";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { log } from "@/lib/observability/log";

const removeSchema = z.object({
  preferenceText: z.string().min(3).max(200),
});

function extractPreferences(summary: string | null) {
  if (!summary) return [];
  return summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s+/, ""))
    .filter(Boolean);
}

export async function GET() {
  try {
    const session = await requireSession();
    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
      select: { memorySummary: true },
    });

    const prefs = extractPreferences(account.memorySummary);
    return NextResponse.json({
      ok: true,
      items: prefs.map((text, idx) => ({ id: `${idx}`, text })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = removeSchema.parse(await req.json());

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: session.accountId },
      select: { memorySummary: true },
    });

    const memoryUpdate = await removeMemoryPreferenceByText({
      previousSummary: account.memorySummary ?? "",
      preferenceText: body.preferenceText,
    });

    await prisma.account.update({
      where: { id: session.accountId },
      data: { memorySummary: memoryUpdate.memorySummary },
    });

    log("info", "ai.preferences.removed", { accountId: session.accountId });

    return NextResponse.json({
      ok: true,
      aiResponse: memoryUpdate.aiResponse,
      updatedMemorySummary: memoryUpdate.memorySummary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    log("error", "ai.preferences.remove_error", { error: message });
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
