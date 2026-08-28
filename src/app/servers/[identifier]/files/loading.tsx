export default function ServerFilesLoading() {
  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10" aria-label="Loading server files">
      <header className="space-y-3">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-amber-100" />
          <div className="h-9 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
        <div className="grid h-12 animate-pulse grid-cols-[minmax(0,1fr)_120px_64px] gap-4 border-b border-gray-100 bg-gray-50 px-6" />
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_120px_64px] items-center gap-4 px-6 py-4">
              <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
              <div className="ml-auto h-9 w-9 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
