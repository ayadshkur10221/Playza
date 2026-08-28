import type { MouseEvent } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'

type FooterSectionProps = {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void
}

export default function FooterSection({ onNavigate }: FooterSectionProps) {
  return (
    <footer className="relative text-black bg-gray-100 pt-32 pb-16 px-6 md:px-12 overflow-hidden border-t border-gray-200">
      <div className="relative z-20 max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <img src="/playza-logo.png" alt="Playza" className="w-28 h-8 object-contain" />
            </Link>
            <p className="text-gray-600 text-sm max-w-sm leading-relaxed">
              Empowering gamers with high-speed, zero-cost Minecraft hosting. Start up your Server in 60 seconds with no strings attached.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Server Nodes Operational
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-black">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" onClick={(event) => onNavigate(event, 'features')} className="hover:text-amber-500 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(event) => onNavigate(event, 'faq')} className="hover:text-amber-500 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/servers" className="hover:text-amber-500 transition-colors">Dashboard</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-black">Legal & Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <span className="text-gray-500 text-xs block pt-1">
                  Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Playza. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> for the Minecraft community.
          </p>
        </div>
      </div>
    </footer>
  )
}
