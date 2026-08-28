export default function DatapacksLoading() {
  return (
    <main className="flex-1 p-6 md:p-10">
      <section className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm">
        <div className="h-3 w-32 animate-pulse rounded bg-amber-100" />
        <div className="mt-4 h-9 w-44 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
      </section>
    </main>
  )
}