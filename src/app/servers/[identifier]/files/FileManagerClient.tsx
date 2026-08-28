'use client'

import { Download, File, Folder, FileText, Loader2, Trash2, Upload, X, Archive } from 'lucide-react'
import { useRef, useState } from 'react'
import type { PterodactylFile } from '@/app/lib/pterodactyl-files'

type FileManagerClientProps = {
  identifier: string
  serverName: string
  initialFiles: PterodactylFile[]
}

const NON_EDITABLE_EXTENSIONS = [
  '.jar', '.war', '.ear', '.zip', '.rar', '.7z', '.gz', '.tar', '.bz2', '.xz', '.pdf',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg', '.mp3', '.mp4', '.m4a',
  '.m4v', '.mov', '.avi', '.webm', '.wav', '.ogg', '.exe', '.msi', '.dll', '.so', '.dylib',
  '.bin', '.dat', '.db', '.sqlite', '.sqlite3', '.class', '.odt', '.ods', '.doc', '.docx',
  '.xls', '.xlsx', '.ppt', '.pptx', '.ttf', '.otf', '.woff', '.woff2', '.iso'
]
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024

function formatBytes(bytes = 0) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getEntryPath(directory: string, name: string) {
  if (directory === '/') return `/${name}`
  return `${directory.replace(/\/$/, '')}/${name}`
}

function canEditFile(fileName: string) {
  const normalized = fileName.toLowerCase()
  return !NON_EDITABLE_EXTENSIONS.some((extension) => normalized.endsWith(extension))
}

