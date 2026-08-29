export default function ServerManagementLoading() {
  return (
    <main className="flex-1 p-6 md:p-10" aria-label="Loading server management">
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-amber-100" />
        <div className="h-9 w-56 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </main>
  )
}