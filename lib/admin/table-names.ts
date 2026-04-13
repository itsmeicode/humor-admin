/**
 * Physical Supabase/PostgREST table names. Override via NEXT_PUBLIC_* only if
 * your project differs (fixes "Could not find the table … in the schema cache").
 *
 * Defaults match the staging schema: humor_flavor_mix, llm_model_responses,
 * whitelist_email_addresses.
 */
function envTable(envKey: string, fallback: string): string {
  const v = process.env[envKey];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : fallback;
}

export const adminTables = {
  humor_mix: envTable("NEXT_PUBLIC_SUPABASE_TABLE_HUMOR_MIX", "humor_flavor_mix"),
  llm_responses: envTable(
    "NEXT_PUBLIC_SUPABASE_TABLE_LLM_RESPONSES",
    "llm_model_responses"
  ),
  whitelisted_email_addresses: envTable(
    "NEXT_PUBLIC_SUPABASE_TABLE_WHITELISTED_EMAILS",
    "whitelist_email_addresses"
  ),
} as const;
