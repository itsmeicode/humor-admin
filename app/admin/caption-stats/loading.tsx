export default function Loading() {
  return (
    <div className="p-6 md:p-10">
      <header className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Caption Stats
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Crunching numbers across 100k+ captions and votes — this can take a
          few seconds the first time. Hang tight.
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </section>

      <section className="mb-10 h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
      <section className="mb-10 h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
      <section className="mb-10 h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
      <section className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
    </div>
  );
}
