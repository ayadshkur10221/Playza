import { pterodactylClientRequest } from './pterodactyl-shared'

export async function getPterodactylWebsocketInfo(identifier: string) {
  const response = await pterodactylClientRequest<{
    data: { socket: string; token: string }
  }>(`/servers/${encodeURIComponent(identifier)}/websocket`)
  return response?.data ?? null
}
