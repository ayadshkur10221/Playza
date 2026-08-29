'use client'

import { Terminal } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
type SocketMessage = { event?: string; args?: unknown[] }
type WebsocketPayload = { data?: { token?: string; socket?: string }; error?: string }

function stripAnsi(value: string) {
  return value.replace(/[\u001b\u009b]\[[0-?]*[ -/]*[@-~]/g, '')
}

function messageText(args: unknown[] | undefined) {
  return args?.filter((arg): arg is string => typeof arg === 'string').join('') || ''
}

function normalizeSocketUrl(value: string) {
  const url = new URL(value)
  if (window.location.protocol === 'https:' && url.protocol === 'ws:') url.protocol = 'wss:'
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new Error('Pterodactyl returned an invalid websocket URL.')
  return url.toString()
}

export default function ServerConsole({ identifier, initialStatus }: { identifier: string; initialStatus?: string | null }) {
  const [lines, setLines] = useState<string[]>([])
  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [serverStatus, setServerStatus] = useState(initialStatus || 'offline')
  const terminalRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempt = useRef(0)
  const intentionalClose = useRef(false)
  const shouldStickToBottom = useRef(true)
  const reconnectScheduled = useRef(false)
  const connectRef = useRef<(reconnecting?: boolean) => void>(() => undefined)

  const appendOutput = useCallback((value: string) => {
    const clean = stripAnsi(value)
    if (!clean) return
    setLines((current) => [...current, ...clean.split(/\r?\n/)])
  }, [])

  const fetchToken = useCallback(async (refresh = false) => {
    const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/websocket${refresh ? '?refresh=1' : ''}`, { cache: 'no-store' })
    const payload = await response.json() as WebsocketPayload
    if (!response.ok || !payload.data?.token || !payload.data.socket) {
      const retryAfter = Number(response.headers.get('retry-after')) || 0
      const error = new Error(payload.error || 'The console connection token could not be loaded.') as Error & { retryAfter?: number }
      error.retryAfter = retryAfter
      throw error
    }
    return payload.data
  }, [identifier])

  const connect = useCallback(async (reconnecting = false) => {
    if (serverStatus === 'offline' || serverStatus === 'suspended') {
      setConnection('disconnected')
      setError('The console is unavailable because this server is offline or suspended.')
      return
    }

    reconnectScheduled.current = false
    if (reconnecting) setConnection('reconnecting')
    else setConnection('connecting')
    setError(null)
    try {
      const { token, socket } = await fetchToken()
      if (!socket) throw new Error('Pterodactyl did not return a websocket URL.')
      const websocket = new WebSocket(normalizeSocketUrl(socket))
      socketRef.current = websocket
      websocket.onopen = () => {
        reconnectAttempt.current = 0
        setConnection('connected')
        websocket.send(JSON.stringify({ event: 'auth', args: [token] }))
      }
      websocket.onmessage = async (message) => {
        const rawMessage = typeof message.data === 'string'
          ? message.data
          : message.data instanceof Blob
            ? await message.data.text()
            : new TextDecoder().decode(message.data)
        let payload: SocketMessage
        try {
          payload = JSON.parse(rawMessage) as SocketMessage
        } catch {
          return
        }
        if (payload.event === 'auth success') websocket.send(JSON.stringify({ event: 'send logs', args: [null] }))
        if (payload.event === 'console output' || payload.event === 'install output') appendOutput(messageText(payload.args))
        if (payload.event === 'status' && typeof payload.args?.[0] === 'string') {
          setServerStatus(payload.args[0])
          setError(null)
        }
        if (payload.event === 'token expiring') {
          void fetchToken(true).then(({ token: freshToken }) => {
            if (websocket.readyState === WebSocket.OPEN) websocket.send(JSON.stringify({ event: 'auth', args: [freshToken] }))
          }).catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : 'Unable to refresh console authentication.'))
        }
        if (payload.event === 'token expired') {
          websocket.close()
        }
      }
      websocket.onerror = () => setError('The console connection encountered an error. Check that the node websocket endpoint is reachable over WSS.')
      websocket.onclose = (event) => {
        if (intentionalClose.current) return
        setConnection('disconnected')
        if (event.reason) setError(`Console disconnected: ${event.reason}`)
        if (reconnectScheduled.current) return
        reconnectScheduled.current = true
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 15000)
        reconnectAttempt.current += 1
        reconnectTimer.current = setTimeout(() => connectRef.current(true), delay)
      }
      websocket.binaryType = 'arraybuffer'
    } catch (caughtError) {
      setConnection('disconnected')
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to connect to the console.')
      if (reconnectScheduled.current) return
      reconnectScheduled.current = true
      const retryAfter = caughtError instanceof Error && 'retryAfter' in caughtError
        ? Number((caughtError as Error & { retryAfter?: number }).retryAfter) * 1000
        : 0
      const delay = Math.max(retryAfter || 0, Math.min(1000 * 2 ** reconnectAttempt.current, 15000))
      reconnectAttempt.current += 1
      reconnectTimer.current = setTimeout(() => connectRef.current(true), delay)
    }
  }, [appendOutput, fetchToken, serverStatus])

  useEffect(() => {
    connectRef.current = (reconnecting) => {
      void connect(reconnecting)
    }
  }, [connect])

  useEffect(() => {
    let active = true
    async function refreshStatus() {
      try {
        const response = await fetch(`/api/servers/${encodeURIComponent(identifier)}/status`, { cache: 'no-store' })
        const result = await response.json()
        if (active && response.ok && typeof result?.status === 'string') {
          setServerStatus(result.status)
        }
      } catch {
        // Keep the last known state when the status refresh fails.
      }
    }

    void refreshStatus()
    const interval = setInterval(refreshStatus, 4000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [identifier])

  useEffect(() => {
    if (serverStatus === 'offline' || serverStatus === 'suspended') {
      intentionalClose.current = true
      reconnectScheduled.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      socketRef.current?.close()
      socketRef.current = null
      return
    }

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    intentionalClose.current = false
    reconnectScheduled.current = false
    const initialConnect = setTimeout(() => void connect(), 0)
    return () => clearTimeout(initialConnect)
  }, [connect, serverStatus])

  useEffect(() => {
    const terminal = terminalRef.current
    if (terminal && shouldStickToBottom.current) terminal.scrollTop = terminal.scrollHeight
  }, [lines])

  function sendCommand(event: React.FormEvent) {
    event.preventDefault()
    const text = command.trim()
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ event: 'send command', args: [text] }))
    setHistory((current) => [text, ...current.filter((item) => item !== text)].slice(0, 50))
    setHistoryIndex(-1)
    setCommand('')
  }

  return (
    <section id="console" className="rounded-3xl border border-gray-200/80 bg-gray-950 p-6 text-gray-200 shadow-sm">
      <div className="mb-5 flex items-center gap-2 border-b border-gray-800 pb-4">
        <Terminal className="h-5 w-5 text-amber-400" />
        <h2 className="font-bold text-white">Console</h2>
      </div>
      {error && <p className="mb-3 rounded-xl border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-300">{error}</p>}
      <div ref={terminalRef} onScroll={(event) => { const element = event.currentTarget; shouldStickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24 }} className="h-80 overflow-y-auto rounded-2xl bg-black/50 p-5 font-mono text-xs leading-5 text-gray-300">
        {lines.length === 0 ? <span className="text-gray-600">Waiting for console output...</span> : lines.map((line, index) => <div key={`${index}-${line}`}>{line || ' '}</div>)}
      </div>
      <form onSubmit={sendCommand} className="mt-4 flex gap-3">
        <input value={command} onChange={(event) => { setCommand(event.target.value); setHistoryIndex(-1) }} onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
          event.preventDefault()
          const next = event.key === 'ArrowUp' ? Math.min(historyIndex + 1, history.length - 1) : Math.max(historyIndex - 1, -1)
          setHistoryIndex(next)
          setCommand(next < 0 ? '' : history[next])
        }} placeholder="Enter a server command..." disabled={connection !== 'connected'} className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 font-mono text-sm text-white outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50" />
        <button type="submit" disabled={connection !== 'connected' || !command.trim()} className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50">Send</button>
      </form>
    </section>
  )
}
