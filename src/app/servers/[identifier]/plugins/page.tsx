import { auth, currentUser } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import PluginsClient from './PluginsClient'

export default async function ServerPluginsPage({ params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) notFound()

  const { identifier } = await params
  const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
  const server = await getPterodactylServer(panelUser.id, identifier)
  if (!server?.identifier) notFound()

  return (
    <PluginsClient
      identifier={server.identifier}
      serverName={server.name || 'Minecraft Server'}
    />
  )
}
