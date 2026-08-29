'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DockerImageCard from './DockerImageCard'
import EggSelectorCard from './EggSelectorCard'
import MinecraftVersionCard from './MinecraftVersionCard'

type ServerSettingsClientProps = {
  identifier: string
  initialName: string
  initialDockerImage: string
  initialDockerImages: string[]
}

export default function ServerSettingsClient({
  identifier,
  initialName,
  initialDockerImage,
  initialDockerImages,
}: ServerSettingsClientProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState<'details' | 'reinstall' | 'delete' | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [serverStatus, setServerStatus] = useState('offline')
  const isSuspended = serverStatus === 'suspended'

  useEffect(() => {
    let active = true
    async function refreshStatus() {
      try {
        const response = await fetch(`/api/servers/${identifier}/status`, { cache: 'no-store' })
        const result = await response.json()
        if (active && response.ok && typeof result?.status === 'string') {
          setServerStatus(result.status)
        }
      } catch {
        // Keep the last known status if the polling request fails.
      }
    }

    void refreshStatus()
    const interval = window.setInterval(refreshStatus, 4000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [identifier])

  const saveDetails = async () => {
    if (isSuspended) {
      setStatus({ type: 'info', message: 'This server is suspended, so its settings are locked.' })
      return
    }
    setSaving('details')
    setStatus(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'details', name }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to rename the server.')
      }

      setStatus({ type: 'success', message: 'Server name updated successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to rename the server.' })
    } finally {
      setSaving(null)
    }
  }

  const reinstallServer = async () => {
    if (isSuspended) {
      setStatus({ type: 'info', message: 'This server is suspended, so reinstall actions are disabled.' })
      return
    }

    setSaving('reinstall')
    setStatus(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reinstall' }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to reinstall the server.')
      }

      setStatus({ type: 'success', message: 'Server reinstall has been queued.' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to reinstall the server.' })
    } finally {
      setSaving(null)
    }
  }

  const deleteServer = async () => {
    if (isSuspended) {
      setStatus({ type: 'info', message: 'This server is suspended, so it cannot be deleted right now.' })
      return
    }

    if (!window.confirm('Delete this server permanently? This will also delete it from Pterodactyl.')) return

    setSaving('delete')
    setStatus(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/settings`, { method: 'DELETE' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Unable to delete the server.')
      router.replace('/servers')
      router.refresh()
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to delete the server.' })
      setSaving(null)
    }
  }

  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
      <header className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <p className="font-minecraft text-xs font-bold uppercase tracking-[0.24em] text-amber-600">Server settings</p>
        <h1 className="mt-3 text-3xl font-extrabold text-gray-900">{name}</h1>
      </header>

      {status && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {status.message}
        </div>
      )}

      {isSuspended && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This server is suspended, so all settings are temporarily disabled.
        </div>
      )}

      <div className="grid items-stretch gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <section className="flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Server Name</h2>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Server Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-amber-300 focus:bg-white"
              placeholder="Minecraft Server"
            />
          </label>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => void saveDetails()}
              disabled={saving !== null || isSuspended}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === 'details' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </section>

        <DockerImageCard
          identifier={identifier}
          initialImage={initialDockerImage}
          initialImages={initialDockerImages}
          disabled={isSuspended}
        />

        <EggSelectorCard identifier={identifier} disabled={isSuspended} />

        <MinecraftVersionCard identifier={identifier} disabled={isSuspended} />

        <section className="flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Reinstall</h2>

          <p className="mb-5 text-sm leading-6 text-gray-600">
            Reinstalling your server will stop it, and then re-run the installation script that initially set it up.
          </p>

          <button
            type="button"
            onClick={() => void reinstallServer()}
            disabled={saving !== null || isSuspended}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === 'reinstall' ? 'Reinstalling...' : 'Reinstall server'}
          </button>
        </section>

        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm lg:col-span-2 2xl:col-span-3">
          <h2 className="mb-3 text-xl font-bold text-red-700">Delete server</h2>
          <p className="mb-5 text-sm leading-6 text-gray-600">
            Permanently delete this server, This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => void deleteServer()}
            disabled={saving !== null || isSuspended}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === 'delete' ? 'Deleting...' : 'Delete server'}
          </button>
        </section>

      </div>
    </main>
  )
}