import { randomInt } from 'node:crypto'

import {
  getCreationConfig,
  PterodactylAllocation,
  PterodactylAttributes,
  clientApiKey,
  PterodactylListResponse,
  PterodactylNode,
  PterodactylResponse,
  pterodactylClientRequest,
  pterodactylRequest,
} from './pterodactyl-shared'
import type { PterodactylServerResources } from './pterodactyl-shared'

export type PterodactylServer = PterodactylAttributes
const creationLocks = new Map<number, Promise<PterodactylServer>>()

function shuffle<T>(items: T[]) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function hasCapacity(node: PterodactylNode) {
  if (node.maintenance) return false

  const memoryAvailable = typeof node.memory !== 'number' || typeof node.allocated_resources?.memory !== 'number'
    || node.memory - node.allocated_resources.memory >= 2048
  const diskAvailable = typeof node.disk !== 'number' || typeof node.allocated_resources?.disk !== 'number'
    || node.disk - node.allocated_resources.disk >= 5120

  return memoryAvailable && diskAvailable
}

async function getAvailableNodeAndAllocation(preferredNodeId: number, preferredAllocationId: number) {
  const response = await pterodactylRequest<PterodactylListResponse<PterodactylNode>>('/nodes?per_page=100')
  const nodes = shuffle(response.data.map(({ attributes }) => attributes).filter(hasCapacity))
  const preferredNode = nodes.find((node) => node.id === preferredNodeId)
  const orderedNodes = preferredNode
    ? [preferredNode, ...nodes.filter((node) => node.id !== preferredNode.id)]
    : nodes

  for (const node of orderedNodes) {
    try {
      const allocationsResponse = await pterodactylRequest<PterodactylListResponse<PterodactylAllocation>>(
        `/nodes/${node.id}/allocations?per_page=100`
      )
      const allocations = allocationsResponse.data.map(({ attributes }) => attributes)
      const available = allocations.filter((allocation) => !allocation.assigned)
      if (available.length === 0) continue

      const preferred = available.find(
        (allocation) => node.id === preferredNodeId && allocation.id === preferredAllocationId
      )
      const allocation = preferred ?? available[randomInt(available.length)]

      if (allocation) return { nodeId: node.id, allocationId: allocation.id }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'PterodactylApiError:404')) throw error
    }
  }

  return null
}

export async function getPterodactylServers(ownerId: number) {
  const servers: PterodactylServer[] = []
  let page = 1
  let totalPages = 1

  do {
    const response = await pterodactylRequest<PterodactylListResponse<PterodactylServer>>(
      `/servers?include=allocations&per_page=100&page=${page}`
    )

    const pageServers = response.data
      .map(({ attributes, relationships }) => ({
        ...attributes,
        allocations: attributes.allocations
          || relationships?.allocations?.data.map(({ attributes: allocation }) => allocation),
      }))
      .filter((server) => server.user === ownerId || server.owner_id === ownerId)

    const detailedServers = await Promise.all(pageServers.map(async (server) => {
      const detail = await pterodactylRequest<PterodactylResponse<PterodactylServer>>(
        `/servers/${server.id}?include=allocations`
      )
      const allocations = detail.relationships?.allocations?.data.map(({ attributes }) => attributes)
      const clientAllocations = await getPterodactylNetworkAllocations(server.identifier || server.uuid)
      const resolvedAllocations = clientAllocations.length > 0
        ? clientAllocations
        : allocations && allocations.length > 0 ? allocations : server.allocations

      return {
        ...server,
        allocations: resolvedAllocations?.sort((left, right) => {
          const leftPrimary = left.is_default || left.id === server.allocation
          const rightPrimary = right.is_default || right.id === server.allocation
          return Number(rightPrimary) - Number(leftPrimary)
        }),
      }
    }))

    servers.push(...detailedServers)

    totalPages = response.meta?.pagination?.total_pages ?? page
    page += 1
  } while (page <= totalPages)

  return servers
}

