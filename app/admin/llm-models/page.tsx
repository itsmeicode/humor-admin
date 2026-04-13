import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CrudField } from "@/lib/admin/crud-config";
import { LLM_MODELS_FIELDS } from "@/lib/admin/crud-config";
import { applyOrderByRecentFirst } from "@/lib/admin/table-order";
import { GenericCrudClient } from "../_components/GenericCrudClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminLlmModelsPage({
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
    supabase.from("llm_models").select("*", { count: "exact" }),
    "llm_models"
  ).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: providers, error: providersError } = await supabase
    .from("llm_providers")
    .select("id, name")
    .order("id", { ascending: true })
    .limit(10_000);

  const providerOptions = (providers ?? []).map((r) => ({
    value: String(r.id),
    label: `${r.id}${r.name != null && String(r.name) !== "" ? ` — ${String(r.name)}` : ""}`,
  }));

  const fields: CrudField[] = LLM_MODELS_FIELDS.map((f) => {
    if (f.key !== "llm_provider_id") return f;
    if (providersError || providerOptions.length === 0) return f;
    return {
      ...f,
      type: "select" as const,
      required: true,
      options: providerOptions,
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/llm-models?page=${totalPages}`);
  }

  return (
    <GenericCrudClient
      table="llm_models"
      title="LLM Models"
      description="Model display name, provider API id (provider_model_id), provider, and temperature flag. Timestamps and user ids are read-only."
      basePath="/admin/llm-models"
      fields={fields}
      initialRows={(data as Record<string, unknown>[]) ?? []}
      initialTotal={total}
      page={page}
      fetchError={error?.message ?? null}
    />
  );
}
