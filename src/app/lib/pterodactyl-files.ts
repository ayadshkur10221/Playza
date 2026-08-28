import JSZip from 'jszip'

import {
  clientApiKey,
  panelUrl,
  PterodactylFile,
  PterodactylListResponse,
  pterodactylClientRequest,
} from './pterodactyl-shared'

export type { PterodactylFile } from './pterodactyl-shared'

export async function getPterodactylFiles(identifier: string, directory = '/') {
  const response = await pterodactylClientRequest<PterodactylListResponse<PterodactylFile>>(
    `/servers/${encodeURIComponent(identifier)}/files/list?directory=${encodeURIComponent(directory)}`
  )
  return response?.data.map(({ attributes }) => attributes) ?? []
}

export async function getPterodactylFileContent(identifier: string, filePath: string) {
  if (!panelUrl || !clientApiKey) {
    throw new Error('Pterodactyl client API is not configured. Set PTERODACTYL_CLIENT_API_KEY.')
  }

  const response = await fetch(`${panelUrl}/api/client/servers/${encodeURIComponent(identifier)}/files/contents?file=${encodeURIComponent(filePath)}`, {
    cache: 'no-store',
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${clientApiKey}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    const error = new Error(`Pterodactyl file content request failed (${response.status}): ${detail.slice(0, 200)}`)
    error.name = `PterodactylClientApiError:${response.status}`
    throw error
  }

  const rawText = await response.text()
  if (!rawText) return ''

  try {
    const parsed = JSON.parse(rawText) as { attributes?: { content?: string }; content?: string }
    if (typeof parsed?.content === 'string') return parsed.content
    if (typeof parsed?.attributes?.content === 'string') return parsed.attributes.content
  } catch {
    return rawText
  }

  return rawText
}

export async function writePterodactylFile(identifier: string, filePath: string, content: string) {
  await pterodactylClientRequest(
    `/servers/${encodeURIComponent(identifier)}/files/write?file=${encodeURIComponent(filePath)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: content,
    }
  )
}

export async function uploadPterodactylFile(identifier: string, directory: string, file: File) {
  const response = await pterodactylClientRequest<{
    data?: { attributes?: { url?: string } }
    attributes?: { url?: string }
  }>(`/servers/${encodeURIComponent(identifier)}/files/upload`)
  const url = response?.attributes?.url || response?.data?.attributes?.url
  if (!url) throw new Error('Pterodactyl did not provide an upload URL.')

  const formData = new FormData()
  const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' })
  formData.append('files', fileBlob, file.name)
  const uploadUrl = new URL(url)
  uploadUrl.searchParams.set('directory', directory)
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${clientApiKey}`,
    },
  })
  if (!uploadResponse.ok) {
    const detail = (await uploadResponse.text()).slice(0, 240)
    throw new Error(`Pterodactyl file upload failed (${uploadResponse.status}): ${detail}`)
  }

}

export async function deletePterodactylFile(identifier: string, filePaths: string[]) {
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/files/delete`, {
    method: 'POST',
    body: JSON.stringify({ root: '/', files: filePaths }),
  })
}

export async function archivePterodactylFiles(identifier: string, filePaths: string[]) {
  if (!panelUrl || !clientApiKey || filePaths.length === 0) {
    throw new Error('Pterodactyl client API is not configured or no files were selected.')
  }

  const archive = new JSZip()
  for (const filePath of filePaths) {
    const normalizedPath = filePath.replace(/\/+$/, '') || '/'
    const response = await fetch(`${panelUrl}/api/client/servers/${encodeURIComponent(identifier)}/files/download?file=${encodeURIComponent(normalizedPath)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/octet-stream', Authorization: `Bearer ${clientApiKey}` },
    })
    if (!response.ok) continue
    archive.file(normalizedPath.split('/').filter(Boolean).pop() || 'file', new Uint8Array(await (await response.blob()).arrayBuffer()))
  }

  return {
    blob: await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' }),
    fileName: 'selected-files.zip',
  }
}

export async function decompressPterodactylFile(identifier: string, filePath: string) {
  const directory = filePath.slice(0, filePath.lastIndexOf('/')) || '/'
  await pterodactylClientRequest(`/servers/${encodeURIComponent(identifier)}/files/decompress`, {
    method: 'POST',
    body: JSON.stringify({
      root: directory,
      file: filePath.split('/').pop() || filePath,
    }),
  })
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shouldSkipArchiveEntry(fileName: string) {
  const lower = fileName.toLowerCase()
  return lower.endsWith('.tmp')
    || lower.endsWith('.part')
    || lower.endsWith('.pid')
    || lower.endsWith('.lock')
    || lower.endsWith('.lck')
    || lower.endsWith('.so')
    || lower.endsWith('.jfr')
    || lower.includes('/tmp/')
    || lower.includes('tmp/')
}

export async function downloadPterodactylFile(identifier: string, filePath: string, forceDirectoryArchive = false) {
  if (!panelUrl || !clientApiKey) {
    throw new Error('Pterodactyl client API is not configured. Set PTERODACTYL_CLIENT_API_KEY.')
  }

  const normalizedPath = filePath === '/' ? '/' : filePath.replace(/\/+$/, '')

  if (forceDirectoryArchive || normalizedPath === '/') {
    const archive = new JSZip()
    const rootName = normalizedPath === '/' ? 'server-root' : (normalizedPath.split('/').filter(Boolean).pop() || 'folder')
    const basePath = normalizedPath === '/' ? '' : normalizedPath.replace(/\/$/, '')

    async function addDirectoryToArchive(currentPath: string, zipFolder: JSZip) {
      const entries = await getPterodactylFiles(identifier, currentPath)

      for (const entry of entries) {
        const entryPath = currentPath === '/' ? `/${entry.name}` : `${currentPath.replace(/\/$/, '')}/${entry.name}`

        if (entry.is_file === false) {
          const childFolder = zipFolder.folder(entry.name) ?? zipFolder
          await addDirectoryToArchive(entryPath, childFolder)
          continue
        }

        if (shouldSkipArchiveEntry(entry.name)) continue

        const response = await fetch(`${panelUrl}/api/client/servers/${encodeURIComponent(identifier)}/files/download?file=${encodeURIComponent(entryPath)}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/octet-stream',
            Authorization: `Bearer ${clientApiKey}`,
          },
        })

        if (!response.ok) continue

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const relativePath = basePath
          ? entryPath.replace(new RegExp(`^${escapeRegExp(basePath)}`), '').replace(/^\/+/, '')
          : entryPath.replace(/^\/+/, '')

        zipFolder.file(relativePath || entry.name, new Uint8Array(arrayBuffer))
      }
    }

    await addDirectoryToArchive(normalizedPath, archive.folder(rootName) ?? archive)
    const zipBlob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    return { blob: zipBlob, fileName: `${rootName}.zip` }
  }

  const response = await fetch(`${panelUrl}/api/client/servers/${encodeURIComponent(identifier)}/files/download?file=${encodeURIComponent(normalizedPath)}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/octet-stream',
      Authorization: `Bearer ${clientApiKey}`,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Pterodactyl file download failed (${response.status}): ${detail.slice(0, 200)}`)
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') || ''
  const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)
  const fallbackName = normalizedPath.split('/').filter(Boolean).pop() || 'download'
  const fileName = match ? decodeURIComponent(match[1].replace(/^"|"$/g, '')) : fallbackName

  return { blob, fileName }
}
