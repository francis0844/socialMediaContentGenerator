import type { z } from "zod";
import type { graphicOutputSchema } from "@/lib/ai/schemas";

export type GraphicOutput = z.infer<typeof graphicOutputSchema> & {
  mainMessage?: string;
  cta?: string | null;
  keywordsAvoid?: string | null;
};
