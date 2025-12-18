import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accountId: string;
    user: DefaultSession["user"] & {
      id: string;
      emailVerified: boolean;
    };
  }
}
