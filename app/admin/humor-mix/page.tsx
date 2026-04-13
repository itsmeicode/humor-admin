import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CrudField } from "@/lib/admin/crud-config";
import { HUMOR_MIX_FIELDS } from "@/lib/admin/crud-config";
import { adminTables } from "@/lib/admin/table-names";
import { normalizeSelectId } from "@/lib/admin/normalize-select-id";
import { applyOrderByRecentFirst } from "@/lib/admin/table-order";
import { GenericCrudClient } from "../_components/GenericCrudClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

/** PostgREST defaults to ~1000 rows; raise so flavor ids like 37 are not cut off. */
const HUMOR_FLAVORS_LIST_LIMIT = 100_000;

export default async function AdminHumorMixPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const pageRaw = parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const supabase = await createClient();
  const table = adminTables.humor_mix;
  const { data, error, count } = await applyOrderByRecentFirst(
    supabase.from(table).select("*", { count: "exact" }),
    table
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const mixRows = (data ?? []) as Record<string, unknown>[];

  const { data: flavors } = await supabase
    .from("humor_flavors")
    .select("id, name")
    .order("id", { ascending: true })
    .limit(HUMOR_FLAVORS_LIST_LIMIT);

  const byNorm = new Map<string, { id: unknown; name: unknown }>();
  for (const r of flavors ?? []) {
    byNorm.set(normalizeSelectId(r.id), r);
  }

  const idsFromMixPage = [
    ...new Set(
      mixRows
        .map((row) => normalizeSelectId(row.humor_flavor_id))
        .filter((id) => id !== "")
    ),
  ];
  const missingFromList = idsFromMixPage.filter((id) => !byNorm.has(id));

  let mergedFlavors = [...(flavors ?? [])];
  if (missingFromList.length > 0) {
    const numericIds = missingFromList
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && Number.isInteger(n));
    if (numericIds.length > 0) {
      const { data: extraFlavors } = await supabase
        .from("humor_flavors")
        .select("id, name")
        .in("id", numericIds);
      mergedFlavors = [...mergedFlavors, ...(extraFlavors ?? [])];
    }
  }

  const deduped = new Map<string, { id: unknown; name: unknown }>();
  for (const r of mergedFlavors) {
    deduped.set(normalizeSelectId(r.id), r);
  }
  const flavorRowsSorted = Array.from(deduped.values()).sort((a, b) => {
    const na = Number(a.id);
    const nb = Number(b.id);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a.id).localeCompare(String(b.id));
  });

  const validFlavorOptions = flavorRowsSorted.map((r) => ({
    value: String(r.id),
    label: `${r.id}${r.name != null && String(r.name) !== "" ? ` — ${String(r.name)}` : ""}`,
  }));

  const fields: CrudField[] = HUMOR_MIX_FIELDS.map((f) =>
    f.key === "humor_flavor_id"
      ? { ...f, options: validFlavorOptions }
      : f
  );

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/humor-mix?page=${totalPages}`);
  }

  return (
    <GenericCrudClient
      table={adminTables.humor_mix}
      title="Humor Mix"
      description="Humor flavor is fixed for each row (read-only). Update caption count only. Audit columns appear in the raw table preview below. Create and delete are disabled."
      basePath="/admin/humor-mix"
      fields={fields}
      initialRows={(data as Record<string, unknown>[]) ?? []}
      initialTotal={total}
      page={page}
      fetchError={error?.message ?? null}
      canCreate={false}
      canDelete={false}
    />
  );
}
