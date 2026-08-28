'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Power } from 'lucide-react'

const TYPING_WORDS = ['One of the best!', 'Yes, it\'s 100% free.']

type HeroSectionProps = {
  onNavigate: (event: React.MouseEvent<HTMLAnchorElement>, id: string) => void
}

export default function HeroSection({ onNavigate }: HeroSectionProps) {
  const { isSignedIn } = useAuth()
  const [heroMounted, setHeroMounted] = useState(false)
  const [text, setText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHeroMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const currentWord = TYPING_WORDS[wordIndex]
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.substring(0, text.length + 1))
        if (text === currentWord) setTimeout(() => setIsDeleting(true), 1500)
      } else {
        setText(currentWord.substring(0, text.length - 1))
        if (text === '') {
          setIsDeleting(false)
          setWordIndex((previous) => (previous + 1) % TYPING_WORDS.length)
        }
      }
    }, isDeleting ? 40 : 90)

    return () => clearTimeout(timer)
  }, [text, isDeleting, wordIndex])

  return (
    <section className="relative h-screen overflow-hidden">
      <img
        src="/wallpaper-3.jpg"
        className={`w-full h-full object-cover blur-xs scale-105 transition-opacity duration-1000 ease-out ${heroMounted ? 'opacity-100' : 'opacity-0'}`}
        alt="Landing"
      />
      <div className="absolute inset-0 bg-black/45" />
      <header className={`absolute top-0 inset-x-0 z-20 px-6 md:px-12 py-6 bg-transparent transition-all duration-1000 ease-out ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <img src="/playza-logo.png" alt="Playza" className="w-26 h-8 object-contain" />
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-sm font-medium text-gray-200 hover:text-white transition-colors hidden sm:inline-block">Home</Link>
            <a href="#features" onClick={(event) => onNavigate(event, 'features')} className="text-sm font-medium text-gray-200 hover:text-white transition-colors hidden sm:inline-block cursor-pointer">Features</a>
            <a href="#faq" onClick={(event) => onNavigate(event, 'faq')} className="text-sm font-medium text-gray-200 hover:text-white transition-colors hidden sm:inline-block cursor-pointer">FAQ</a>
            {isSignedIn ? <Link href="/servers" className="font-minecraft text-sm font-medium text-white px-4 py-2 rounded-md bg-amber-400 hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/30">Dashboard</Link> : isSignedIn === false ? <Link href="/sign-in" className="text-sm font-medium text-white px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/10">Log in</Link> : null}
          </nav>
        </div>
      </header>
      <div className="absolute inset-0 z-10 flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="space-y-6 max-w-2xl">
            <h1 className={`text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight transition-all duration-1000 delay-200 ease-out ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Minecraft servers. <br />
              <span className="font-minecraft text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-300">{text}</span>
              <span className="text-amber-400 animate-pulse font-normal">|</span>
            </h1>
            <p className={`text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed transition-all duration-1000 delay-400 ease-out ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>Start your server in 60 seconds. High-speed performance with zero lag whenever you&apos;re ready to play.</p>
            <div className={`flex flex-wrap gap-4 pt-2 transition-all duration-1000 delay-600 ease-out ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {isSignedIn === false && <Link href="/sign-in" className="font-minecraft inline-flex items-center gap-2 px-6 py-3 rounded-md bg-amber-400 text-gray-900 font-semibold hover:bg-amber-500 transition-all shadow-xl hover:scale-105 transform active:scale-95">Create your server <Power className="w-4 h-4" /></Link>}
              {isSignedIn && <Link href="/servers" className="font-minecraft inline-flex items-center gap-2 px-6 py-3 rounded-md bg-amber-400 text-gray-900 font-semibold hover:bg-amber-500 transition-all shadow-xl hover:scale-105 transform active:scale-95">Power up your server <Power className="w-4 h-4" /></Link>}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-gray-100 via-gray-100/50 to-transparent pointer-events-none z-10" />
    </section>
  )
}
