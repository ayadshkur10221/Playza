import Link from 'next/link'
import { Home, Blocks, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 px-6 py-16 text-slate-100">
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <section className="relative w-full max-w-xl text-center">
        <p className="mt-8 font-minecraft text-sm font-bold uppercase tracking-[0.35em] text-amber-500">404 error</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-black md:text-7xl">Page not found</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-600 md:text-base">
          This block does not exist here. It may have been moved, deleted, or never spawned.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </div>
      </section>
    </main>
  )
}
