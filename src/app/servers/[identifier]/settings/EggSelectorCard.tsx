'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Cpu, Loader2 } from 'lucide-react'

type SoftwareOption = { id: number; name: string; description: string }
type SoftwareData = { currentSoftwareId: number | null; software: SoftwareOption[] }

export default function EggSelectorCard({ identifier, disabled = false }: { identifier: string; disabled?: boolean }) {
  const [data, setData] = useState<SoftwareData | null>(null)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadSoftware = useCallback(async () => {
    try {
      const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/eggs`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Unable to load server software.')
      const software = Array.isArray(result?.software) ? result.software : []
      const currentSoftwareId = typeof result?.currentSoftwareId === 'number' ? result.currentSoftwareId : null
      setData({ currentSoftwareId, software })
      setSelected(String(currentSoftwareId || software[0]?.id || ''))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load server software.')
    } finally {
      setLoading(false)
    }
  }, [identifier])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSoftware(), 0)
    return () => window.clearTimeout(timer)
  }, [loadSoftware])

  async function updateSoftware() {
    setSaving(true)
    setConfirming(false)
    setMessage(null)
    try {
      const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/egg`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ softwareId: Number(selected), reinstall: true }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Unable to update server software.')
      setData((current) => current ? { ...current, currentSoftwareId: Number(selected) } : current)
      setMessage('Software updated successfully. The server is being reinstalled.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update server software.')
    } finally {
      setSaving(false)
    }
  }

  const selectedSoftware = data?.software.find((software) => String(software.id) === selected)

  return (
    <>
      <section className="flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Server Software</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-600">Change the server software environment. Startup scripts, Docker images, and variables will be updated.</p>
        {loading ? <div className="mt-6 flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading software...</div> : (
          <>
            <select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={saving || !data?.software.length || disabled} className="mt-5 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-amber-300 focus:bg-white">
              {!data?.software.length ? <option value="">No software available</option> : data.software.map((software) => <option key={software.id} value={software.id}>{software.name}</option>)}
            </select>
            {selectedSoftware?.description && <p className="mt-3 text-xs leading-5 text-gray-500">{selectedSoftware.description}</p>}
            <button type="button" onClick={() => setConfirming(true)} disabled={saving || !selected || String(data?.currentSoftwareId || '') === selected || disabled} className="mt-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Updating...' : 'Change software'}</button>
          </>
        )}
        {message && <p className="mt-3 text-xs font-semibold text-red-600">{message}</p>}
      </section>
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-xl font-extrabold text-gray-900">Change Server Software?</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Switching software changes startup scripts, Docker images, and default variables. This will force a server reinstall, and your server will be unavailable while it runs.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
              <button type="button" onClick={() => void updateSoftware()} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">Change software and reinstall</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
