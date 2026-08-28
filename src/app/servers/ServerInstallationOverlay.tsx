'use client'

import { useEffect, useState } from 'react'

type ServerInstallationOverlayProps = {
  identifier?: string
  initialStatus?: string
}

function isInstalling(status: string) {
  return ['installing', 'install', 'reinstalling'].includes(status.toLowerCase())
}

export default function ServerInstallationOverlay({
  identifier,
  initialStatus = 'offline',
}: ServerInstallationOverlayProps) {
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    if (!identifier) return

    let active = true
    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/servers/${identifier}/status`, { cache: 'no-store' })
        const result = await response.json()
        if (active && response.ok && typeof result.status === 'string') {
          setStatus(result.status)
        }
      } catch {
        // Keep the last known status while the panel is unavailable.
      }
    }

    const interval = setInterval(refreshStatus, 3000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [identifier])

  if (!isInstalling(status)) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="server-installation-title"
        className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-8 text-center shadow-2xl"
      >
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500" />
        <h2 id="server-installation-title" className="text-2xl font-extrabold text-gray-900">
          Server is installing
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Your server is being prepared. This page will become available automatically when installation is complete.
        </p>
      </section>
    </div>
  )
}
