import { pterodactylClientRequest, pterodactylRequest } from './pterodactyl-shared'

type PterodactylStartupVariable = {
  key: string
  value: string
  default?: string
  name?: string
}

function parseStartupDockerImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [item]
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const image = typeof record.image === 'string' ? record.image : typeof record.value === 'string' ? record.value : null
        return image ? [image] : []
      }
      return []
    })
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const sources = Object.values(record)
    return sources.flatMap((item) => {
      if (typeof item === 'string') return [item]
      if (item && typeof item === 'object') {
        const nested = item as Record<string, unknown>
        const image = typeof nested.image === 'string' ? nested.image : typeof nested.value === 'string' ? nested.value : null
        return image ? [image] : []
      }
      return []
    })
  }

  return []
}

function parseStartupVariables(value: unknown): PterodactylStartupVariable[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const object = entry as Record<string, string | number | boolean | undefined>
      const key = typeof object.key === 'string'
        ? object.key
        : typeof object.env_variable === 'string'
          ? object.env_variable
          : typeof object.name === 'string'
            ? object.name
            : ''
      if (!key) return []
      const rawValue = typeof object.value === 'string'
        ? object.value
        : typeof object.server_value === 'string'
          ? object.server_value
          : typeof object.default_value === 'string'
            ? object.default_value
            : typeof object.default === 'string'
              ? object.default
            : ''
      return [{ key, value: rawValue, default: rawValue, name: typeof object.name === 'string' ? object.name : key }]
    })
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
      if (typeof entry === 'string') return [{ key, value: entry, default: entry, name: key }]
      if (entry && typeof entry === 'object') {
        const object = entry as Record<string, unknown>
        const rawValue = typeof object.value === 'string'
          ? object.value
          : typeof object.default_value === 'string'
            ? object.default_value
            : typeof object.default === 'string'
              ? object.default
              : ''
        return [{ key, value: rawValue, default: rawValue, name: typeof object.name === 'string' ? object.name : key }]
      }
      return []
    })
  }

  return []
}

export async function getPterodactylStartupSettings(identifier: string) {
  const serverRef = identifier

  try {
    const response = await pterodactylClientRequest<{
      data?: Array<{ attributes?: Record<string, unknown> }>
      meta?: { startup_command?: string; docker_images?: unknown; docker_image?: string }
    }>(`/servers/${encodeURIComponent(serverRef)}/startup`)

    const variableData = response?.data ?? []
    const variables = parseStartupVariables(variableData.map((entry) => entry.attributes ?? {}))
    const environment = variables.reduce<Record<string, string>>((collection, variable) => {
      collection[variable.key] = variable.value
      return collection
    }, {})

    const dockerImages = parseStartupDockerImages(response?.meta?.docker_images)
    const resolvedVariables = variables.length > 0
      ? variables
      : Object.entries(environment).map(([key, value]) => ({ key, value, default: value, name: key }))
    const resolvedEnvironment = resolvedVariables.reduce<Record<string, string>>((collection, variable) => {
      collection[variable.key] = variable.value
      return collection
    }, { ...environment })

    return {
      startup: response?.meta?.startup_command || '',
      docker_image: response?.meta?.docker_image || dockerImages[0] || '',
      docker_images: dockerImages,
      environment: resolvedEnvironment,
      variables: resolvedVariables,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('405') || /MethodNotAllowed|MethodNotAllowedHttpException/i.test(message)) {
      return {
        startup: '',
        docker_image: '',
        docker_images: [],
        environment: {},
        variables: [],
      }
    }
    throw error
  }
}

export async function updatePterodactylServerName(identifier: string, name: string) {
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/settings/rename`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updatePterodactylServerStartup(identifier: string, payload: {
  startup: string
  dockerImage: string
  environment: Record<string, string>
}) {
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/startup`, {
    method: 'PUT',
    body: JSON.stringify({
      startup: payload.startup,
      image: payload.dockerImage,
      environment: payload.environment,
    }),
  })
}

export async function updatePterodactylMinecraftVersion(identifier: string, version: string) {
  const settings = await getPterodactylStartupSettings(identifier)
  const versionVariable = settings.variables.find((variable) => (
    /(?:minecraft|mc|server).*version|^version$/i.test(variable.key)
    || /(?:minecraft|mc|server).*version|^version$/i.test(variable.name || '')
  ))
  if (!versionVariable) {
    throw new Error('This server egg does not expose an editable Minecraft version variable.')
  }
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/startup/variable`, {
    method: 'PUT',
    body: JSON.stringify({ key: versionVariable.key, value: version }),
  })
  const buildVariable = settings.variables.find((variable) => /^BUILD_NUMBER$/i.test(variable.key))
  if (buildVariable) {
    await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/startup/variable`, {
      method: 'PUT',
      body: JSON.stringify({ key: buildVariable.key, value: 'latest' }),
    })
  }
}

export async function updatePterodactylDockerImage(identifier: string, dockerImage: string) {
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/settings/docker-image`, {
    method: 'PUT',
    body: JSON.stringify({ docker_image: dockerImage }),
  })
}

export async function reinstallPterodactylServer(identifier: string) {
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/settings/reinstall`, {
    method: 'POST',
  })
}

export async function deletePterodactylServer(serverId: number) {
  if (!Number.isInteger(serverId) || serverId < 1) {
    throw new Error('Pterodactyl server ID is invalid.')
  }

  await pterodactylRequest(`/servers/${serverId}`, {
    method: 'DELETE',
  })
}
