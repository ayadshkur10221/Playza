export default function ServerSettingsLoading() {
  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10" aria-label="Loading server settings">
      <header className="space-y-3 rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <div className="h-3 w-32 animate-pulse rounded bg-amber-100" />
        <div className="h-9 w-64 animate-pulse rounded bg-gray-200" />
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <section key={index} className={`rounded-3xl border ${index === 2 ? 'border-red-100' : 'border-gray-200/80'} bg-white p-6 shadow-sm ${index === 2 ? 'xl:col-span-2' : ''}`}>
            <div className="mb-5 h-6 w-40 animate-pulse rounded bg-gray-200" />
            {index < 2 && <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-100" />}
            {index < 2 && <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-100" />}
            {index === 1 && <div className="mb-5 mt-4 h-12 w-64 animate-pulse rounded bg-gray-100" />}
            <div className={`mt-5 h-10 w-24 animate-pulse rounded-xl ${index === 2 ? 'bg-red-100' : 'bg-amber-100'}`} />
          </section>
        ))}
      </div>
    </main>
  )
}
