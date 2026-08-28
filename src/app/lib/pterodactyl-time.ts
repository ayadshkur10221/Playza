import { pterodactylRequest } from './pterodactyl-shared'

const EXPIRY_MARKER = 'PLAYZA_EXPIRES_AT='
export const SERVER_TIME_HOURS = 8

export function getServerExpiry(description?: string | null) {
  const match = description?.match(new RegExp(`${EXPIRY_MARKER}(\\d+)`))
  if (!match) return null
  const timestamp = Number(match[1])
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null
}

async function updateExpiry(serverId: number, userId: number | undefined, name: string | undefined, description: string | null | undefined, expiresAt: number | null) {
  const withoutMarker = (description || '').replace(new RegExp(`\\s*${EXPIRY_MARKER}\\d+`), '').trim()
  const nextDescription = expiresAt ? `${withoutMarker}${withoutMarker ? '\n' : ''}${EXPIRY_MARKER}${expiresAt}` : withoutMarker
  await pterodactylRequest(`/servers/${serverId}/details`, {
    method: 'PATCH',
    body: JSON.stringify({ name: name || 'Minecraft Server', user: userId, description: nextDescription }),
  })
  return expiresAt
}

export async function addServerTime(serverId: number, userId: number | undefined, name: string | undefined, description: string | null | undefined) {
  const current = getServerExpiry(description)
  if (current && current - Date.now() > 60 * 60 * 1000) {
    throw new Error('TIME_NOT_READY')
  }
  const base = current && current > Date.now() ? current : Date.now()
  return updateExpiry(serverId, userId, name, description, base + SERVER_TIME_HOURS * 60 * 60 * 1000)
}

export async function enforceServerTime(serverId: number, description: string | null | undefined) {
  const expiresAt = getServerExpiry(description)
  if (!expiresAt || expiresAt <= Date.now()) {
    try {
      await pterodactylRequest(`/servers/${serverId}/suspend`, { method: 'POST' })
    } catch (error) {
      const clientError = error as Error & { status?: number; detail?: string }
      const message = `${clientError.detail || ''} ${clientError.message || ''}`
      if (!(clientError.status === 409 && /already suspended|currently suspended|suspended/i.test(message))) throw error
    }
  }
  return expiresAt
}

export async function unsuspendServer(serverId: number) {
  await pterodactylRequest(`/servers/${serverId}/unsuspend`, { method: 'POST' })
}
