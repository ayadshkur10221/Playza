export default function ServerManagementLoading() {
  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10" aria-label="Loading server management">
      <section className="space-y-5 rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <div className="h-3 w-32 animate-pulse rounded bg-amber-100" />
        <div className="h-9 w-72 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
        <div className="flex gap-3 pt-2">
          <div className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-10 w-24 animate-pulse rounded-xl bg-emerald-100" />
          <div className="h-10 w-24 animate-pulse rounded-xl bg-red-100" />
          <div className="h-10 w-24 animate-pulse rounded-xl bg-amber-100" />
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200/80 bg-gray-950 p-6 shadow-sm">
        <div className="mb-5 h-5 w-28 animate-pulse rounded bg-gray-800" />
        <div className="min-h-56 space-y-3 rounded-2xl bg-black/40 p-5">
          <div className="h-3 w-3/4 animate-pulse rounded bg-gray-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-800" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-800" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-800" />
        </div>
      </section>
    </main>
  )
}