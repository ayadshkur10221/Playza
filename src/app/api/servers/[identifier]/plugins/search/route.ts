import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { searchModrinthPlugins } from '@/app/lib/modrinth-plugins'

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
    const query = new URL(request.url).searchParams.get('query')?.trim() || ''
    if (query.length > 100) return Response.json({ error: 'Search query is too long.' }, { status: 400 })

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    const plugins = await searchModrinthPlugins(query)
    return Response.json({ plugins })
  } catch (error) {
    console.error('Unable to search Modrinth plugins:', error)
    return Response.json({ error: 'Plugin search is temporarily unavailable.' }, { status: 502 })
  }
}
