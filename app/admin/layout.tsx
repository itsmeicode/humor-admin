import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Profiles" },
  { href: "/admin/images", label: "Images" },
  { href: "/admin/captions", label: "Captions" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    redirect(
      `/access-denied?reason=profile_error&code=${encodeURIComponent(profileError.code ?? "")}`
    );
  }

  if (!profile) {
    redirect("/access-denied?reason=no_profile_row");
  }

  if (!profile.is_superadmin) {
    redirect("/access-denied?reason=not_superadmin");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-zinc-800 bg-zinc-950 px-5 py-8 text-zinc-100 md:w-56 md:border-b-0 md:border-r">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Staging
        </p>
        <p className="mt-1 text-lg font-semibold text-white">Admin</p>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="mt-10">
          <button
            type="submit"
            className="w-full rounded-lg border border-zinc-500 bg-zinc-800/70 px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </aside>
      <div className="min-h-screen flex-1 bg-zinc-100 dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
