import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const TOP_N = 10;
const HARD_CAP = 200_000;
const CONCURRENCY = 50;

async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  totalCount: number
): Promise<{ rows: T[]; error: string | null; truncated: boolean }> {
  const cap = Math.min(totalCount, HARD_CAP);
  const totalPages = Math.ceil(cap / PAGE_SIZE);
  const all: T[] = [];

  for (
    let batchStart = 0;
    batchStart < totalPages;
    batchStart += CONCURRENCY
  ) {
    const batchEnd = Math.min(batchStart + CONCURRENCY, totalPages);
    const promises: Promise<{ data: unknown; error: { message: string } | null }>[] = [];
    for (let i = batchStart; i < batchEnd; i++) {
      const from = i * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      promises.push(
        supabase.from(table).select(columns).range(from, to) as unknown as Promise<{
          data: unknown;
          error: { message: string } | null;
        }>
      );
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r.error) {
        return { rows: all, error: r.error.message, truncated: false };
      }
      if (Array.isArray(r.data)) {
        all.push(...(r.data as T[]));
      }
    }
  }

  return {
    rows: all,
    error: null,
    truncated: totalCount > HARD_CAP,
  };
}

type CaptionRow = {
  id: number | string;
  content: string | null;
  image_id: string | null;
  humor_flavor_id: number | null;
  like_count: number | null;
};

type VoteRow = {
  caption_id: number | string;
  vote_value: number | null;
};

type FlavorRow = {
  id: number | string;
  slug: string | null;
};

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const FLAVOR_PAGE_SIZE = 25;

