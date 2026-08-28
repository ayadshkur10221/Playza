import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylFileContent, writePterodactylFile } from '@/app/lib/pterodactyl-files'

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
    const filePath = new URL(request.url).searchParams.get('path')
    if (!filePath) return Response.json({ error: 'File path is required.' }, { status: 400 })

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const content = await getPterodactylFileContent(server.identifier, filePath)
    return Response.json({ content })
  } catch (error) {
    console.error('Unable to read Pterodactyl file content:', error)
    return Response.json({ error: 'The file contents could not be loaded.' }, { status: 502 })
  }
}

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
    const { identifier } = await params
    const body = await request.json().catch(() => null)
    const filePath = body?.path
    const content = body?.content

    if (typeof filePath !== 'string' || typeof content !== 'string') {
      return Response.json({ error: 'File path and content are required.' }, { status: 400 })
    }

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    await writePterodactylFile(server.identifier, filePath, content)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to write Pterodactyl file:', error)
    return Response.json({ error: 'The file could not be saved.' }, { status: 502 })
  }
}
