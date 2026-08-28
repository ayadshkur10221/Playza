import { Terminal } from 'lucide-react'

export default function Console() {
  return (
    <section id="console" className="rounded-3xl border border-gray-200/80 bg-gray-950 p-6 text-gray-200 shadow-sm">
      <div className="mb-5 flex items-center gap-2 border-b border-gray-800 pb-4">
        <Terminal className="h-5 w-5 text-amber-400" />
        <h2 className="font-bold text-white">Console</h2>
        <span className="ml-auto text-xs text-gray-500">Offline</span>
      </div>
      <div className="min-h-56 rounded-2xl bg-black/40 p-5 font-mono text-xs text-gray-500">
        Console is unavailable while live streaming is disabled.
      </div>
    </section>
  )
}
