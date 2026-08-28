'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Server, X } from 'lucide-react'

export default function CreateServerPage() {
  const [name, setName] = useState('Minecraft Server')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdServer, setCreatedServer] = useState<{ name?: string; identifier?: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/servers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'The server could not be created.')
        return
      }

      const createdIdentifier = result.server?.identifier
      if (typeof createdIdentifier === 'string' && createdIdentifier) {
        window.location.assign(`/servers/${encodeURIComponent(createdIdentifier)}`)
        return
      }

      setCreatedServer(result.server)
    } catch {
      setError('The server could not be created. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12 text-gray-900 md:px-12">
      <div className="mx-auto max-w-2xl">

        <div className="rounded-3xl border border-gray-200/80 bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-3xl font-extrabold">Create your server</h1>
            <p className="mt-2 text-gray-500">Your server includes 2048 MB RAM, 5 GB storage, and 100% CPU.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-gray-700">Server name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={64}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-3"><strong className="block text-gray-900">2048 MB</strong>RAM</div>
              <div className="rounded-xl bg-gray-50 p-3"><strong className="block text-gray-900">5 GB</strong>Storage</div>
              <div className="rounded-xl bg-gray-50 p-3"><strong className="block text-gray-900">100%</strong>CPU</div>
              <div className="rounded-xl bg-gray-50 p-3"><strong className="block text-gray-900">0</strong>Databases</div>
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="font-minecraft inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-gray-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              {isSubmitting ? 'Creating...' : 'Create Server'}
            </button>
          </form>
        </div>
      </div>

      {createdServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-6" role="dialog" aria-modal="true" aria-labelledby="server-created-title">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <button onClick={() => setCreatedServer(null)} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700" aria-label="Close dialog">
              <X className="h-5 w-5" />
            </button>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 id="server-created-title" className="mt-4 text-2xl font-extrabold text-gray-900">Server created successfully</h2>
            <p className="mt-2 text-sm text-gray-500">{createdServer.name || 'Minecraft Server'} is ready in your dashboard.</p>
            <Link href="/servers" className="font-minecraft mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-bold text-gray-950 hover:bg-amber-500">
              Open Dashboard
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
