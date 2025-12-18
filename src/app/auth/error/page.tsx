import { Suspense } from "react";

import { AuthErrorClient } from "./AuthErrorClient";

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorClient />
    </Suspense>
  );
}

