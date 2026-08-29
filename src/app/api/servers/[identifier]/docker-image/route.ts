import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylStartupSettings, updatePterodactylDockerImage } from '@/app/lib/pterodactyl-settings'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  try {
    const body = await request.json().catch(() => null)
    const dockerImage = typeof body?.docker_image === 'string' ? body.docker_image.trim() : ''
    if (!dockerImage) return Response.json({ error: 'A Docker image is required.' }, { status: 400 })

    const { identifier } = await params
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const startup = await getPterodactylStartupSettings(server.identifier)
    if (!startup.docker_images.includes(dockerImage)) {
      return Response.json({ error: 'That Docker image is not available for this server.' }, { status: 400 })
    }

    await updatePterodactylDockerImage(server.identifier, dockerImage)
    return Response.json({ success: true, docker_image: dockerImage })
  } catch (error) {
    console.error('Unable to update Pterodactyl Docker image:', error)
    return Response.json({ error: 'The Docker image could not be updated.' }, { status: 502 })
  }
}
