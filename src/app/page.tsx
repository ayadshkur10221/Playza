'use client'

import type { MouseEvent } from 'react'
import HeroSection from './components/HeroSection'
import FeaturesSection from './components/FeaturesSection'
import FaqSection from './components/FaqSection'
import FooterSection from './components/FooterSection'

export default function LandingPage() {
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="w-full overflow-x-hidden bg-gray-100">
      <HeroSection onNavigate={scrollToSection} />
      <FeaturesSection />
      <FaqSection />
      <FooterSection onNavigate={scrollToSection} />
    </main>
  )
}
