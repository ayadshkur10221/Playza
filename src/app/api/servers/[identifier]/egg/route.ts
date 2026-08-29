import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getMinecraftNestEggs, updatePterodactylServerEgg } from '@/app/lib/pterodactyl-eggs'
import { reinstallPterodactylServer } from '@/app/lib/pterodactyl-settings'

export async function PATCH(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  try {
    const body = await request.json().catch(() => null)
    const eggId = Number(body?.softwareId ?? body?.eggId)
    const reinstall = body?.reinstall === true
    if (!Number.isInteger(eggId) || eggId < 1) return Response.json({ error: 'Choose a valid server egg.' }, { status: 400 })

    const { identifier } = await params
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })
    const egg = (await getMinecraftNestEggs()).find((candidate) => candidate.id === eggId)
    if (!egg) return Response.json({ error: 'That software is not available in the Minecraft nest.' }, { status: 400 })

    await updatePterodactylServerEgg(server.id, egg)
    if (reinstall) await reinstallPterodactylServer(server.identifier)
    return Response.json({ success: true, software: egg })
  } catch (error) {
    console.error('Unable to update server egg:', error)
    return Response.json({ error: 'The server egg could not be updated.' }, { status: 502 })
  }
}
