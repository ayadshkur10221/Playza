import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Load your local Minecraft font from public/fonts
const minecraftFont = localFont({
  src: '../../public/fonts/minecraft.ttf',
  variable: '--font-minecraft-family',
  display: 'swap',
})

const regularFont = localFont({
  src: '../../public/fonts/regular.ttf',
  variable: '--font-regular-family',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Playza',
  description: 'Deploy your Minecraft server in 60 seconds. High-speed performance with zero lag whenever you&apos;re ready to play.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${minecraftFont.variable} ${regularFont.variable}`}>
        <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}