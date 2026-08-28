import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { acceptPterodactylEula, getPterodactylEulaState } from '@/app/lib/pterodactyl-eula'

async function getOwnedServer(identifier: string) {
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) throw new Response(JSON.stringify({ error: 'Account email is required.' }), { status: 400 })
  const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
  const server = await getPterodactylServer(panelUser.id, identifier)
  if (!server?.identifier) throw new Response(JSON.stringify({ error: 'Server not found.' }), { status: 404 })
  return server
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const server = await getOwnedServer((await params).identifier)
    if (!server.identifier) return Response.json({ error: 'Server identifier is missing.' }, { status: 500 })
    return Response.json({ accepted: await getPterodactylEulaState(server.identifier) })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unable to read server EULA state:', error)
    return Response.json({ error: 'The server EULA state could not be loaded.' }, { status: 502 })
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const server = await getOwnedServer((await params).identifier)
    if (!server.identifier) return Response.json({ error: 'Server identifier is missing.' }, { status: 500 })
    await acceptPterodactylEula(server.identifier)
    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Unable to accept server EULA:', error)
    return Response.json({ error: 'The server EULA could not be accepted.' }, { status: 502 })
  }
}
