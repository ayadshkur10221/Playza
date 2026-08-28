import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import {
  deletePterodactylServer,
  getPterodactylStartupSettings,
  reinstallPterodactylServer,
  updatePterodactylServerName,
  updatePterodactylServerStartup,
} from '@/app/lib/pterodactyl-settings'

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

    const startupSettings = await getPterodactylStartupSettings(server.identifier)
    return Response.json({
      server: {
        identifier: server.identifier,
        name: server.name || '',
      },
      startup: {
        startup: startupSettings.startup || '',
        dockerImage: startupSettings.docker_image || '',
        dockerImages: startupSettings.docker_images || [],
        environment: startupSettings.environment || {},
        variables: startupSettings.variables || [],
      },
    })
  } catch (error) {
    console.error('Unable to load server settings:', error)
    return Response.json({ error: 'The server settings could not be loaded.' }, { status: 502 })
  }
}

export async function PATCH(
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
    const body = await request.json().catch(() => null)
    const type = body?.type

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    if (type === 'details') {
      const name = typeof body?.name === 'string' ? body.name.trim() : ''
      if (!name) return Response.json({ error: 'Server name is required.' }, { status: 400 })
      await updatePterodactylServerName(server.identifier, name)
      return Response.json({ success: true })
    }

    if (type === 'startup') {
      const startup = typeof body?.startup === 'string' ? body.startup : ''
      const dockerImage = typeof body?.dockerImage === 'string' ? body.dockerImage : ''
      const environment = body?.environment && typeof body.environment === 'object' ? body.environment as Record<string, string> : {}

      if (!startup || !dockerImage) {
        return Response.json({ error: 'Startup command and Docker image are required.' }, { status: 400 })
      }

      await updatePterodactylServerStartup(server.identifier, { startup, dockerImage, environment })
      return Response.json({ success: true })
    }

    if (type === 'reinstall') {
      await reinstallPterodactylServer(server.identifier)
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Invalid settings action.' }, { status: 400 })
  } catch (error) {
    console.error('Unable to update Pterodactyl server settings:', error)
    return Response.json({ error: 'The server settings could not be updated.' }, { status: 502 })
  }
}

export async function DELETE(
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

    await deletePterodactylServer(server.id)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to delete Pterodactyl server:', error)
    return Response.json({ error: 'The server could not be deleted.' }, { status: 502 })
  }
}