export default async function CaptionStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ fp?: string }>;
}) {
  const sp = await searchParams;
  const fpRaw = parseInt(sp.fp ?? "1", 10);
  const flavorPage = Number.isFinite(fpRaw) && fpRaw >= 1 ? fpRaw : 1;
  const supabase = await createClient();

  const [captionsCountRes, votesCountRes, flavorsCountRes] = await Promise.all([
    supabase.from("captions").select("*", { count: "exact", head: true }),
    supabase
      .from("caption_votes")
      .select("*", { count: "exact", head: true }),
    supabase.from("humor_flavors").select("*", { count: "exact", head: true }),
  ]);

  const captionsTotal = captionsCountRes.count ?? 0;
  const votesTotal = votesCountRes.count ?? 0;
  const flavorsTotal = flavorsCountRes.count ?? 0;

  const [captionsRes, votesRes, flavorsRes] = await Promise.all([
    fetchAllRows<CaptionRow>(
      supabase,
      "captions",
      "id, content, image_id, humor_flavor_id, like_count",
      captionsTotal
    ),
    fetchAllRows<VoteRow>(
      supabase,
      "caption_votes",
      "caption_id, vote_value",
      votesTotal
    ),
    fetchAllRows<FlavorRow>(
      supabase,
      "humor_flavors",
      "id, slug",
      flavorsTotal
    ),
  ]);

  const captions = captionsRes.rows;
  const votes = votesRes.rows;
  const flavors = flavorsRes.rows;

  const errorMessages = [
    captionsCountRes.error?.message,
    votesCountRes.error?.message,
    flavorsCountRes.error?.message,
    captionsRes.error,
    votesRes.error,
    flavorsRes.error,
  ].filter((m): m is string => Boolean(m));

  const truncated =
    captionsRes.truncated || votesRes.truncated || flavorsRes.truncated;

  const flavorById = new Map<string, FlavorRow>(
    flavors.map((f) => [String(f.id), f])
  );

  const voteCountByCaption = new Map<string, { up: number; down: number }>();
  for (const v of votes) {
    const key = String(v.caption_id);
    const cur = voteCountByCaption.get(key) ?? { up: 0, down: 0 };
    if ((v.vote_value ?? 0) > 0) cur.up += 1;
    else if ((v.vote_value ?? 0) < 0) cur.down += 1;
    voteCountByCaption.set(key, cur);
  }

  const captionsWithVotes = voteCountByCaption.size;
  const captionsWithZeroVotes = captions.filter(
    (c) => !voteCountByCaption.has(String(c.id))
  );

  const upvotes = Array.from(voteCountByCaption.values()).reduce(
    (a, v) => a + v.up,
    0
  );
  const downvotes = Array.from(voteCountByCaption.values()).reduce(
    (a, v) => a + v.down,
    0
  );

  const topByLikeCount = [...captions]
    .filter((c) => (c.like_count ?? 0) > 0)
    .sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0))
    .slice(0, TOP_N);

  const topByVoteCount = [...captions]
    .map((c) => {
      const counts = voteCountByCaption.get(String(c.id)) ?? {
        up: 0,
        down: 0,
      };
      return { caption: c, ...counts, total: counts.up + counts.down };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_N);

  type FlavorAgg = {
    flavorId: string;
    slug: string;
    captionCount: number;
    voteCount: number;
  };
  const perFlavor = new Map<string, FlavorAgg>();
  for (const c of captions) {
    if (c.humor_flavor_id == null) continue;
    const key = String(c.humor_flavor_id);
    const slug = flavorById.get(key)?.slug ?? `flavor ${key}`;
    const agg = perFlavor.get(key) ?? {
      flavorId: key,
      slug,
      captionCount: 0,
      voteCount: 0,
    };
    agg.captionCount += 1;
    const counts = voteCountByCaption.get(String(c.id));
    if (counts) agg.voteCount += counts.up + counts.down;
    perFlavor.set(key, agg);
  }
  const perFlavorList = Array.from(perFlavor.values()).sort(
    (a, b) => b.voteCount - a.voteCount
  );

  return (
    <div className="p-6 md:p-10">
      <header className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Caption Stats
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          What users are rating: which captions get the most engagement, which
          ones nobody has voted on yet, and how each humor flavor is doing
          overall. Aggregations cover all rows in <code>captions</code>,{" "}
          <code>caption_votes</code>, and <code>humor_flavors</code> (paginated
          in chunks of {PAGE_SIZE.toLocaleString()}).
        </p>
        {truncated && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Hit the hard cap of {HARD_CAP.toLocaleString()} rows for at least
            one table. Numbers below may be partial.
          </p>
        )}
        {errorMessages.length > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Some queries returned errors. First message:{" "}
            <code>{errorMessages[0]}</code>
          </p>
        )}
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total captions",
            value: captionsTotal,
            accent: "from-emerald-500/20",
          },
          {
            label: "Captions with ≥1 vote",
            value: captionsWithVotes,
            accent: "from-cyan-500/20",
          },
          {
            label: "Captions with 0 votes",
            value: captionsWithZeroVotes.length,
            accent: "from-rose-500/20",
          },
          {
            label: "Total votes cast",
            value: votesTotal,
            accent: "from-violet-500/20",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} to-transparent opacity-90`}
              aria-hidden
            />
            <p className="relative text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {card.label}
            </p>
            <p className="relative mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Top {TOP_N} captions by <code>like_count</code>
          </h2>
          <span className="text-xs text-zinc-500">
            {upvotes.toLocaleString()} upvotes ·{" "}
            {downvotes.toLocaleString()} downvotes (across loaded rows)
          </span>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          The cached score on the <code>captions</code> row.
        </p>
        <Table
          headers={["#", "Caption", "Flavor", "Likes"]}
          rows={topByLikeCount.map((c, i) => [
            String(i + 1),
            truncate(c.content, 140),
            flavorById.get(String(c.humor_flavor_id))?.slug ?? "—",
            String(c.like_count ?? 0),
          ])}
          empty="No captions with likes yet."
        />
      </section>

      <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Top {TOP_N} most-voted captions
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Counted from the <code>caption_votes</code> table. Includes both
          upvotes and downvotes — engagement, not preference.
        </p>
        <Table
          headers={["#", "Caption", "Flavor", "▲", "▼", "Total"]}
          rows={topByVoteCount.map((row, i) => [
            String(i + 1),
            truncate(row.caption.content, 140),
            flavorById.get(String(row.caption.humor_flavor_id))?.slug ?? "—",
            String(row.up),
            String(row.down),
            String(row.total),
          ])}
          empty="No captions have been voted on yet."
        />
      </section>

      <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Captions with zero votes
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          {captionsWithZeroVotes.length.toLocaleString()} total. Showing the
          first {Math.min(TOP_N, captionsWithZeroVotes.length)}.
        </p>
        <Table
          headers={["#", "Caption", "Flavor"]}
          rows={captionsWithZeroVotes.slice(0, TOP_N).map((c, i) => [
            String(i + 1),
            truncate(c.content, 140) || (
              <span className="italic text-zinc-500">(empty caption)</span>
            ),
            flavorById.get(String(c.humor_flavor_id))?.slug ?? "—",
          ])}
          empty="Every caption has at least one vote."
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Per-flavor breakdown
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Captions and votes grouped by humor flavor. Sorted by votes (desc).{" "}
          {perFlavorList.length} total flavors.
        </p>
        {(() => {
          const totalFlavorPages = Math.max(
            1,
            Math.ceil(perFlavorList.length / FLAVOR_PAGE_SIZE)
          );
          const safePage = Math.min(flavorPage, totalFlavorPages);
          const fromIdx = (safePage - 1) * FLAVOR_PAGE_SIZE;
          const toIdx = fromIdx + FLAVOR_PAGE_SIZE;
          const pageRows = perFlavorList.slice(fromIdx, toIdx);
          return (
            <>
              <Table
                headers={["Flavor", "Captions", "Votes", "Avg votes / caption"]}
                rows={pageRows.map((f) => [
                  f.slug,
                  String(f.captionCount),
                  String(f.voteCount),
                  f.captionCount > 0
                    ? (f.voteCount / f.captionCount).toFixed(2)
                    : "—",
                ])}
                empty="No flavor data."
              />
              {totalFlavorPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    Page {safePage} of {totalFlavorPages} ·{" "}
                    {perFlavorList.length} flavors
                  </span>
                  <div className="flex gap-2">
                    {safePage > 1 ? (
                      <Link
                        href={`/admin/caption-stats?fp=${safePage - 1}#per-flavor`}
                        className="rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        ← Prev
                      </Link>
                    ) : (
                      <span className="rounded-md border border-zinc-200 px-2 py-1 opacity-40 dark:border-zinc-800">
                        ← Prev
                      </span>
                    )}
                    {safePage < totalFlavorPages ? (
                      <Link
                        href={`/admin/caption-stats?fp=${safePage + 1}#per-flavor`}
                        className="rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Next →
                      </Link>
                    ) : (
                      <span className="rounded-md border border-zinc-200 px-2 py-1 opacity-40 dark:border-zinc-800">
                        Next →
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </section>

      <p className="mt-10 text-xs text-zinc-500">
        Want to drill into individual rows?{" "}
        <Link
          href="/admin/captions"
          className="font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          Browse all captions →
        </Link>
      </p>
    </div>
  );
}

function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 align-top text-zinc-800 dark:text-zinc-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
