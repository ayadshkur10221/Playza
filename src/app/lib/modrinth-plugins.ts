import { uploadPterodactylFile } from './pterodactyl-files'

const MODRINTH_API_URL = 'https://api.modrinth.com/v2'
const PLUGIN_LOADERS = new Set(['paper', 'bukkit', 'spigot'])
const MODRINTH_FILE_HOSTS = new Set(['cdn.modrinth.com', 'cdn-raw.modrinth.com'])
const MAX_PLUGIN_SIZE = 100 * 1024 * 1024

type ModrinthProjectHit = {
  project_id?: unknown
  project_type?: unknown
  all_project_types?: unknown
  slug?: unknown
  title?: unknown
  description?: unknown
  icon_url?: unknown
  downloads?: unknown
  author?: unknown
  categories?: unknown
}

type ModrinthProjectVersion = {
  id?: unknown
  project_id?: unknown
  name?: unknown
  version_number?: unknown
  game_versions?: unknown
  loaders?: unknown
  date_published?: unknown
  files?: unknown
}

export type ModrinthPlugin = {
  id: string
  slug: string
  title: string
  description: string
  iconUrl: string | null
  downloads: number
}

export type ModrinthPluginVersion = {
  id: string
  name: string
  versionNumber: string
  datePublished: string | null
  fileName: string
}

type ModrinthFile = {
  filename?: unknown
  url?: unknown
  primary?: unknown
}

function hasPluginCategory(value: unknown) {
  return Array.isArray(value)
    && value.some((category) => typeof category === 'string' && PLUGIN_LOADERS.has(category.toLowerCase()))
}

function hasPluginLoader(value: unknown) {
  return Array.isArray(value)
    && value.some((loader) => typeof loader === 'string' && PLUGIN_LOADERS.has(loader.toLowerCase()))
}

function selectJarFile(files: ModrinthFile[]) {
  return files.find((file) => file.primary === true && typeof file.filename === 'string' && file.filename.toLowerCase().endsWith('.jar'))
    ?? files.find((file) => typeof file.filename === 'string' && file.filename.toLowerCase().endsWith('.jar'))
}

function modrinthHeaders() {
  const token = process.env.MODRINTH_API_TOKEN
  return {
    Accept: 'application/json',
    'User-Agent': 'Playza/0.1 (plugin installer)',
    ...(token ? { Authorization: token } : {}),
  }
}

