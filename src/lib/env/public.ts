import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Social Media Magic Generator"),
  NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default("Lexus"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
  });
  if (!parsed.success) {
    throw new Error(
      "Missing/invalid public environment variables: " +
        parsed.error.issues.map((i) => i.path.join(".")).join(", "),
    );
  }
  return parsed.data;
}
