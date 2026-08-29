'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { MINECRAFT_VERSIONS } from '@/app/lib/minecraft-versions'
import { compareMinecraftVersions } from '@/app/lib/semver-compare'

export default function MinecraftVersionCard({ identifier, disabled = false }: { identifier: string; disabled?: boolean }) {
  const [currentVersion, setCurrentVersion] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<string>(MINECRAFT_VERSIONS[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingVersion, setPendingVersion] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/version`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.error || 'Unable to read the current Minecraft version.')
        const current = typeof result?.currentVersion === 'string' ? result.currentVersion : ''
        setCurrentVersion(current)
        if (MINECRAFT_VERSIONS.includes(current as typeof MINECRAFT_VERSIONS[number])) setSelectedVersion(current)
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to read the current Minecraft version.' })
      } finally {
        setLoading(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [identifier])

  function saveVersion() {
    if (currentVersion && compareMinecraftVersions(selectedVersion, currentVersion) < 0) setPendingVersion(selectedVersion)
    else void submitVersion(selectedVersion, 'update')
  }

  async function submitVersion(version: string, action: 'update' | 'reinstall') {
    setSaving(true)
    setPendingVersion(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, action }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Unable to update Minecraft version.')
      setCurrentVersion(version)
      setMessage({ type: 'success', text: action === 'reinstall' ? 'Version updated successfully. The server is being reinstalled.' : 'Version updated! Please restart your server.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to update Minecraft version.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Server runtime</p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-950">Minecraft Version</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Choose the version used when your server starts.</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3 text-blue-600 shadow-sm ring-1 ring-blue-100">
              <span className="block text-center text-lg font-black">MC</span>
            </div>
          </div>
          {currentVersion && <div className="mt-5 flex items-center justify-between rounded-2xl border border-blue-100 bg-white/80 px-4 py-3">
            <span className="text-xs font-semibold text-slate-500">Installed version</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-700">{currentVersion}</span>
          </div>}
        </div>
        <div className="flex flex-1 flex-col p-6">
        {loading ? <div className="mt-6 flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading version...</div> : (
          <>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Target version</span>
              <select value={selectedVersion} onChange={(event) => setSelectedVersion(event.target.value)} disabled={saving || disabled} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white">
              {MINECRAFT_VERSIONS.map((version) => <option key={version} value={version}>{version}</option>)}
              </select>
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">Changing versions updates the startup variable. Downgrades require an extra safety confirmation.</p>
            <button type="button" onClick={saveVersion} disabled={saving || selectedVersion === currentVersion || disabled} className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Version'}
            </button>
          </>
        )}
        {message && <p className={`mt-3 text-xs font-semibold ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>}
        </div>
      </section>
      {pendingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-700"><AlertTriangle className="h-6 w-6" /><h2 className="text-xl font-extrabold text-gray-900">World Incompatibility Warning</h2></div>
            <p className="mt-4 text-sm leading-6 text-gray-600">Downgrading from {currentVersion} to {pendingVersion} will cause world corruption if you keep existing files. We recommend reinstalling the server.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingVersion(null)} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => void submitVersion(pendingVersion, 'update')} disabled={saving} className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50">Update Without Reinstalling</button>
              <button type="button" onClick={() => void submitVersion(pendingVersion, 'reinstall')} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">Reinstall Server &amp; Apply</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
