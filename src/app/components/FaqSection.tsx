'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import RevealOnScroll from './RevealOnScroll'

const FAQS = [
  [
    'Is Playza really 100% free?',
    'Yes! There are no trial periods, hidden credit card prompts, or surprise billing.',
  ],
  [
    'How fast will my Minecraft server boot up?',
    'Our automated provisioning containers deploy and boot your Minecraft instance in under 60 seconds from the moment you hit start.',
  ],
  [
    'Can I install custom plugins, and datapacks?',
    'Paper, and Spigot are fully supported. You can upload custom worlds and datapacks directly.',
  ],
  [
    'What happens if no one is playing on the server?',
    'Inactive servers enter a sleep state to preserve hardware resources and can be woken up instantly with a single click.',
  ],
  [
    'Is there DDoS protection included?',
    "No, don't expect enterprise-grade DDoS protection. But we recommend using third-party DDoS mitigation services like TCPShield to protect your server from attacks.",
  ],
]

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <section
      id="faq"
      className="bg-gray-100 border-t border-gray-200/80 py-28 px-6 md:px-12 scroll-mt-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4 space-y-4">
            <RevealOnScroll>
              <div className="font-minecraft inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                Common Questions
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mt-2">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 leading-relaxed text-base">
                Got questions about how Playza works? Here are the most direct answers regarding servers, performance.
              </p>
            </RevealOnScroll>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {FAQS.map(([question, answer], index) => {
              const isOpen = openFaq === index

              return (
                <RevealOnScroll key={question}>
                  <div
                    className={`group rounded-2xl border transition-all duration-300 bg-white overflow-hidden ${
                      isOpen
                        ? 'border-amber-400 shadow-md shadow-amber-500/5'
                        : 'border-gray-200/80 hover:border-amber-300'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                    >
                      <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                        {question}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-4 transition-transform duration-300 ${
                          isOpen
                            ? 'bg-amber-400 text-gray-900 rotate-180'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    <div
                      className={`transition-all duration-300 ease-in-out px-6 ${
                        isOpen
                          ? 'max-h-60 pb-6 opacity-100'
                          : 'max-h-0 pb-0 opacity-0 pointer-events-none'
                      }`}
                    >
                      <p className="text-gray-600 leading-relaxed text-sm sm:text-base border-t border-gray-100 pt-4">
                        {answer}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
