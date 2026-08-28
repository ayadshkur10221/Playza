import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { addServerTime, enforceServerTime, unsuspendServer } from '@/app/lib/pterodactyl-time'

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
    return Response.json({ expiresAt })
  } catch (error) {
    console.error('Unable to read server time:', error)
    return Response.json({ error: 'Server time could not be loaded.' }, { status: 502 })
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ identifier: string }> }) {
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
    const expiresAt = await addServerTime(server.id, panelUser.id, server.name, server.description)
    await unsuspendServer(server.id)
    return Response.json({ expiresAt })
  } catch (error) {
    console.error('Unable to add server time:', error)
    if (error instanceof Error && error.message === 'TIME_NOT_READY') {
      return Response.json({ error: 'You can add more time when 1 hour remains.' }, { status: 429 })
    }
    const message = error instanceof Error ? error.message : ''
    return Response.json({ error: message || 'Server time could not be added.' }, { status: 502 })
  }
}
