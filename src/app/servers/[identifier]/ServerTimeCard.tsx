'use client'

import { Clock3, Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export default function ServerTimeCard({ identifier }: { identifier: string }) {
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(0)

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/servers/${identifier}/time`, { cache: 'no-store' })
    const result = await response.json()
    if (response.ok) setExpiresAt(typeof result.expiresAt === 'number' ? result.expiresAt : null)
  }, [identifier])

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0)
    const interval = window.setInterval(() => void refresh(), 30000)
    const ticker = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      window.clearTimeout(initialRefresh)
      window.clearInterval(interval)
      window.clearInterval(ticker)
    }
  }, [refresh])

  async function addTime() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/time`, { method: 'POST' })
      const result = await response.json()
      if (response.ok) setExpiresAt(result.expiresAt)
      else setError(result.error || 'Unable to add server time.')
    } finally {
      setLoading(false)
    }
  }

  const remaining = expiresAt && now > 0 ? Math.max(0, expiresAt - now) : 0
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-2 text-amber-700"><Clock3 className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-widest">Server time</span></div>
      <p className="mt-3 text-2xl font-extrabold text-gray-900">{expiresAt && remaining > 0 ? `${hours}h ${minutes}m` : 'No time remaining'}</p>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <button type="button" onClick={() => void addTime()} disabled={loading || Boolean(expiresAt && remaining > 3600000)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-gray-950 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add 8 hours
      </button>
    </section>
  )
}
