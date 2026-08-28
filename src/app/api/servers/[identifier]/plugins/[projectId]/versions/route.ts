import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getModrinthPluginVersions } from '@/app/lib/modrinth-plugins'

const VALID_PROJECT_ID = /^[a-zA-Z0-9_-]{1,64}$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string; projectId: string }> }
) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  try {
    const { identifier, projectId } = await params
    if (!VALID_PROJECT_ID.test(projectId)) return Response.json({ error: 'Invalid plugin project.' }, { status: 400 })

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const versions = await getModrinthPluginVersions(projectId)
    return Response.json({ versions })
  } catch (error) {
    console.error('Unable to load Modrinth plugin versions:', error)
    return Response.json({ error: 'Plugin versions are temporarily unavailable.' }, { status: 502 })
  }
}
