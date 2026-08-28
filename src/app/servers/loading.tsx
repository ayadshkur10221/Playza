export default function ServersLoading() {
  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
      <div className="flex items-end justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-amber-100" />
          <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-200" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-amber-100" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-24 animate-pulse rounded-xl bg-amber-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
