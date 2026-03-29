"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AccessDeniedBody() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const code = searchParams.get("code");

  let detail: string;
  switch (reason) {
    case "profile_error":
      detail =
        "The app could not read your row in `profiles` (PostgREST error). This usually means Row Level Security is blocking `select` for your user. In Supabase → Authentication → Policies (or SQL), allow authenticated users to read their own profile, e.g. `(auth.uid() = id)`. Error code from API: " +
        (code || "unknown") +
        ".";
      break;
    case "no_profile_row":
      detail =
        "There is no `profiles` row whose `id` matches your signed-in user id. Create a profile row for `auth.users.id`, or fix a mismatch if you edited the wrong row.";
      break;
    case "not_superadmin":
      detail =
        "`profiles.is_superadmin` is false for your account. Update it in the SQL editor (see README).";
      break;
    default:
      detail =
        "You do not have access to the admin area. If you expect access, confirm `profiles.is_superadmin` and RLS policies.";
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Access denied
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{detail}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Back to home
      </Link>
    </>
  );
}

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 dark:bg-amber-950/30">
      <div className="max-w-lg text-center">
        <Suspense
          fallback={
            <p className="text-sm text-zinc-500">Loading…</p>
          }
        >
          <AccessDeniedBody />
        </Suspense>
      </div>
    </main>
  );
}
