import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { updatePterodactylMinecraftVersion, reinstallPterodactylServer } from '@/app/lib/pterodactyl-settings'
import { getPterodactylStartupSettings } from '@/app/lib/pterodactyl-settings'
import { MINECRAFT_VERSIONS } from '@/app/lib/minecraft-versions'

export async function GET(_request: Request, { params }: { params: Promise<{ identifier: string }> }) {
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
    const currentVersion = startup.variables.find((variable) => (
      /(?:minecraft|mc|server).*version|^version$/i.test(variable.key)
      || /(?:minecraft|mc|server).*version|^version$/i.test(variable.name || '')
    ))?.value || ''
    return Response.json({ currentVersion, variables: startup.variables })
  } catch (error) {
    console.error('Unable to load Minecraft version:', error)
    return Response.json({ error: 'The current Minecraft version could not be loaded.' }, { status: 502 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })
  try {
    const body = await request.json().catch(() => null)
    const version = typeof body?.version === 'string' ? body.version : ''
    const action = body?.action
    if (!MINECRAFT_VERSIONS.includes(version as typeof MINECRAFT_VERSIONS[number])) {
      return Response.json({ error: 'Choose a supported Minecraft version.' }, { status: 400 })
    }
    if (action !== 'update' && action !== 'reinstall') {
      return Response.json({ error: 'Invalid version update action.' }, { status: 400 })
    }
    const { identifier } = await params
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })
    await updatePterodactylMinecraftVersion(server.identifier, version)
    if (action === 'reinstall') await reinstallPterodactylServer(server.identifier)
    return Response.json({ success: true, message: 'Version updated successfully.', version, action })
  } catch (error) {
    console.error('Unable to update Minecraft version:', error)
    return Response.json({ error: 'The Minecraft version could not be updated.' }, { status: 502 })
  }
}
