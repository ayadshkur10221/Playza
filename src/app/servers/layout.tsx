import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServerStatus, getPterodactylServers } from '@/app/lib/pterodactyl-servers'
import ServerInstallationOverlay from './ServerInstallationOverlay'
import { getMinecraftNestEggs, isVanillaEgg } from '@/app/lib/pterodactyl-eggs'

export default async function ServersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const displayName = user?.fullName || user?.firstName || user?.username || 'User'
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || ''
  let server: { name?: string; identifier?: string; egg?: number; isVanilla?: boolean } | undefined
  let serverStatus = 'offline'

  if (user && userEmail) {
    try {
      const panelUser = await ensurePterodactylUser({ clerkId: user.id, email: userEmail })
      const servers = await getPterodactylServers(panelUser.id)
      server = servers[0]
      if (server) {
        const eggs = await getMinecraftNestEggs()
        server = { ...server, isVanilla: isVanillaEgg(eggs.find((egg) => egg.id === server?.egg)) }
      }
      if (server?.identifier) {
        serverStatus = await getPterodactylServerStatus(server.identifier)
      }
    } catch (error) {
      console.error('Unable to load Pterodactyl servers for sidebar:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Sidebar displayName={displayName} userEmail={userEmail} server={server} serverStatus={serverStatus} />
      <div className="flex min-w-0 flex-1 flex-col">
        {children}
      </div>
      <ServerInstallationOverlay identifier={server?.identifier} initialStatus={serverStatus} />
    </div>
  )
}
