import { Suspense } from "react";
import { connection } from "next/server";
import { CaptionsList } from "./CaptionsList";

export const dynamic = "force-dynamic";

export default async function AdminCaptionsPage() {
  await connection();
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-10">
          <p className="text-sm text-zinc-500">Loading captions…</p>
        </div>
      }
    >
      <CaptionsList />
    </Suspense>
  );
}
