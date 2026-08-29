import ServerConsole from '@/app/components/ServerConsole'

export default function Console({ identifier, initialStatus }: { identifier: string; initialStatus?: string | null }) {
  return <ServerConsole identifier={identifier} initialStatus={initialStatus} />
}
