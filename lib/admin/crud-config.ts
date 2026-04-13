export type CrudFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select";

export type CrudField = {
  key: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  /** When true, value is shown from the row only and is not sent on create/update. */
  readonly?: boolean;
  /** Postgres column name when it differs from `key` (form state still uses `key`). */
  column?: string;
  /** Required when `type` is `select`. For readonly text, optional `options` resolve display labels (e.g. FK id → name). */
  options?: { value: string; label: string }[];
};

export const TERMS_FIELDS: CrudField[] = [
  { key: "term", label: "Term", type: "text", required: true },
  { key: "definition", label: "Definition", type: "textarea", required: true },
  { key: "example", label: "Example", type: "textarea", required: true },
  { key: "priority", label: "Priority", type: "number", required: true },
  /** Overridden on the Terms page to `select` when `term_types` is readable. */
  { key: "term_type_id", label: "Term type", type: "number", required: true },
  { key: "created_datetime_utc", label: "Created (UTC)", type: "text", readonly: true },
  { key: "modified_datetime_utc", label: "Modified (UTC)", type: "text", readonly: true },
  { key: "created_by_user_id", label: "Created by (user id)", type: "text", readonly: true },
  { key: "modified_by_user_id", label: "Modified by (user id)", type: "text", readonly: true },
];

export const CAPTION_EXAMPLES_FIELDS: CrudField[] = [
  {
    key: "image_description",
    label: "Image description",
    type: "textarea",
    required: true,
  },
  { key: "caption", label: "Caption", type: "textarea", required: true },
  { key: "explanation", label: "Explanation", type: "textarea", required: true },
  { key: "priority", label: "Priority", type: "number", required: true },
  { key: "image_id", label: "Image ID (UUID)", type: "text" },
];

export const LLM_MODELS_FIELDS: CrudField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "provider_model_id", label: "Provider model ID", type: "text", required: true },
  /** Overridden on the LLM Models page to `select` when `llm_providers` is readable. */
  { key: "llm_provider_id", label: "LLM provider", type: "number", required: true },
  { key: "is_temperature_supported", label: "Temperature supported", type: "checkbox" },
  { key: "created_datetime_utc", label: "Created (UTC)", type: "text", readonly: true },
  { key: "modified_datetime_utc", label: "Modified (UTC)", type: "text", readonly: true },
  { key: "created_by_user_id", label: "Created by (user id)", type: "text", readonly: true },
  { key: "modified_by_user_id", label: "Modified by (user id)", type: "text", readonly: true },
];

export const LLM_PROVIDERS_FIELDS: CrudField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "created_datetime_utc", label: "Created (UTC)", type: "text", readonly: true },
  { key: "modified_datetime_utc", label: "Modified (UTC)", type: "text", readonly: true },
  { key: "created_by_user_id", label: "Created by (user id)", type: "text", readonly: true },
  { key: "modified_by_user_id", label: "Modified by (user id)", type: "text", readonly: true },
];

export const SIGNUP_DOMAINS_FIELDS: CrudField[] = [
  { key: "apex_domain", label: "Apex domain", type: "text", required: true },
];

export const WHITELIST_EMAILS_FIELDS: CrudField[] = [
  {
    key: "email",
    column: "email_address",
    label: "Email",
    type: "text",
    required: true,
  },
];

/**
 * humor_flavor_mix — humor_flavor_id is readonly on the Humor Mix page; only caption_count is edited.
 */
export const HUMOR_MIX_FIELDS: CrudField[] = [
  {
    key: "humor_flavor_id",
    label: "Humor flavor",
    type: "text",
    readonly: true,
  },
  { key: "caption_count", label: "Caption count", type: "number", required: true },
];
