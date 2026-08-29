'use client'

import { useState } from 'react'

type DockerImageCardProps = {
  identifier: string
  initialImage: string
  initialImages: string[]
  disabled?: boolean
}

function imageLabel(image: string) {
  const name = image.split('/').pop()?.replace(/^yolks:/, '').replace(/[_-]+/g, ' ') || image
  const match = name.match(/java\s*(\d+)/i)
  return match ? `Java ${match[1]}` : name.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function DockerImageCard({ identifier, initialImage, initialImages, disabled = false }: DockerImageCardProps) {
  const images = Array.from(new Set([...initialImages, initialImage].filter(Boolean)))
  const [image, setImage] = useState(initialImage || images[0] || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function saveImage() {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/docker-image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docker_image: image }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'The Docker image could not be updated.')
      setMessage({ type: 'success', text: 'Docker image updated! Please restart your server to apply changes.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'The Docker image could not be updated.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Docker Image</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Select the container environment for your server. Requires a server restart to apply.
      </p>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-medium text-gray-700">Java Version</span>
        <select
          value={image}
          onChange={(event) => setImage(event.target.value)}
          disabled={saving || images.length === 0 || disabled}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-amber-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {images.length === 0 ? <option value="">No Docker images available</option> : images.map((value) => <option key={value} value={value}>{imageLabel(value)}</option>)}
        </select>
      </label>
      {message && <p className={`mt-3 text-xs font-semibold ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>}
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={() => void saveImage()}
          disabled={saving || !image || images.length === 0 || disabled}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Updating...' : 'Update Image'}
        </button>
      </div>
    </section>
  )
}
