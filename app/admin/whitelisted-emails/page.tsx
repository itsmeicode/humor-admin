import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WHITELIST_EMAILS_FIELDS } from "@/lib/admin/crud-config";
import { adminTables } from "@/lib/admin/table-names";
import { applyOrderByRecentFirst } from "@/lib/admin/table-order";
import { GenericCrudClient } from "../_components/GenericCrudClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminWhitelistedEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const pageRaw = parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const supabase = await createClient();
  const table = adminTables.whitelisted_email_addresses;
  const { data, error, count } = await applyOrderByRecentFirst(
    supabase.from(table).select("*", { count: "exact" }),
    table
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/whitelisted-emails?page=${totalPages}`);
  }

  return (
    <GenericCrudClient
      table={adminTables.whitelisted_email_addresses}
      title="Whitelisted Emails"
      description="CRUD for whitelist email addresses."
      basePath="/admin/whitelisted-emails"
      fields={WHITELIST_EMAILS_FIELDS}
      initialRows={(data as Record<string, unknown>[]) ?? []}
      initialTotal={total}
      page={page}
      fetchError={error?.message ?? null}
    />
  );
}