export default function FileManagerClient({ identifier, serverName, initialFiles }: FileManagerClientProps) {
  const [directory, setDirectory] = useState('/')
  const [files, setFiles] = useState(initialFiles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editor, setEditor] = useState<{ path: string; name: string; content: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDirectory = async (nextDirectory: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/files?directory=${encodeURIComponent(nextDirectory)}`)
      if (!response.ok) {
        throw new Error('Unable to load directory.')
      }

      const payload = await response.json()
      setDirectory(nextDirectory)
      setFiles(payload.files ?? [])
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load directory.')
    } finally {
      setLoading(false)
    }
  }

  const openDirectory = async (file: PterodactylFile) => {
    const nextDirectory = getEntryPath(directory, file.name)
    await loadDirectory(nextDirectory)
  }

  const openFileEditor = async (file: PterodactylFile) => {
    if (!canEditFile(file.name)) {
      setError(`${file.name} cannot be edited in the browser.`)
      return
    }

    const path = getEntryPath(directory, file.name)
    try {
      const response = await fetch(`/api/servers/${identifier}/files/content?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        throw new Error('Unable to load the file content.')
      }

      const payload = await response.json()
      setEditor({
        path,
        name: file.name,
        content: typeof payload.content === 'string' ? payload.content : '',
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load file content.')
    }
  }

  const downloadFile = async (file: PterodactylFile) => {
    const itemKey = `${directory}:${file.name}`
    setDownloadingKey(itemKey)
    setError(null)

    try {
      const path = getEntryPath(directory, file.name)
      const isFolderItem = file.is_file === false
      const response = await fetch(`/api/servers/${identifier}/files/download?path=${encodeURIComponent(path)}&type=${isFolderItem ? 'directory' : 'file'}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Unable to download this file.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${file.name}${isFolderItem ? '.zip' : ''}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to download this file.')
    } finally {
      setDownloadingKey((current) => current === itemKey ? null : current)
    }
  }

  const saveFile = async () => {
    if (!editor) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/servers/${identifier}/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: editor.path,
          content: editor.content,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to save the file.')
      }

      setEditor(null)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save the file.')
    } finally {
      setSaving(false)
    }

  }

  const uploadFiles = async (selectedFiles: FileList | File[]) => {
    const fileList = Array.from(selectedFiles)
    for (const file of fileList) {
      if (file.size > MAX_UPLOAD_SIZE) {
        setError(`${file.name} can't be uploaded because it's larger than 500 MB.`)
        continue
      }

      setUploading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`/api/servers/${identifier}/files/upload?directory=${encodeURIComponent(directory)}`, {
          method: 'POST',
          body: formData,
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || 'Unable to upload this file.')
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to upload this file.')
      } finally {
        setUploading(false)
      }
    }
    await loadDirectory(directory)
  }

  const deleteFile = async (file: PterodactylFile) => {
    if (!window.confirm(`Delete ${file.name}? This cannot be undone.`)) return
    const itemKey = `${directory}:${file.name}`
    setActionKey(itemKey)
    setError(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: getEntryPath(directory, file.name) }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Unable to delete this item.')
      await loadDirectory(directory)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete this item.')
    } finally {
      setActionKey(null)
    }
  }

  const decompressFile = async (file: PterodactylFile) => {
    const itemKey = `${directory}:${file.name}`
    setActionKey(itemKey)
    setError(null)
    try {
      const response = await fetch(`/api/servers/${identifier}/files/decompress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: getEntryPath(directory, file.name) }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Unable to unzip this file.')
      await loadDirectory(directory)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to unzip this file.')
    } finally {
      setActionKey(null)
    }
  }

  const breadcrumbParts = directory.split('/').filter(Boolean)
  const breadcrumbs = [
    { label: ' / home', path: '/' },
    ...breadcrumbParts.map((part, index) => ({
      label: part,
      path: `/${breadcrumbParts.slice(0, index + 1).join('/')}`,
    })),
  ]

  return (
    <div className={editor ? 'pointer-events-none' : ''}>
      <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
        <header className="flex flex-col gap-3">
          <div>
            <p className="font-minecraft text-xs font-bold uppercase tracking-widest text-amber-600">Server files</p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">{serverName}</h1>
          </div>
          <nav aria-label="File path" className="flex flex-wrap items-center gap-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.path} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-300">/</span>}
                <button
                  type="button"
                  onClick={() => void loadDirectory(breadcrumb.path)}
                  disabled={loading || breadcrumb.path === directory}
                  className="rounded-lg px-2 py-1 font-semibold text-gray-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-default disabled:text-gray-900"
                >
                  {breadcrumb.label}
                </button>
              </div>
            ))}
          </nav>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section
          className={`relative overflow-hidden rounded-3xl border bg-white shadow-sm transition ${dragActive ? 'border-amber-400 ring-4 ring-amber-100' : 'border-gray-200/80'}`}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault()
            if (event.currentTarget === event.target) setDragActive(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragActive(false)
            void uploadFiles(event.dataTransfer.files)
          }}
        >
          {dragActive && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-amber-50/90 backdrop-blur-sm">
              <div className="rounded-2xl border-2 border-dashed border-amber-400 px-10 py-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-amber-600" />
                <p className="mt-3 text-lg font-bold text-amber-800">Drop files here</p>
                <p className="mt-1 text-sm text-amber-700">Maximum file size: 500 MB</p>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files)
            event.target.value = ''
          }} />
          <div className="grid grid-cols-[minmax(0,1fr)_120px_64px] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
            <span>Name</span>
            <span>Size</span>
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center p-8 text-sm text-gray-500">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
              <FileText className="h-10 w-10 text-gray-300" />
              <p className="font-semibold text-gray-700">No files found</p>
              <p className="text-sm text-gray-500">This folder is empty.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {files.map((file) => {
                const isFolder = file.is_file === false
                const itemKey = `${directory}:${file.name}`
                const isEditable = !isFolder && canEditFile(file.name)

                return (
                  <div key={itemKey} className="group relative grid grid-cols-[minmax(0,1fr)_120px_64px] items-center gap-4 px-6 py-3 text-sm transition hover:bg-amber-50/40">
                    <button
                      type="button"
                      className="flex min-w-0 cursor-pointer items-center gap-3 text-left disabled:cursor-not-allowed"
                      onClick={() => {
                        if (isFolder) {
                          void openDirectory(file)
                          return
                        }

                        if (isEditable) {
                          void openFileEditor(file)
                        }
                      }}
                      disabled={!isFolder && !isEditable}
                    >
                      {isFolder ? <Folder className="h-5 w-5 shrink-0 text-amber-500" /> : <File className="h-5 w-5 shrink-0 text-gray-400" />}
                      <span className="truncate font-semibold text-gray-800">{file.name}</span>
                    </button>

                    <span className="text-gray-500">{isFolder ? '-' : formatBytes(file.size)}</span>

                    <div className="flex justify-end gap-1">
                      {file.name.toLowerCase().endsWith('.zip') && (
                        <button type="button" aria-label={`Unzip ${file.name}`} disabled={actionKey === itemKey} onClick={() => void decompressFile(file)} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-amber-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
                          {actionKey === itemKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Download ${file.name}`}
                        disabled={downloadingKey === itemKey}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition hover:border-amber-200 hover:bg-amber-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:border-amber-200 disabled:bg-amber-100 disabled:text-amber-700"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void downloadFile(file)
                        }}
                      >
                        {downloadingKey === itemKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </button>
                      <button type="button" aria-label={`Delete ${file.name}`} disabled={actionKey === itemKey} onClick={() => void deleteFile(file)} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {actionKey === itemKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {editor && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-600">Editor</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{editor.name}</h2>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                  onClick={() => setEditor(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={editor.content}
                onChange={(event) => setEditor((current) => current ? { ...current, content: event.target.value } : current)}
                className="min-h-[56vh] flex-1 resize-none border-0 bg-slate-950 p-5 font-mono text-sm leading-6 text-slate-100 outline-none"
              />

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  onClick={() => setEditor(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                  onClick={() => void saveFile()}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
