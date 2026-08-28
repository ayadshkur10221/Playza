import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Plus, Server } from 'lucide-react'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServerStatus, getPterodactylServers, type PterodactylServer } from '@/app/lib/pterodactyl-servers'

export default async function ServersDashboard() {
  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || ''

  let servers: Array<PterodactylServer & { currentStatus: string }> = []
  let panelError: string | null = null

  if (user && userEmail) {
    try {
      const panelUser = await ensurePterodactylUser({ clerkId: user.id, email: userEmail })
      const serverList = await getPterodactylServers(panelUser.id)
      servers = await Promise.all(
        serverList.map(async (server) => ({
          ...server,
          currentStatus: await getPterodactylServerStatus(server.identifier || server.uuid),
        }))
      )
    } catch (error) {
      console.error('Unable to load Pterodactyl account or servers:', error)
      panelError = 'The server panel is temporarily unavailable. Please try again shortly.'
    }
  }

  return (
    <main className="flex-1 space-y-8 overflow-y-auto p-6 md:p-10">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Your Servers</h2>
            </div>
            {!panelError && servers.length === 0 && (
              <Link
                href="/servers/create"
                className="font-minecraft inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Server
              </Link>
            )}
          </div>

          {/* Server List / Empty State */}
          <div className="space-y-4">
            {panelError ? (
              <div className="rounded-3xl bg-white border border-red-200 p-8 text-center shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Unable to load your servers</h3>
                <p className="mt-2 text-sm text-gray-500">{panelError}</p>
              </div>
            ) : servers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white border border-gray-200/80 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Server className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">No servers active</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    You haven&apos;t created any Minecraft servers yet. Deploy your first instance in under 60 seconds.
                  </p>
                </div>
                <Link
                  href="/servers/create"
                  className="font-minecraft inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Create Server Now
                </Link>
              </div>
            ) : (
              servers.map((server) => {
                const allocation = server.allocations?.find((item) => item.is_default || item.id === server.allocation)
                  || server.allocations?.[0]
                const address = allocation?.ip_alias || allocation?.alias || allocation?.ip
                const serverAddress = address && allocation?.port ? `${address}:${allocation.port}` : address || 'Unavailable'

                return (
                  <div
                    key={server.id}
                    className="flex flex-col gap-4 rounded-3xl bg-white border border-gray-200/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <Server className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{server.name || 'Minecraft Server'}</h3>
                      <p className="text-sm text-gray-500">{server.identifier || server.uuid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Address</p>
                      <p className="truncate font-medium text-gray-700">{serverAddress}</p>
                    </div>
                    <span className="capitalize text-gray-500">{server.currentStatus || 'offline'}</span>
                    <Link
                      href={`/servers/${server.identifier}`}
                      className="font-minecraft rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-950 transition-all hover:bg-amber-500"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
                )
              })
            )}
          </div>
    </main>
  )
}