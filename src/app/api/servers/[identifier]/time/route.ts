import { randomBytes } from 'node:crypto'

import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { addServerTime, consumePendingAddTimeLink, createPendingAddTimeLink, enforceServerTime, getPendingAddTimeLink, getPublicAppBaseUrl, shortenWithCuty, unsuspendServer, withServerTimeLock } from '@/app/lib/pterodactyl-time'

export async function GET(_request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })
  try {
    const { identifier } = await params
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })
    const expiresAt = await enforceServerTime(server.id, server.description)
    const existing = getPendingAddTimeLink(server.identifier)
    if (existing) {
      return Response.json({ expiresAt, pendingUrl: existing.shortUrl, token: existing.token, pending: true })
    }
    return Response.json({ expiresAt })
  } catch (error) {
    console.error('Unable to read server time:', error)
    return Response.json({ error: 'Server time could not be loaded.' }, { status: 502 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  try {
    const { identifier } = await params
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const body = await request.json().catch(() => ({})) as { token?: string; shortUrl?: string }
    const url = new URL(request.url)
    const isCallback = url.searchParams.get('callback') === '1' || typeof body.token === 'string'

    if (isCallback) {
      const token = typeof body.token === 'string' ? body.token : url.searchParams.get('token') || ''
      if (!token) {
        return Response.json({ error: 'Missing add-time token.' }, { status: 400 })
      }
      if (!consumePendingAddTimeLink(server.identifier, token)) {
        return Response.json({ error: 'This add-time link has expired or already been used.' }, { status: 410 })
      }

      return withServerTimeLock(server.id, async () => {
        const latestServer = await getPterodactylServer(panelUser.id, identifier)
        if (!latestServer?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })
        const expiresAt = await addServerTime(latestServer.id, panelUser.id, latestServer.name, latestServer.description)
        await unsuspendServer(latestServer.id)
        return Response.json({ expiresAt, tokenUsed: true })
      })
    }

    const existing = getPendingAddTimeLink(server.identifier)
    if (existing) {
      return Response.json({ shortUrl: existing.shortUrl, token: existing.token, pending: true })
    }

    const token = randomBytes(8).toString('base64url').replace(/[-_]/g, '').slice(0, 16)
    const publicBaseUrl = getPublicAppBaseUrl()
    const callbackUrl = new URL(`/api/servers/${server.identifier}/time/callback`, publicBaseUrl)
    callbackUrl.searchParams.set('token', token)
    const shortUrl = await shortenWithCuty(callbackUrl.toString())
    const link = createPendingAddTimeLink(server.identifier, shortUrl, token)
    return Response.json({ shortUrl: link.shortUrl, token: link.token, pending: true })
  } catch (error) {
    console.error('Unable to add server time:', error)
    if (error instanceof Error && error.message === 'TIME_NOT_READY') {
      return Response.json(
        { error: 'Adding time cooldown is active. You can add more time when 1 hour remains.' },
        { status: 429, headers: { 'Retry-After': '3600' } },
      )
    }
    const message = error instanceof Error ? error.message : ''
    return Response.json({ error: message || 'Server time could not be added.' }, { status: 502 })
  }
}
