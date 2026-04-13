import { adminTables } from "./table-names";

/**
 * Tables that use `created_datetime_utc` (newest first), then `id` DESC.
 * Matches captions/users/images. Other admin tables fall back to `id` DESC only.
 */
const TABLES_WITH_CREATED_UTC = new Set<string>([
  "terms",
  "caption_examples",
  "llm_models",
  "llm_providers",
  "allowed_signup_domains",
  adminTables.whitelisted_email_addresses,
  adminTables.humor_mix,
  "humor_flavors",
  "humor_flavor_steps",
  "caption_requests",
  "llm_prompt_chains",
  adminTables.llm_responses,
]);

type OrderableQuery = {
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ) => OrderableQuery;
};

/**
 * Apply sort: newest `created_datetime_utc` first when the table has that column,
 * otherwise `id` descending.
 */
export function applyOrderByRecentFirst<Q extends OrderableQuery>(
  query: Q,
  table: string
): Q {
  if (TABLES_WITH_CREATED_UTC.has(table)) {
    return query
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false }) as Q;
  }
  return query.order("id", { ascending: false }) as Q;
}
