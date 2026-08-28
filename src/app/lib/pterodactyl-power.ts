import { pterodactylClientRequest } from './pterodactyl-shared'
import { getPterodactylStartupSettings } from './pterodactyl-settings'

export async function sendPterodactylPowerAction(identifier: string, signal: 'start' | 'stop' | 'restart') {
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/power`, {
    method: 'POST',
    body: JSON.stringify({ signal }),
  })
}

function minecraftNeedsJava25(version: string) {
  const match = version.trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  if (!match) return false

  const major = Number(match[1])
  const minor = Number(match[2] || 0)
  const patch = Number(match[3] || 0)
  return major > 26 || (major === 26 && (minor > 1 || (minor === 1 && patch >= 0)))
}

export async function ensurePterodactylJavaCompatibility(identifier: string, currentDockerImage?: string) {
  const settings = await getPterodactylStartupSettings(identifier)
  const versionVariable = Object.entries(settings.environment).find(([key]) =>
    /(?:minecraft|mc).*version|^version$/i.test(key)
  )
  const version = versionVariable?.[1]
    || settings.environment.MINECRAFT_VERSION
    || settings.environment.MC_VERSION
    || settings.environment.VERSION
    || settings.environment.MINECRAFT_VERSION_ID
    || ''

  if (!minecraftNeedsJava25(version)) return

  if (currentDockerImage) {
    const currentImage = currentDockerImage.toLowerCase()
    if (currentImage.includes('java_25') || currentImage.includes('java:25')) return
  }

  if (settings.docker_images.length === 0) {
    throw new Error('Unable to read the server Docker images. Check the client API startup permission.')
  }

  const java25Image = settings.docker_images.find((image) => /java[_:.-]?25/i.test(image))
  if (!java25Image) {
    throw new Error('This server egg does not provide a Java 25 Docker image for Minecraft 26.1 or newer.')
  }

  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/settings/docker-image`, {
    method: 'PUT',
    body: JSON.stringify({ docker_image: java25Image }),
  })
}
