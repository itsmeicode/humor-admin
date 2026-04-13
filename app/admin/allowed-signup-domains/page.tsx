import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SIGNUP_DOMAINS_FIELDS } from "@/lib/admin/crud-config";
import { applyOrderByRecentFirst } from "@/lib/admin/table-order";
import { GenericCrudClient } from "../_components/GenericCrudClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminAllowedSignupDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const pageRaw = parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const supabase = await createClient();
  const { data, error, count } = await applyOrderByRecentFirst(
    supabase.from("allowed_signup_domains").select("*", { count: "exact" }),
    "allowed_signup_domains"
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/allowed-signup-domains?page=${totalPages}`);
  }

  return (
    <GenericCrudClient
      table="allowed_signup_domains"
      title="Allowed Signup Domains"
      description="CRUD for allowed_signup_domains."
      basePath="/admin/allowed-signup-domains"
      fields={SIGNUP_DOMAINS_FIELDS}
      initialRows={(data as Record<string, unknown>[]) ?? []}
      initialTotal={total}
      page={page}
      fetchError={error?.message ?? null}
    />
  );
}
