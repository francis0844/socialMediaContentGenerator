import { Suspense } from "react";

import { VerifyClient } from "@/app/verify/VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyClient />
    </Suspense>
  );
}

