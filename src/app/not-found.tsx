import Link from 'next/link'
import { ArrowLeft, Blocks, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      <section className="relative w-full max-w-xl text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-300/30 bg-amber-400/10 shadow-2xl shadow-amber-500/10">
          <Blocks className="h-12 w-12 text-amber-300" />
        </div>
        <p className="mt-8 font-minecraft text-sm font-bold uppercase tracking-[0.35em] text-amber-300">404 error</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-white md:text-7xl">Page not found</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-400 md:text-base">
          This block does not exist here. It may have been moved, deleted, or never spawned.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <Link href="/servers" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-amber-300/60 hover:text-amber-300">
            <Compass className="h-4 w-4" />
            View servers
          </Link>
        </div>
      </section>
    </main>
  )
}
