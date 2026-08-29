import { getPublicAppBaseUrl } from '@/app/lib/pterodactyl-time'

export async function GET(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params
  const token = new URL(request.url).searchParams.get('token') || ''
  const redirectTarget = new URL(`/servers/${identifier}`, getPublicAppBaseUrl())

  if (token) {
    redirectTarget.searchParams.set('add-time', '1')
    redirectTarget.searchParams.set('token', token)
  }

  return Response.redirect(redirectTarget.toString(), 302)
}
