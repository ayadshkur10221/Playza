export type PterodactylAttributes = {
  id: number
  uuid: string
  identifier?: string
  name?: string
  description?: string | null
  docker_image?: string
  user?: number
  owner_id?: number
  email?: string
  username?: string
  first_name?: string
  last_name?: string
  external_id?: string | null
  allocation?: number
  status?: string | null
  limits?: {
    memory: number
    disk: number
    cpu: number
  }
  feature_limits?: {
    backups: number
    databases: number
    allocations: number
  }
  allocations?: PterodactylAllocation[]
  node?: {
    fqdn?: string
    scheme?: 'http' | 'https'
    daemon_listen?: number
    daemon_sftp?: number
  }
}

export type PterodactylResponse<T> = {
  object: string
  attributes: T
  relationships?: {
    allocations?: {
      data: Array<PterodactylResponse<PterodactylAllocation>>
    }
  }
}

export type PterodactylListResponse<T> = {
  data: PterodactylResponse<T>[]
  meta?: {
    pagination?: {
      current_page: number
      total_pages: number
    }
  }
}

export type PterodactylAllocation = {
  id: number
  assigned?: boolean
  ip?: string
  ip_alias?: string | null
  alias?: string | null
  port?: number
  is_default?: boolean
}

export type PterodactylNode = {
  id: number
  maintenance?: boolean
  memory?: number
  disk?: number
  allocated_resources?: {
    memory?: number
    disk?: number
  }
}

export type PterodactylFile = {
  name: string
  mode?: string
  size?: number
  is_file?: boolean
  is_symlink?: boolean
  mimetype?: string
  modified_at?: string
}

export type PterodactylServerResources = {
  current_state?: string
  is_installing?: boolean
  resources?: {
    cpu_absolute?: number
    memory_bytes?: number
    disk_bytes?: number
  }
}

export const panelUrl = process.env.PTERODACTYL_PANEL_URL?.replace(/\/$/, '')
const apiKey = process.env.PTERODACTYL_API_KEY
export const clientApiKey = process.env.PTERODACTYL_CLIENT_API_KEY || process.env.PTERODACTYL_USER_API_KEY
const nodeId = Number(process.env.PTERODACTYL_NODE_ID)
const allocationId = Number(process.env.PTERODACTYL_ALLOCATION_ID)
const nestId = Number(process.env.PTERODACTYL_NEST_ID || 1)
const eggId = Number(process.env.PTERODACTYL_EGG_ID || 5)
const dockerImage = process.env.PTERODACTYL_DOCKER_IMAGE || 'ghcr.io/pterodactyl/yolks:java_25'
const startup = process.env.PTERODACTYL_STARTUP || 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}'

function getApiConfig() {
  if (!panelUrl || !apiKey) {
    throw new Error('Pterodactyl is not configured. Set PTERODACTYL_PANEL_URL and PTERODACTYL_API_KEY.')
  }

  return { panelUrl, apiKey }
}

export function getCreationConfig() {
  getApiConfig()

  if (!Number.isInteger(nodeId) || nodeId < 1 || !Number.isInteger(allocationId) || allocationId < 1) {
    throw new Error('Pterodactyl creation is not configured. Set valid PTERODACTYL_NODE_ID and PTERODACTYL_ALLOCATION_ID.')
  }

  if (!Number.isInteger(nestId) || nestId < 1 || !Number.isInteger(eggId) || eggId < 1) {
    throw new Error('Pterodactyl creation is not configured. Set valid PTERODACTYL_NEST_ID and PTERODACTYL_EGG_ID.')
  }

  return { nodeId, allocationId, nestId, eggId, dockerImage, startup }
}

export async function pterodactylRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getApiConfig()
  const response = await fetch(`${config.panelUrl}/api/application${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'Application/vnd.pterodactyl.v1+json',
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    const error = new Error(`Pterodactyl API request failed (${response.status}): ${detail.slice(0, 200)}`)
    error.name = `PterodactylApiError:${response.status}`
    throw error
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function pterodactylClientRequest<T = void>(path: string, init?: RequestInit): Promise<T | undefined> {
  if (!panelUrl || !clientApiKey) {
    throw new Error('Pterodactyl client API is not configured. Set PTERODACTYL_CLIENT_API_KEY.')
  }

  const response = await fetch(`${panelUrl}/api/client${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'Application/vnd.pterodactyl.v1+json',
      Authorization: `Bearer ${clientApiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    const error = new Error(`Pterodactyl client API request failed (${response.status}): ${detail.slice(0, 200)}`) as Error & { status?: number; detail?: string; retryAfter?: number }
    error.name = `PterodactylClientApiError:${response.status}`
    error.status = response.status
    error.detail = detail.slice(0, 200)
    error.retryAfter = Number(response.headers.get('retry-after')) || undefined
    throw error
  }

  if (response.status === 204) return undefined
  return response.json() as Promise<T>
}
