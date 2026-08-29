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
      <section className="flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Minecraft Version</h2>
            {currentVersion && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Installed: {currentVersion}</span>}
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-600">Choose the version used when your server starts. Downgrades may require a reinstall to avoid world issues.</p>

        {loading ? (
          <div className="mt-6 flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading version...</div>
        ) : (
          <>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Target version</span>
              <select
                value={selectedVersion}
                onChange={(event) => setSelectedVersion(event.target.value)}
                disabled={saving || disabled}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none pb-4 transition focus:border-amber-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {MINECRAFT_VERSIONS.map((version) => <option key={version} value={version}>{version}</option>)}
              </select>
            </label>

            <button
              type="button"
              onClick={saveVersion}
              disabled={saving || selectedVersion === currentVersion || disabled}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Version'}
            </button>
          </>
        )}

        {message && <p className={`mt-3 text-xs font-semibold ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>}
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
