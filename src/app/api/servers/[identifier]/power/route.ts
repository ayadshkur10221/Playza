import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { ensurePterodactylJavaCompatibility, sendPterodactylPowerAction } from '@/app/lib/pterodactyl-power'
import { enforceServerTime } from '@/app/lib/pterodactyl-time'

const signals = new Set(['start', 'stop', 'restart'])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) return Response.json({ error: 'Account email is required.' }, { status: 400 })

  const { identifier } = await params
  const body = await request.json().catch(() => null)
  const signal = body?.signal
  if (typeof signal !== 'string' || !signals.has(signal)) {
    return Response.json({ error: 'Invalid power action.' }, { status: 400 })
  }

  try {
    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })

    if (signal === 'start') {
      const expiresAt = await enforceServerTime(server.id, server.description)
      if (!expiresAt || expiresAt <= Date.now()) {
        return Response.json({ error: 'Add server time before starting this server.' }, { status: 403 })
      }
      await ensurePterodactylJavaCompatibility(server.identifier, server.docker_image)
    }
    await sendPterodactylPowerAction(server.identifier, signal as 'start' | 'stop' | 'restart')
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to send Pterodactyl power action:', error)
    const message = error instanceof Error && !error.name.startsWith('PterodactylClientApiError:')
      ? error.message
      : 'The server action could not be completed.'
    return Response.json({ error: message }, { status: 502 })
  }
}
