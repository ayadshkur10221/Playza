export default function ServerSettingsLoading() {
  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10" aria-label="Loading server settings">
      <header className="space-y-4 rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <div className="h-3 w-32 animate-pulse rounded bg-amber-100" />
        <div className="h-9 w-64 animate-pulse rounded-xl bg-gray-200" />
      </header>

      <div className="h-12 animate-pulse rounded-2xl border border-gray-200/80 bg-gray-100" />

      <div className="grid items-stretch gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <section className="h-64 animate-pulse rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="h-6 w-36 rounded bg-gray-200" />
          <div className="mt-8 h-4 w-24 rounded bg-gray-100" />
          <div className="mt-2 h-12 w-full rounded-2xl bg-gray-100" />
          <div className="mt-5 h-10 w-24 rounded-xl bg-amber-100" />
        </section>

        <section className="h-64 animate-pulse rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="mt-3 h-10 w-full rounded bg-gray-100" />
          <div className="mt-7 h-4 w-28 rounded bg-gray-100" />
          <div className="mt-2 h-12 w-full rounded-2xl bg-gray-100" />
          <div className="mt-5 h-10 w-32 rounded-xl bg-amber-100" />
        </section>

        <section className="h-64 animate-pulse rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="h-6 w-28 rounded bg-gray-200" />
          <div className="mt-7 h-12 w-full rounded bg-gray-100" />
          <div className="mt-2 h-12 w-5/6 rounded bg-gray-100" />
          <div className="mt-5 h-10 w-36 rounded-xl bg-emerald-100" />
        </section>

        <section className="h-44 animate-pulse rounded-3xl border border-red-100 bg-white p-6 shadow-sm lg:col-span-2 2xl:col-span-3">
          <div className="h-6 w-36 rounded bg-red-100" />
          <div className="mt-4 h-4 w-2/3 rounded bg-gray-100" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
          <div className="mt-5 h-10 w-32 rounded-xl bg-red-100" />
        </section>
      </div>
    </main>
  )
}
