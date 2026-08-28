import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { deletePterodactylFile } from '@/app/lib/pterodactyl-files'

export async function POST(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  try {
    const { identifier } = await params
    const { path } = await request.json()
    if (typeof path !== 'string' || !path.startsWith('/')) return Response.json({ error: 'Invalid file path.' }, { status: 400 })
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })
    await deletePterodactylFile(server.identifier, [path])
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to delete Pterodactyl file:', error)
    return Response.json({ error: 'The file could not be deleted.' }, { status: 502 })
  }
}
