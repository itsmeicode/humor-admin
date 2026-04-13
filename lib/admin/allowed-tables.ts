import { adminTables } from "./table-names";

/** Fixed read-only tables; LLM responses name follows `adminTables.llm_responses`. */
export const READ_ONLY_TABLES = [
  "humor_flavors",
  "humor_flavor_steps",
  "caption_requests",
  "llm_prompt_chains",
  adminTables.llm_responses,
] as const;

export type ReadOnlyTable = (typeof READ_ONLY_TABLES)[number];

export function isReadOnlyTable(name: string): name is ReadOnlyTable {
  return (READ_ONLY_TABLES as readonly string[]).includes(name);
}
