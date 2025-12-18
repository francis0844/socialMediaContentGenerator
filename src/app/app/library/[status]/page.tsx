"use client";

import { useParams } from "next/navigation";

import { LibraryPage } from "@/components/library/LibraryPage";

export default function LibraryStatusPage() {
  const params = useParams<{ status: string }>();
  const status = (params.status as "generated" | "accepted" | "rejected") ?? "generated";
  return <LibraryPage status={status} />;
}
