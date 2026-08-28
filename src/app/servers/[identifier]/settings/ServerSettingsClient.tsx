'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type EnvironmentMap = Record<string, string>

type StartupVariable = {
  key: string
  value: string
  default?: string
  name?: string
}

type ServerSettingsClientProps = {
  identifier: string
  initialName: string
  initialStartup: string
  initialDockerImage: string
  initialDockerImages: string[]
  initialEnvironment: EnvironmentMap
  initialVariables: StartupVariable[]
}

export default function ServerSettingsClient({
  identifier,
  initialName,
  initialStartup,
  initialDockerImage,
  initialDockerImages,
  initialEnvironment,
  initialVariables,
}: ServerSettingsClientProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [startup, setStartup] = useState(initialStartup)
  const [dockerImage, setDockerImage] = useState(initialDockerImage || initialDockerImages[0] || '')
  const [dockerImages, setDockerImages] = useState<string[]>(
    initialDockerImages.length > 0 ? initialDockerImages : initialDockerImage ? [initialDockerImage] : []
  )
  const [variables, setVariables] = useState<StartupVariable[]>(
    initialVariables.length > 0
      ? initialVariables
      : Object.entries(initialEnvironment).map(([key, value]) => ({ key, value, default: value, name: key }))
  )
  const [saving, setSaving] = useState<'details' | 'startup' | 'reinstall' | 'delete' | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  useEffect(() => {
    if (initialDockerImage && !dockerImages.includes(initialDockerImage)) {
      setDockerImages((current) => Array.from(new Set([...current, initialDockerImage])))
    }
  }, [initialDockerImage, dockerImages])

  const environment = useMemo(() => {
    return variables.reduce<EnvironmentMap>((accumulator, variable) => {
      accumulator[variable.key] = variable.value
      return accumulator
    }, {})
  }, [variables])

  const updateVariableValue = (key: string, value: string) => {
    setVariables((current) =>
      current.map((variable) =>
        variable.key === key ? { ...variable, value } : variable
      )
    )
  }

  const saveDetails = async () => {
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

  const saveStartup = async () => {
    setSaving('startup')
    setStatus(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'startup', startup, dockerImage, environment }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to update server startup settings.')
      }

      setStatus({ type: 'success', message: 'Startup configuration updated successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to update startup settings.' })
    } finally {
      setSaving(null)
    }
  }

  const reinstallServer = async () => {
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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
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
              disabled={saving !== null}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === 'details' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Reinstall</h2>

          <p className="mb-5 text-sm leading-6 text-gray-600">
            Reinstalling your server will stop it, and then re-run the installation script that initially set it up.
          </p>

          <button
            type="button"
            onClick={() => void reinstallServer()}
            disabled={saving !== null}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === 'reinstall' ? 'Reinstalling...' : 'Reinstall server'}
          </button>
        </section>

        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="mb-3 text-xl font-bold text-red-700">Delete server</h2>
          <p className="mb-5 text-sm leading-6 text-gray-600">
            Permanently delete this server, This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => void deleteServer()}
            disabled={saving !== null}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving === 'delete' ? 'Deleting...' : 'Delete server'}
          </button>
        </section>

      </div>
    </main>
  )
}