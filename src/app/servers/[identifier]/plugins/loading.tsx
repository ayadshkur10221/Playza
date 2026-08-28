export default function ServerPluginsLoading() {
  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10" aria-label="Loading plugins">
      <header className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <div className="h-3 w-28 animate-pulse rounded bg-amber-100" />
        <div className="mt-4 h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
      </header>

      <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-12 flex-1 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-12 w-24 animate-pulse rounded-2xl bg-amber-100" />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="min-h-44 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
