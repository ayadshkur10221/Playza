'use client'

import { useEffect, useState } from 'react'
import { Loader2, Play, RotateCcw, Square } from 'lucide-react'

type ServerControlsProps = {
  identifier: string
  initialStatus?: string | null
}

export default function ServerControls({ identifier, initialStatus }: ServerControlsProps) {
  const [status, setStatus] = useState(initialStatus || 'offline')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [eulaAccepted, setEulaAccepted] = useState(false)
  const [showEula, setShowEula] = useState(false)

  useEffect(() => {
    let active = true
    async function refreshStatus() {
      try {
        const response = await fetch(`/api/servers/${identifier}/status`, { cache: 'no-store' })
        const result = await response.json()
        if (active && response.ok && result.status) setStatus(result.status)
      } catch {
        // Keep the last known status when polling fails.
      }
    }
    const interval = setInterval(refreshStatus, 4000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [identifier])

  useEffect(() => {
    fetch(`/api/servers/${identifier}/eula`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        if (typeof result.accepted === 'boolean') setEulaAccepted(result.accepted)
      })
      .catch(() => undefined)
  }, [identifier])

  async function sendAction(signal: 'start' | 'stop' | 'restart', bypassEula = false) {
    if (signal === 'start' && !eulaAccepted && !bypassEula) {
      setShowEula(true)
      return
    }

    setLoading(signal)
    setError(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'The action failed.')
        return
      }

      setStatus(signal === 'stop' ? 'stopping' : signal === 'restart' ? 'restarting' : 'starting')
    } catch {
      setError('The panel could not be reached.')
    } finally {
      setLoading(null)
    }
  }

  async function acceptEulaAndStart() {
    setLoading('eula')
    setError(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/eula`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The EULA could not be accepted.')
      setEulaAccepted(true)
      setShowEula(false)
      await sendAction('start', true)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The EULA could not be accepted.')
    } finally {
      setLoading(null)
    }
  }

  const isRunning = ['running', 'starting', 'restarting'].includes(status)
  const isStopped = ['offline', 'stopping', 'crashed'].includes(status)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-600">
          {status}
        </span>
        <button onClick={() => sendAction('start')} disabled={loading !== null || isRunning} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
          {loading === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start
        </button>
        <button onClick={() => sendAction('stop')} disabled={loading !== null || isStopped} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
          {loading === 'stop' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
          Stop
        </button>
        <button onClick={() => sendAction('restart')} disabled={loading !== null || isStopped} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-gray-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50">
          {loading === 'restart' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Restart
        </button>
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {showEula && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-md">
          <section role="dialog" aria-modal="true" className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-extrabold text-gray-900">Minecraft EULA</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              By pressing &quot;I Accept&quot; below you are indicating your agreement to the{' '}
              <a className="font-semibold text-amber-700 underline" href="https://www.minecraft.net/eula" target="_blank" rel="noreferrer">
                Minecraft® EULA
              </a>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowEula(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">
                Cancel
              </button>
              <button type="button" onClick={() => void acceptEulaAndStart()} disabled={loading !== null} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-gray-950 disabled:opacity-60">
                {loading === 'eula' ? 'Accepting...' : 'I Accept'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
