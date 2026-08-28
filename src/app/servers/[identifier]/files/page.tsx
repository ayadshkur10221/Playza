import { auth, currentUser } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { getPterodactylFiles } from '@/app/lib/pterodactyl-files'
import FileManagerClient from './FileManagerClient'

export default async function ServerFilesPage({ params }: { params: Promise<{ identifier: string }> }) {
  const { isAuthenticated } = await auth()
  if (!isAuthenticated) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) notFound()

  const { identifier } = await params
  const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
  const server = await getPterodactylServer(panelUser.id, identifier)
  if (!server?.identifier) notFound()

  const files = await getPterodactylFiles(server.identifier)

  return (
    <FileManagerClient identifier={server.identifier} serverName={server.name || 'Minecraft Server'} initialFiles={files} />
  )
}