async function modrinthRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${MODRINTH_API_URL}${path}`, {
    cache: 'no-store',
    headers: modrinthHeaders(),
  })

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200)
    throw new Error(`Modrinth API request failed (${response.status}): ${detail}`)
  }

  return response.json() as Promise<T>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function getMinecraftServerVersion(environment: Record<string, string>) {
  const entries = Object.entries(environment).sort(([leftKey], [rightKey]) => {
      const leftExact = /^(?:MINECRAFT_VERSION|MC_VERSION|VERSION)$/i.test(leftKey)
      const rightExact = /^(?:MINECRAFT_VERSION|MC_VERSION|VERSION)$/i.test(rightKey)
      const leftVersionKey = /(?:minecraft|mc).*version|^version$/i.test(leftKey)
      const rightVersionKey = /(?:minecraft|mc).*version|^version$/i.test(rightKey)
      return Number(rightExact) - Number(leftExact) || Number(rightVersionKey) - Number(leftVersionKey)
    })

  const versionPattern = /(?:^|[^0-9])((?:\d+\.\d+(?:\.\d+)?))(?=$|[^0-9])/ 
  for (const [, value] of entries) {
    const version = value.trim().match(versionPattern)?.[1]
    if (version) return version
  }

  return null
}

function normalizeProject(hit: ModrinthProjectHit): ModrinthPlugin | null {
  const id = typeof hit.project_id === 'string' ? hit.project_id : ''
  const title = typeof hit.title === 'string' ? hit.title : ''
  const projectTypes = Array.isArray(hit.all_project_types)
    ? hit.all_project_types.filter((type): type is string => typeof type === 'string').map((type) => type.toLowerCase())
    : []
  if (!id || !title || !projectTypes.includes('plugin') || !hasPluginCategory(hit.categories)) {
    return null
  }

  return {
    id,
    slug: typeof hit.slug === 'string' ? hit.slug : id,
    title,
    description: typeof hit.description === 'string' ? hit.description : '',
    iconUrl: typeof hit.icon_url === 'string' ? hit.icon_url : null,
    downloads: typeof hit.downloads === 'number' ? hit.downloads : 0,
  }
}

export async function searchModrinthPlugins(query: string) {
  const params = new URLSearchParams({
    query,
    facets: JSON.stringify([['all_project_types:plugin'], ['categories:paper', 'categories:bukkit', 'categories:spigot']]),
    limit: '24',
    index: 'relevance',
  })
  const response = await modrinthRequest<{ hits?: ModrinthProjectHit[] }>(`/search?${params.toString()}`)

  return (response.hits ?? []).flatMap((hit) => {
    const project = normalizeProject(hit)
    return project ? [project] : []
  })
}

function normalizeVersion(version: ModrinthProjectVersion, projectId: string): ModrinthPluginVersion | null {
  const id = typeof version.id === 'string' ? version.id : ''
  const versionProjectId = typeof version.project_id === 'string' ? version.project_id : ''
  const files = Array.isArray(version.files) ? version.files.filter(isRecord) as ModrinthFile[] : []
  const compatibleFile = selectJarFile(files)
  const fileName = typeof compatibleFile?.filename === 'string' ? compatibleFile.filename : ''
  if (!id || versionProjectId !== projectId || !hasPluginLoader(version.loaders) || !fileName.toLowerCase().endsWith('.jar')) {
    return null
  }

  return {
    id,
    name: typeof version.name === 'string' ? version.name : typeof version.version_number === 'string' ? version.version_number : id,
    versionNumber: typeof version.version_number === 'string' ? version.version_number : id,
    datePublished: typeof version.date_published === 'string' ? version.date_published : null,
    fileName,
  }
}

export async function getModrinthPluginVersions(projectId: string) {
  const versions = await modrinthRequest<ModrinthProjectVersion[]>(
    `/project/${encodeURIComponent(projectId)}/version`
  )

  return (versions ?? []).flatMap((version) => {
    const normalized = normalizeVersion(version, projectId)
    return normalized ? [normalized] : []
  })
}

function validModrinthFileUrl(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !MODRINTH_FILE_HOSTS.has(url.hostname.toLowerCase())) return null
    return url
  } catch {
    return null
  }
}

function safeJarFileName(value: unknown) {
  if (typeof value !== 'string' || value.length > 180 || value.includes('/') || value.includes('\\') || value.includes('..')) {
    return null
  }
  return /^[a-zA-Z0-9 _()[\].+@-]+\.jar$/i.test(value) ? value : null
}

export async function installModrinthPlugin(identifier: string, projectId: string, versionId: string) {
  const project = await modrinthRequest<{ id?: unknown; project_type?: unknown }>(
    `/project/${encodeURIComponent(projectId)}`
  )
  if (project.id !== projectId) {
    throw new Error('The selected Modrinth project could not be found.')
  }

  const version = await modrinthRequest<ModrinthProjectVersion>(`/version/${encodeURIComponent(versionId)}`)
  const normalized = normalizeVersion(version, projectId)
  if (!normalized) throw new Error('The selected plugin version is not compatible with this server.')

  const files = Array.isArray(version.files) ? version.files.filter(isRecord) as ModrinthFile[] : []
  const selectedFile = selectJarFile(files)
  const fileUrl = validModrinthFileUrl(selectedFile?.url)
  const fileName = safeJarFileName(selectedFile?.filename)
  if (!fileUrl || !fileName) throw new Error('Modrinth returned an invalid plugin file.')

  const fileResponse = await fetch(fileUrl, {
    cache: 'no-store',
    headers: modrinthHeaders(),
  })
  if (!fileResponse.ok) throw new Error(`Unable to download the plugin file (${fileResponse.status}).`)

  const fileBlob = await fileResponse.blob()
  if (fileBlob.size > MAX_PLUGIN_SIZE) throw new Error('This plugin file is larger than 100 MB.')
  const file = new File([fileBlob], fileName, { type: 'application/java-archive' })
  await uploadPterodactylFile(identifier, '/plugins', file)
  return { fileName }
}
