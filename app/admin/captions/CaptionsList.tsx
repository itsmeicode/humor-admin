"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pagination } from "../Pagination";

type CaptionRow = {
  id: unknown;
  content: unknown;
  image_id: unknown;
  is_public: unknown;
  created_datetime_utc: unknown;
  modified_datetime_utc: unknown;
};

const PAGE_SIZE = 15;

export function CaptionsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const rawPage = parseInt(pageParam ?? "1", 10);
  const page =
    Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [rows, setRows] = useState<CaptionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error: qErr, count } = await supabase
      .from("captions")
      .select(
        "id, content, image_id, is_public, created_datetime_utc, modified_datetime_utc",
        { count: "exact" }
      )
      .order("created_datetime_utc", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (qErr) {
      setError(qErr.message);
      setRows([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (page > totalPages && total > 0) {
      router.replace(`/admin/captions?page=${totalPages}`);
      return;
    }

    setRows((data as CaptionRow[]) ?? []);
    setTotalCount(total);
    setLoading(false);
  }, [page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Captions
        </h1>
        <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Read-only directory of captions (newest first by{" "}
            <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
              created_datetime_utc
            </code>
            , {PAGE_SIZE} per page).
          </p>
          <p>
            Use{" "}
            <Link
              href="/admin/captions"
              scroll
              className="font-medium text-zinc-800 underline dark:text-zinc-200"
            >
              first page
            </Link>{" "}
            or the controls at the bottom to change pages.
          </p>
        </div>
      </header>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading captions…</p>
      ) : (
        <>
          <div className="space-y-4">
            {rows.map((c) => (
              <article
                key={String(c.id)}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                  {String(c.content ?? "")}
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                      id{" "}
                    </dt>
                    <dd className="inline font-mono">{String(c.id)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                      image_id{" "}
                    </dt>
                    <dd className="inline font-mono">{String(c.image_id)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                      public{" "}
                    </dt>
                    <dd className="inline">{c.is_public ? "yes" : "no"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                      created{" "}
                    </dt>
                    <dd className="inline">
                      {c.created_datetime_utc
                        ? String(c.created_datetime_utc)
                            .slice(0, 19)
                            .replace("T", " ")
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                      modified{" "}
                    </dt>
                    <dd className="inline">
                      {c.modified_datetime_utc
                        ? String(c.modified_datetime_utc)
                            .slice(0, 19)
                            .replace("T", " ")
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
            {rows.length === 0 && !error && (
              <p className="text-sm text-zinc-500">No captions on this page.</p>
            )}
          </div>

          {!error && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              basePath="/admin/captions"
            />
          )}
        </>
      )}
    </div>
  );
}
