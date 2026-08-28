import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylWebsocketInfo } from '@/app/lib/pterodactyl-console'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
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

    const websocket = await getPterodactylWebsocketInfo(server.identifier)
    if (!websocket) return Response.json({ error: 'Console is unavailable.' }, { status: 502 })
    return Response.json(websocket)
  } catch (error) {
    console.error('Unable to get Pterodactyl console connection:', error)
    const apiError = error as Error & { status?: number; detail?: string; retryAfter?: number }
    const status = apiError.status === 401 || apiError.status === 403 || apiError.status === 404 || apiError.status === 429 ? apiError.status : 502
    const message = status === 429
      ? 'Pterodactyl is rate-limiting console requests. Please wait before reconnecting.'
      : status === 401 || status === 403
      ? 'The Pterodactyl client API key cannot access this user server.'
      : status === 404
        ? 'Pterodactyl could not find this server or its node.'
        : 'The live console could not be connected. Check the node WebSocket configuration.'
    const headers = apiError.retryAfter ? { 'Retry-After': String(apiError.retryAfter) } : undefined
    return Response.json({ error: message, panelStatus: apiError.status, retryAfter: apiError.retryAfter }, { status, headers })
  }
}