async function getPterodactylNetworkAllocations(identifier: string) {
  if (!clientApiKey) return []

  let response: {
    data?: Array<{ attributes?: PterodactylAllocation } | PterodactylAllocation>
  } | undefined
  try {
    response = await pterodactylClientRequest<{
      data?: Array<{ attributes?: PterodactylAllocation } | PterodactylAllocation>
    }>(`/servers/${encodeURIComponent(identifier)}/network/allocations`)
  } catch (error) {
    const clientError = error as Error & { status?: number; detail?: string }
    if (
      clientError.status === 404
      || (clientError.status === 409 && /installation process|not yet completed/i.test(clientError.detail || clientError.message))
    ) {
      return []
    }
    throw error
  }

  return (response?.data ?? [])
    .flatMap((entry) => {
      if ('attributes' in entry && entry.attributes) return [entry.attributes]
      if ('ip' in entry || 'ip_alias' in entry || 'alias' in entry) return [entry]
      return []
    })
    .sort((left, right) => Number(right.is_default) - Number(left.is_default))
}

export async function getPterodactylServer(ownerId: number, identifier: string) {
  const servers = await getPterodactylServers(ownerId)
  return servers.find((server) => server.identifier === identifier || server.uuid === identifier) ?? null
}

export async function getPterodactylServerStatus(identifier: string) {
  try {
    const response = await pterodactylClientRequest<{
      attributes: { current_state: string; is_installing?: boolean; is_transferring?: boolean }
    }>(`/servers/${encodeURIComponent(identifier)}/resources`)
    if (response?.attributes.is_installing) return 'installing'
    return response?.attributes.current_state ?? 'offline'
  } catch (error) {
    const clientError = error as Error & { status?: number; detail?: string }
    if (clientError.status === 404) return 'offline'
    if (
      clientError.status === 409
      && /not yet completed its installation|installation process/i.test(clientError.detail || clientError.message)
    ) {
      return 'installing'
    }

    throw error
  }
}

export async function getPterodactylServerResources(identifier: string) {
  return pterodactylClientRequest<{ attributes: PterodactylServerResources }>(
    `/servers/${encodeURIComponent(identifier)}/resources`
  )
}

export function getPterodactylServerReference(server?: Partial<PterodactylAttributes> | null) {
  if (!server) return ''
  if (server.uuid) return server.uuid
  if (server.identifier) return server.identifier
  if (typeof server.id === 'number') return String(server.id)
  return ''
}

export async function createPterodactylServer(ownerId: number, name: string) {
  const previousCreation = creationLocks.get(ownerId) ?? Promise.resolve(null)
  const currentCreation = previousCreation.then(async () => {
    const existingServers = await getPterodactylServers(ownerId)
    if (existingServers.length >= 1) {
      throw new Error('SERVER_LIMIT_REACHED')
    }

    const config = getCreationConfig()
    const resolvedPlacement = await getAvailableNodeAndAllocation(config.nodeId, config.allocationId)
    if (!resolvedPlacement) {
      throw new Error('No available Pterodactyl node and allocation were found.')
    }

    const payload = {
      name: name.trim().slice(0, 64) || 'Minecraft Server',
      user: ownerId,
      nest: config.nestId,
      egg: config.eggId,
      docker_image: config.dockerImage,
      startup: config.startup,
      environment: {
        SERVER_JARFILE: 'server.jar',
        SERVER_MEMORY: '2048',
        BUILD_NUMBER: 'latest',
        EULA: 'FALSE',
      },
      limits: {
        memory: 2048,
        swap: 0,
        disk: 5120,
        io: 500,
        cpu: 100,
      },
      feature_limits: {
        databases: 0,
        allocations: 0,
        backups: 0,
      },
      node: resolvedPlacement.nodeId,
      allocation: {
        default: resolvedPlacement.allocationId,
      },
      deployment: {
        locations: [],
        dedicated_ip: false,
        port_range: [],
      },
      start_on_completion: false,
    }

    if (!Number.isInteger(payload.allocation.default)) {
      throw new Error('Pterodactyl allocation is not configured with a valid numeric ID.')
    }

    const response = await pterodactylRequest<PterodactylResponse<PterodactylServer>>('/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return response.attributes
  })

  creationLocks.set(ownerId, currentCreation)

  try {
    return await currentCreation
  } finally {
    if (creationLocks.get(ownerId) === currentCreation) {
      creationLocks.delete(ownerId)
    }
  }
}
