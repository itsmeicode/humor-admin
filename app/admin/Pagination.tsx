import Link from "next/link";

export type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  basePath: string;
};

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  basePath,
}: PaginationProps) {
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));

  const rangeStart =
    totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd =
    totalCount === 0 ? 0 : Math.min(safePage * pageSize, totalCount);

  const prev = safePage > 1 ? `${basePath}?page=${safePage - 1}` : null;
  const next =
    safePage < totalPages ? `${basePath}?page=${safePage + 1}` : null;

  return (
    <nav
      className="mt-8 flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800"
      aria-label="Pagination"
    >
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          Showing {rangeStart}–{rangeEnd}
        </span>{" "}
        of {totalCount}
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
        Page{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {safePage}
        </span>{" "}
        of {totalPages}
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {prev ? (
            <Link
              href={prev}
              scroll
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400 dark:border-zinc-800">
              Previous
            </span>
          )}
          {next ? (
            <Link
              href={next}
              scroll
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-400 dark:border-zinc-800">
              Next
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
