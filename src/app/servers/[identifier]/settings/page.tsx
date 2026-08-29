import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylStartupSettings } from '@/app/lib/pterodactyl-settings'
import ServerSettingsClient from './ServerSettingsClient'

export default async function ServerSettingsPage({ params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) notFound()

  const { identifier } = await params
  const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
  const server = await getPterodactylServer(panelUser.id, identifier)
  if (!server?.identifier) notFound()

  const startupSettings = await getPterodactylStartupSettings(server.identifier)

  return (
    <ServerSettingsClient
      identifier={server.identifier}
      initialName={server.name || 'Minecraft Server'}
      initialDockerImage={startupSettings.docker_image || ''}
      initialDockerImages={startupSettings.docker_images || []}
    />
  )
}
