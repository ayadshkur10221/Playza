'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, HardDrive, LayoutDashboard, LifeBuoy, Puzzle, Settings, Terminal } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

type SidebarProps = {
  displayName: string
  userEmail: string
  server?: { name?: string; identifier?: string; isVanilla?: boolean }
  serverStatus?: string
}

export default function Sidebar({ displayName, userEmail, server, serverStatus }: SidebarProps) {
  const pathname = usePathname()
  const isCreatePage = pathname.startsWith('/servers/create')
  const isServerPage = pathname.startsWith('/servers/') && !isCreatePage
  const isFilesPage = pathname.endsWith('/files')
  const isSettingsPage = pathname.endsWith('/settings')
  const isPluginsPage = pathname.endsWith('/plugins')
  const isConsolePage = isServerPage && !isFilesPage && !isSettingsPage && !isPluginsPage
  const isSuspended = serverStatus === 'suspended'

  const serverNavItemClass = (active: boolean) => `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
    isSuspended
      ? 'cursor-not-allowed text-gray-400'
      : active
        ? 'bg-amber-500/10 text-amber-700'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
  }`

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col justify-between border-r border-gray-200/80 bg-white md:flex">
      <div className="space-y-8 p-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/playza-logo.png" alt="Playza" className="h-7 object-contain" />
        </Link>

        <nav className="space-y-1.5">
          <Link
            href="/servers"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
              !isCreatePage
                ? 'bg-amber-500/10 text-amber-700'
                : 'text-gray-600 hover:bg-amber-500/10 hover:text-amber-700'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-amber-600" />
            <span>Servers</span>
          </Link>

          {isServerPage && server?.identifier && (
            <div className="ml-3 space-y-1 border-l-2 border-amber-200 pl-4">
              <Link
                href={isSuspended ? '#' : `/servers/${server.identifier}`}
                onClick={(event) => {
                  if (isSuspended) event.preventDefault()
                }}
                className={`block truncate py-2 text-sm font-bold ${isSuspended ? 'cursor-not-allowed text-gray-400' : 'text-gray-900 hover:text-amber-700'}`}
              >
                {server.name || 'Minecraft Server'}
              </Link>
              <Link
                href={isSuspended ? '#' : `/servers/${server.identifier}`}
                onClick={(event) => {
                  if (isSuspended) event.preventDefault()
                }}
                className={serverNavItemClass(isConsolePage)}
                aria-disabled={isSuspended}
              >
                <Terminal className="h-3.5 w-3.5" />
                Console
              </Link>
              <Link
                href={isSuspended ? '#' : `/servers/${server.identifier}/files`}
                onClick={(event) => {
                  if (isSuspended) event.preventDefault()
                }}
                className={serverNavItemClass(isFilesPage)}
                aria-disabled={isSuspended}
              >
                <FileText className="h-3.5 w-3.5" />
                Files
              </Link>
              {!server.isVanilla && (
                <Link
                  href={isSuspended ? '#' : `/servers/${server.identifier}/plugins`}
                  onClick={(event) => {
                    if (isSuspended) event.preventDefault()
                  }}
                  className={serverNavItemClass(isPluginsPage)}
                  aria-disabled={isSuspended}
                >
                  <Puzzle className="h-3.5 w-3.5" />
                  Plugins
                </Link>
              )}
              <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 cursor-not-allowed" disabled>
                <HardDrive className="h-3.5 w-3.5" />
                Backups
              </button>
              <Link
                href={isSuspended ? '#' : `/servers/${server.identifier}/settings`}
                onClick={(event) => {
                  if (isSuspended) event.preventDefault()
                }}
                className={serverNavItemClass(isSettingsPage)}
                aria-disabled={isSuspended}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </div>
          )}

        </nav>
      </div>

      <div className="space-y-4 p-6">
        <div className="space-y-2 rounded-2xl border border-amber-200/60 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 font-minecraft">
            <LifeBuoy className="h-4 w-4" />
            Need Help?
          </div>
          <p className="text-xs leading-relaxed text-gray-600">
            Have questions or need assistance with setup? Check community FAQs.
          </p>
          <Link href="/#faq" className="inline-block text-xs font-bold text-amber-600 hover:underline">
            Read Docs -&gt;
          </Link>
        </div>

        <p className="border-t border-gray-100 pt-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Beta v0.3
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex min-w-0 flex-col truncate pr-2">
            <span className="truncate text-xs font-bold text-gray-900">{displayName}</span>
            <span className="truncate text-[11px] text-gray-500">{userEmail}</span>
          </div>
          <UserButton />
        </div>

      </div>
    </aside>
  )
}
