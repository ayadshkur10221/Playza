import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { downloadPterodactylFile } from '@/app/lib/pterodactyl-files'

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
    const url = new URL(request.url)
    const filePath = url.searchParams.get('path')
    const type = url.searchParams.get('type')
    if (!filePath) return Response.json({ error: 'File path is required.' }, { status: 400 })

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const { blob, fileName } = await downloadPterodactylFile(server.identifier, filePath, type === 'directory')
    return new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Unable to download Pterodactyl file:', error)
    return Response.json({ error: 'The file could not be downloaded.' }, { status: 502 })
  }
}
