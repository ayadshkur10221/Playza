import { randomBytes } from 'node:crypto'

import { pterodactylRequest } from './pterodactyl-shared'

const EXPIRY_MARKER = 'PLAYZA_EXPIRES_AT='
export const SERVER_TIME_HOURS = 8
const SERVER_TIME_COOLDOWN_MS = 60 * 60 * 1000
const addTimeLocks = new Map<number, Promise<void>>()
const pendingAddTimeLinks = new Map<string, { token: string; shortUrl: string; expiresAt: number; used: boolean }>()

export async function withServerTimeLock<T>(serverId: number, operation: () => Promise<T>) {
  const previous = addTimeLocks.get(serverId) || Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.then(() => current)
  addTimeLocks.set(serverId, queued)

  await previous
  try {
    return await operation()
  } finally {
    release()
    if (addTimeLocks.get(serverId) === queued) addTimeLocks.delete(serverId)
  }
}

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
  if (current && current - Date.now() > SERVER_TIME_COOLDOWN_MS) {
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

export function getPendingAddTimeLink(identifier: string) {
  const current = pendingAddTimeLinks.get(identifier)
  if (!current) return null
  if (current.used || current.expiresAt <= Date.now()) {
    pendingAddTimeLinks.delete(identifier)
    return null
  }
  return current
}

export function createPendingAddTimeLink(identifier: string, shortUrl: string, token = randomBytes(8).toString('base64url').replace(/[-_]/g, '').slice(0, 16)) {
  const previous = getPendingAddTimeLink(identifier)
  if (previous) return previous

  const current = {
    token,
    shortUrl,
    expiresAt: Date.now() + 30 * 60 * 1000,
    used: false,
  }
  pendingAddTimeLinks.set(identifier, current)
  return current
}

export function consumePendingAddTimeLink(identifier: string, token: string) {
  const current = pendingAddTimeLinks.get(identifier)
  if (!current || current.token !== token || current.used || current.expiresAt <= Date.now()) {
    pendingAddTimeLinks.delete(identifier)
    return false
  }

  current.used = true
  pendingAddTimeLinks.delete(identifier)
  return true
}

export function getPublicAppBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://playza.icu').trim()
  const candidate = raw.replace(/\/+$/, '')
  return /localhost|127\.0\.0\.1/i.test(candidate) ? 'https://playza.icu' : candidate || 'https://playza.icu'
}

function sanitizeCutyUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\\\//g, '/').trim()
}

export async function shortenWithCuty(targetUrl: string) {
  const apiToken = process.env.CUTY_API_KEY || process.env.CUTY_IO_API_TOKEN || process.env.CUTY_IO_API_KEY || process.env.CUTY_IO_TOKEN
  const alias = randomBytes(8).toString('hex').slice(0, 16)

  if (!apiToken) {
    return `https://cuty.io/${alias}`
  }

  const requestUrl = new URL('https://cuty.io/api')
  requestUrl.searchParams.set('api', apiToken)
  requestUrl.searchParams.set('url', targetUrl)
  requestUrl.searchParams.set('alias', alias)

  try {
    const response = await fetch(requestUrl, { method: 'GET', headers: { Accept: 'application/json', 'User-Agent': 'PlayzaPanel/1.0' }, cache: 'no-store' })
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || `Cuty.io request failed with status ${response.status}`)
    }

    const payload = await response.json() as {
      status?: string
      shortenedUrl?: string
      shortUrl?: string
      url?: string
      message?: string
    }

    const shortLink = sanitizeCutyUrl(payload.shortenedUrl)
      || sanitizeCutyUrl(payload.shortUrl)
      || (payload.status === 'success' ? sanitizeCutyUrl(payload.url) : '')

    if (shortLink.length > 0) return shortLink
  } catch (error) {
    console.error('Unable to shorten URL via Cuty.io:', error)
  }

  return `https://cuty.io/${alias}`
}
