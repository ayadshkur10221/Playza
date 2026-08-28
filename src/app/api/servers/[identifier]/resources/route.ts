import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer, getPterodactylServerResources } from '@/app/lib/pterodactyl-servers'

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
    const response = await getPterodactylServerResources(server.identifier)
    return Response.json(response?.attributes || {})
  } catch (error) {
    console.error('Unable to read Pterodactyl server resources:', error)
    const clientError = error as Error & { status?: number; detail?: string }
    if (clientError.status === 409 && /currently suspended|suspended/i.test(clientError.detail || clientError.message)) {
      return Response.json({ current_state: 'suspended', resources: {} })
    }
    return Response.json({ error: 'The server resources could not be loaded.' }, { status: 502 })
  }
}
