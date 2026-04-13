import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CrudField } from "@/lib/admin/crud-config";
import { TERMS_FIELDS } from "@/lib/admin/crud-config";
import { applyOrderByRecentFirst } from "@/lib/admin/table-order";
import { GenericCrudClient } from "../_components/GenericCrudClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminTermsPage({
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
    supabase.from("terms").select("*", { count: "exact" }),
    "terms"
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: termTypes, error: termTypesError } = await supabase
    .from("term_types")
    .select("id, name")
    .order("id", { ascending: true })
    .limit(10_000);

  const termTypeOptions = (termTypes ?? []).map((r) => ({
    value: String(r.id),
    label: `${r.id}${r.name != null && String(r.name) !== "" ? ` — ${String(r.name)}` : ""}`,
  }));

  const fields: CrudField[] = TERMS_FIELDS.map((f) => {
    if (f.key !== "term_type_id") return f;
    if (termTypesError || termTypeOptions.length === 0) return f;
    return {
      ...f,
      type: "select" as const,
      required: true,
      options: termTypeOptions,
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/terms?page=${totalPages}`);
  }

  return (
    <GenericCrudClient
      table="terms"
      title="Terms"
      description="Terms: term, definition, example, priority, and term type. Timestamps and user ids are read-only; id is shown on each card."
      basePath="/admin/terms"
      fields={fields}
      initialRows={(data as Record<string, unknown>[]) ?? []}
      initialTotal={total}
      page={page}
      fetchError={error?.message ?? null}
    />
  );
}
