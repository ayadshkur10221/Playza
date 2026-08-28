import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { installModrinthPlugin } from '@/app/lib/modrinth-plugins'

const VALID_ID = /^[a-zA-Z0-9_-]{1,64}$/

export async function POST(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  try {
    const body = await request.json().catch(() => null)
    const projectId = typeof body?.projectId === 'string' ? body.projectId : ''
    const versionId = typeof body?.versionId === 'string' ? body.versionId : ''
    if (!VALID_ID.test(projectId) || !VALID_ID.test(versionId)) {
      return Response.json({ error: 'A valid plugin project and version are required.' }, { status: 400 })
    }

    const { identifier } = await params
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const result = await installModrinthPlugin(server.identifier, projectId, versionId)
    return Response.json({ success: true, fileName: result.fileName })
  } catch (error) {
    console.error('Unable to install Modrinth plugin:', error)
    const message = error instanceof Error ? error.message : ''
    if (/compatible plugin|not compatible|invalid plugin file|larger than 100 MB/i.test(message)) {
      return Response.json({ error: message }, { status: 422 })
    }
    return Response.json({ error: 'The plugin could not be installed.' }, { status: 502 })
  }
}
