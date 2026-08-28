'use client'

import { Cpu, HardDrive, MemoryStick } from 'lucide-react'
import { useEffect, useState } from 'react'

type ResourceCardsProps = {
  identifier: string
  memoryLimit: number
  diskLimit: number
}

type ResourceData = {
  current_state?: string
  resources?: {
    cpu_absolute?: number
    memory_bytes?: number
    disk_bytes?: number
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export default function ResourceCards({ identifier, memoryLimit, diskLimit }: ResourceCardsProps) {
  const [data, setData] = useState<ResourceData | null>(null)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      const response = await fetch(`/api/servers/${identifier}/resources`, { cache: 'no-store' })
      if (!response.ok) return
      const result = await response.json()
      if (active) setData(result)
    }
    void refresh()
    const interval = setInterval(() => void refresh(), 4000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [identifier])

  const resources = data?.resources
  const memoryUsed = resources?.memory_bytes || 0
  const diskUsed = resources?.disk_bytes || 0
  const memoryTotal = memoryLimit * 1024 * 1024
  const diskTotal = diskLimit * 1024 * 1024

  const cards = [
    {
      label: 'CPU Load',
      value: `${(resources?.cpu_absolute || 0).toFixed(1)}%`,
      detail: 'Current usage',
      icon: Cpu,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Memory',
      value: `${formatBytes(memoryUsed)} / ${formatBytes(memoryTotal)}`,
      detail: `${Math.max(memoryTotal - memoryUsed, 0) / 1024 / 1024 | 0} MB available`,
      icon: MemoryStick,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Disk',
      value: `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`,
      detail: `${formatBytes(Math.max(diskTotal - diskUsed, 0))} storage left`,
      icon: HardDrive,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ]

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{data?.current_state || 'offline'}</span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
            <p className="mt-1 text-xl font-extrabold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.detail}</p>
          </div>
        )
      })}
    </section>
  )
}
