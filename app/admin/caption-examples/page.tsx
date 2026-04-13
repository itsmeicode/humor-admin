import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CAPTION_EXAMPLES_FIELDS } from "@/lib/admin/crud-config";
import { applyOrderByRecentFirst } from "@/lib/admin/table-order";
import { GenericCrudClient } from "../_components/GenericCrudClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminCaptionExamplesPage({
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
    supabase.from("caption_examples").select("*", { count: "exact" }),
    "caption_examples"
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/caption-examples?page=${totalPages}`);
  }

  return (
    <GenericCrudClient
      table="caption_examples"
      title="Caption Examples"
      description="CRUD for caption_examples."
      basePath="/admin/caption-examples"
      fields={CAPTION_EXAMPLES_FIELDS}
      initialRows={(data as Record<string, unknown>[]) ?? []}
      initialTotal={total}
      page={page}
      fetchError={error?.message ?? null}
    />
  );
}
