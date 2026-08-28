import { auth, currentUser } from '@clerk/nextjs/server'
import { ensurePterodactylUser } from '@/app/lib/pterodactyl-auth'
import { getPterodactylServer } from '@/app/lib/pterodactyl-servers'
import { uploadPterodactylFile } from '@/app/lib/pterodactyl-files'

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024

export async function POST(
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
    const directory = new URL(request.url).searchParams.get('directory') || '/'
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return Response.json({ error: 'Choose a file to upload.' }, { status: 400 })
    if (file.size > MAX_UPLOAD_SIZE) {
      return Response.json({ error: 'This file cannot be uploaded because it is larger than 500 MB.' }, { status: 413 })
    }

    const panelUser = await ensurePterodactylUser({ clerkId: user.id, email })
    const server = await getPterodactylServer(panelUser.id, identifier)
    if (!server?.identifier) return Response.json({ error: 'Server not found.' }, { status: 404 })
    await uploadPterodactylFile(server.identifier, directory, file)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unable to upload Pterodactyl file:', error)
    return Response.json({ error: 'The file could not be uploaded.' }, { status: 502 })
  }
}
