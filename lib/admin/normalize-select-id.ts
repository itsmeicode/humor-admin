/**
 * Canonical string for FK / bigint id fields so row values from Supabase (number,
 * bigint, "37", "37.0") match option values built with String(id).
 */
export function normalizeSelectId(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "bigint") return v.toString();
  const s = String(v).trim();
  if (s === "") return "";
  const n = Number(s);
  if (Number.isFinite(n)) {
    const t = Math.trunc(n);
    if (t === n) return String(t);
  }
  return s;
}
