import "server-only";

export async function maybeFetchVoiceDocText(voiceDocUrl: string | null) {
  if (!voiceDocUrl) return null;
  const lower = voiceDocUrl.toLowerCase();
  if (!lower.endsWith(".txt")) return null;

  try {
    const res = await fetch(voiceDocUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, 8000);
  } catch {
    return null;
  }
}

