import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylStartupSettings } from '@/app/lib/pterodactyl-settings'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> },
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

    const startup = await getPterodactylStartupSettings(server.identifier)
    return Response.json({
      docker_image: startup.docker_image,
      docker_images: startup.docker_images,
      environment: startup.environment,
      variables: startup.variables,
      currentVersion: startup.variables.find((variable) => (
        /(?:minecraft|mc|server).*version|^version$/i.test(variable.key)
        || /(?:minecraft|mc|server).*version|^version$/i.test(variable.name || '')
      ))?.value || '',
    })
  } catch (error) {
    console.error('Unable to load Pterodactyl startup configuration:', error)
    return Response.json({ error: 'The startup configuration could not be loaded.' }, { status: 502 })
  }
}
