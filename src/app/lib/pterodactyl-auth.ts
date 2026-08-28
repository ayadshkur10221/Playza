import { randomBytes } from 'node:crypto'

import {
  PterodactylAttributes,
  PterodactylListResponse,
  PterodactylResponse,
  pterodactylRequest,
} from './pterodactyl-shared'

function getFirstName(email: string) {
  const localPart = email.split('@')[0] || 'Playza User'
  return localPart.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/)[0] || 'Playza'
}

function getUsername(email: string) {
  const localPart = email.split('@')[0] || 'playza-user'
  const username = localPart.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  return username.slice(0, 30) || `playza-${randomBytes(4).toString('hex')}`
}

function createPassword() {
  return `${randomBytes(24).toString('base64url')}A9!`
}

async function findUser(filter: string, value: string) {
  const response = await pterodactylRequest<PterodactylListResponse<PterodactylAttributes>>(
    `/users?filter[${filter}]=${encodeURIComponent(value)}&per_page=1`
  )
  return response.data[0]?.attributes ?? null
}

export async function ensurePterodactylUser({ clerkId, email }: { clerkId: string; email: string }) {
  const existingByClerkId = await findUser('external_id', clerkId)
  if (existingByClerkId) return existingByClerkId

  const existingByEmail = await findUser('email', email)
  if (existingByEmail) return existingByEmail

  try {
    const response = await pterodactylRequest<PterodactylResponse<PterodactylAttributes>>('/users', {
      method: 'POST',
      body: JSON.stringify({
        external_id: clerkId,
        username: getUsername(email),
        email,
        first_name: getFirstName(email),
        last_name: 'User',
        password: createPassword(),
        root_admin: false,
        language: 'en',
      }),
    })

    return response.attributes
  } catch (error) {
    // A concurrent request may have created the account between the lookup and POST.
    const existingByEmail = await findUser('email', email)
    if (existingByEmail) return existingByEmail
    throw error
  }
}
