import { getPterodactylFileContent, writePterodactylFile } from './pterodactyl-files'

export async function acceptPterodactylEula(identifier: string) {
  await writePterodactylFile(identifier, '/eula.txt', '# Minecraft EULA accepted by Playza\r\n# https://www.minecraft.net/eula\r\neula=true\r\n')
}

export async function getPterodactylEulaState(identifier: string) {
  try {
    const content = await getPterodactylFileContent(identifier, '/eula.txt')
    return /(?:^|\n)\s*eula\s*=\s*true\s*(?:\n|$)/i.test(content)
  } catch (error) {
    const clientError = error as Error & { name?: string; status?: number }
    if (
      clientError.status === 404
      || clientError.name === 'PterodactylClientApiError:404'
      || (clientError.status === 500 && /DaemonConnectionException|machine running this server|installation process/i.test(clientError.message))
    ) {
      return false
    }
    throw error
  }
}
