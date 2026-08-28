import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { archivePterodactylFiles, downloadPterodactylFile } from '@/app/lib/pterodactyl-files'

async function archiveFiles(
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
    const body = request.method === 'POST' ? await request.json().catch(() => null) : null
    const paths = Array.isArray(body?.paths) ? body.paths.filter((path: unknown): path is string => typeof path === 'string' && path.startsWith('/')) : []
    const path = new URL(request.url).searchParams.get('path') ?? '/'

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const result = paths.length > 0
      ? await archivePterodactylFiles(server.identifier, paths)
      : await downloadPterodactylFile(server.identifier, path, true)
    const { blob, fileName } = result
    return new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Unable to archive Pterodactyl files:', error)
    return Response.json({ error: 'The archive could not be created.' }, { status: 502 })
  }
}

export async function GET(request: Request, context: { params: Promise<{ identifier: string }> }) {
  return archiveFiles(request, context)
}

export async function POST(request: Request, context: { params: Promise<{ identifier: string }> }) {
  return archiveFiles(request, context)
}