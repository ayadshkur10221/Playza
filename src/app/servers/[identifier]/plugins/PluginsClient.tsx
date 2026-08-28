'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, Package, Search, X } from 'lucide-react'

type Plugin = {
  id: string
  slug: string
  title: string
  description: string
  iconUrl: string | null
  downloads: number
}

type PluginVersion = {
  id: string
  name: string
  versionNumber: string
  datePublished: string | null
  fileName: string
}

type PluginsClientProps = {
  identifier: string
  serverName: string
}

function formatDownloads(downloads: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(downloads)
}

export default function PluginsClient({ identifier, serverName }: PluginsClientProps) {
  const [query, setQuery] = useState('')
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [versions, setVersions] = useState<PluginVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const searchPlugins = useCallback(async (searchQuery: string) => {
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/plugins/search?query=${encodeURIComponent(searchQuery)}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Unable to search for plugins.')
      setPlugins(payload?.plugins ?? [])
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to search for plugins.')
    } finally {
      setLoading(false)
    }
  }, [identifier])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchPlugins('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [searchPlugins])

  const openPlugin = async (plugin: Plugin) => {
    setSelectedPlugin(plugin)
    setVersions([])
    setSelectedVersion('')
    setLoadingVersions(true)
    setError(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/plugins/${encodeURIComponent(plugin.id)}/versions`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Unable to load available versions.')
      const compatibleVersions = payload?.versions ?? []
      setVersions(compatibleVersions)
      if (compatibleVersions[0]?.id) setSelectedVersion(compatibleVersions[0].id)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load available versions.')
    } finally {
      setLoadingVersions(false)
    }
  }

  const installPlugin = async () => {
    if (!selectedPlugin || !selectedVersion) return
    setInstalling(true)
    setError(null)
    setStatus(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/plugins/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedPlugin.id, versionId: selectedVersion }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Unable to install this plugin.')
      setStatus(`${selectedPlugin.title} was installed in /plugins.`)
      setSelectedPlugin(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to install this plugin.')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
      <header className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <p className="font-minecraft text-xs font-bold uppercase tracking-widest text-amber-600">Server plugins</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Plugins</h1>
        <p className="mt-2 text-sm text-gray-500">
          Find and install plugins for {serverName}.
        </p>
      </header>

      <section className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            void searchPlugins(query)
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Search plugins</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search plugins"
              maxLength={100}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-300 focus:bg-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {status && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-3xl border border-gray-200/80 bg-white text-sm text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching plugins...
        </div>
      ) : plugins.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-gray-200/80 bg-white p-8 text-center shadow-sm">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-700">No plugins found</p>
          <p className="mt-1 text-sm text-gray-500">Try another search term.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plugins.map((plugin) => (
            <button
              key={plugin.id}
              type="button"
              onClick={() => void openPlugin(plugin)}
              className="flex min-h-44 cursor-pointer flex-col rounded-3xl border border-gray-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {plugin.iconUrl ? (
                  <img src={plugin.iconUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Package className="h-6 w-6" /></div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-gray-900">{plugin.title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400"><Download className="h-3 w-3" /> {formatDownloads(plugin.downloads)} downloads</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">{plugin.description || 'No description available.'}</p>
            </button>
          ))}
        </div>
      )}

      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="plugin-modal-title">
          <div className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-600">Compatible releases</p>
                <h2 id="plugin-modal-title" className="mt-1 text-xl font-bold text-slate-900">{selectedPlugin.title}</h2>
                <p className="mt-1 text-xs text-slate-500">Plugin release</p>
              </div>
              <button type="button" aria-label="Close plugin versions" onClick={() => setSelectedPlugin(null)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-6">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-12 text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading versions...</div>
              ) : versions.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">No releases are available.</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <label key={version.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${selectedVersion === version.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-amber-200'}`}>
                      <input type="radio" name="plugin-version" value={version.id} checked={selectedVersion === version.id} onChange={() => setSelectedVersion(version.id)} className="accent-amber-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-800">{version.name}</span>
                        <span className="block truncate text-xs text-slate-500">{version.fileName}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onClick={() => setSelectedPlugin(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-slate-900">Cancel</button>
              <button type="button" onClick={() => void installPlugin()} disabled={installing || loadingVersions || !selectedVersion} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300">
                {installing ? 'Installing...' : 'Install plugin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
