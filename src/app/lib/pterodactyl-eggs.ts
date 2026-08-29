import { pterodactylRequest } from './pterodactyl-shared'

export type PterodactylEgg = {
  id: number
  name: string
  description: string
  docker_image: string
  startup: string
  variables: Record<string, string>
}

type EggEntry = {
  attributes: {
    id: number
    name: string
    description?: string | null
    docker_image?: string | null
    startup?: string | null
    relationships?: {
      variables?: {
        data?: Array<{ attributes?: { env_variable?: string; default_value?: string | null } }>
      }
    }
  }
}

export async function getMinecraftNestEggs() {
  const response = await pterodactylRequest<{ data?: EggEntry[] }>('/nests/1/eggs?include=variables&per_page=100')
  return (response.data || []).map(({ attributes }) => ({
    id: attributes.id,
    name: attributes.name,
    description: attributes.description || '',
    docker_image: attributes.docker_image || '',
    startup: attributes.startup || '',
    variables: (attributes.relationships?.variables?.data || []).reduce<Record<string, string>>((values, entry) => {
      const variable = entry.attributes
      if (variable?.env_variable) values[variable.env_variable] = variable.default_value || ''
      return values
    }, {}),
  })).filter((egg) => Number.isInteger(egg.id) && egg.name)
}

export function isVanillaEgg(egg?: Pick<PterodactylEgg, 'name'> | null) {
  return Boolean(egg?.name && /vanilla/i.test(egg.name))
}

export async function updatePterodactylServerEgg(serverId: number, egg: PterodactylEgg) {
  await pterodactylRequest(`/servers/${serverId}/startup`, {
    method: 'PATCH',
    body: JSON.stringify({
      environment: egg.variables,
      egg: egg.id,
      image: egg.docker_image,
      startup: egg.startup,
      skip_scripts: false,
    }),
  })
}
