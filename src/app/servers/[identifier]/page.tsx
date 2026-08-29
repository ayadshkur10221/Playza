import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import ServerControls from './ServerControls'
import Console from './Console'
import ResourceCards from './ResourceCards'
import ServerTimeCard from './ServerTimeCard'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer, getPterodactylServerStatus } from '@/app/lib/pterodactyl-servers'
import { enforceServerTime, getServerExpiry } from '@/app/lib/pterodactyl-time'

export default async function ServerManagePage({ params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) notFound()

  const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
  const { identifier } = await params
  const server = await getPterodactylServer(panelUser.id, identifier)
  if (!server?.identifier) notFound()
  await enforceServerTime(server.id, server.description)
  const status = await getPterodactylServerStatus(server.identifier)
  const allocation = server.allocations?.find((item) => item.is_default || item.id === server.allocation)
    || server.allocations?.[0]
  const address = allocation?.ip_alias || allocation?.alias || allocation?.ip
  const serverAddress = address && allocation?.port
    ? `${address}:${allocation.port}`
    : address || 'Unavailable'
  const initialExpiresAt = getServerExpiry(server.description)

  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
      <header className="flex flex-col gap-5 rounded-3xl border border-gray-200/80 bg-white p-7 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="font-minecraft text-xs font-bold uppercase tracking-widest text-amber-600">Server management</p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">{server.name || 'Minecraft Server'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500">
              <span>{server.identifier}</span>
              <span>
                <span className="font-semibold text-gray-400">Address:</span>{' '}
                <span className="font-medium text-gray-700">{serverAddress}</span>
              </span>
            </div>
            <div className="mt-5">
              <ServerControls identifier={server.identifier} initialStatus={status} />
            </div>
          </div>
          <ServerTimeCard identifier={server.identifier} initialExpiresAt={initialExpiresAt} />
        </div>
      </header>

      <Console identifier={server.identifier} initialStatus={status} />
      <ResourceCards identifier={server.identifier} memoryLimit={server.limits?.memory || 0} diskLimit={server.limits?.disk || 0} />
    </main>
  )
}
