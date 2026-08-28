'use client'

export default function DatapacksClient({ identifier }: { identifier: string }) {
  return (
    <main className="flex-1 p-6 md:p-10">
      <section className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm">
        <p className="font-minecraft text-xs font-bold uppercase tracking-widest text-amber-600">Server datapacks</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Datapacks</h1>
        <p className="mt-2 text-sm text-gray-500">Datapack management is unavailable for server {identifier}.</p>
      </section>
    </main>
  )
}