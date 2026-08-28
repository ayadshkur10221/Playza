import { currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { createPterodactylServer, getPterodactylServers } from '@/app/lib/pterodactyl-servers'

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.emailAddresses[0]?.emailAddress
  if (!email) {
    return Response.json({ error: 'Your account does not have an email address.' }, { status: 400 })
  }

  let name = 'Minecraft Server'
  try {
    const body = await request.json()
    if (typeof body.name === 'string') {
      name = body.name
    }
  } catch {
    // Use the default server name when no JSON body is provided.
  }

  try {
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const existingServers = await getPterodactylServers(panelUser.id)
    if (existingServers.length >= 1) {
      return Response.json({ error: 'You can only have one server.' }, { status: 409 })
    }

    const server = await createPterodactylServer(panelUser.id, name)
    return Response.json({ server: { id: server.id, identifier: server.identifier, name: server.name } }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'SERVER_LIMIT_REACHED') {
      return Response.json({ error: 'You can only have one server.' }, { status: 409 })
    }

    console.error('Unable to create Pterodactyl server:', error)
    return Response.json({ error: 'The server could not be created. Check your panel configuration.' }, { status: 502 })
  }
}
