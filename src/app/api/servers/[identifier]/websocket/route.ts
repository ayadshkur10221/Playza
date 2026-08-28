import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylWebsocketInfo } from '@/app/lib/pterodactyl-console'

const websocketCache = new Map<string, { token: string; socket: string; expiresAt: number }>()

export type WebsocketResponse = {
  data: {
    token: string
    socket: string
  }
}

export async function GET(
  request: Request,
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
    const bypassCache = new URL(request.url).searchParams.get('refresh') === '1'
    const cached = websocketCache.get(server.identifier)
    if (!bypassCache && cached && cached.expiresAt > Date.now()) {
      return Response.json({ data: { token: cached.token, socket: cached.socket } } satisfies WebsocketResponse)
    }
    const websocket = await getPterodactylWebsocketInfo(server.identifier)
    if (!websocket) return Response.json({ error: 'Console is unavailable.' }, { status: 502 })
    websocketCache.set(server.identifier, { ...websocket, expiresAt: Date.now() + 5000 })
    return Response.json({ data: websocket } satisfies WebsocketResponse)
  } catch (error) {
    console.error('Unable to get Pterodactyl websocket connection:', error)
    const apiError = error as Error & { status?: number; retryAfter?: number }
    if (apiError.status === 429) {
      const retryAfter = apiError.retryAfter || 15
      return Response.json(
        { error: `Console authentication is rate-limited. Retrying in ${retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }
    return Response.json({ error: 'The live console could not be connected.' }, { status: 502 })
  }
}
