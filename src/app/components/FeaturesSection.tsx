import { Blocks, CreditCard, Zap } from 'lucide-react'
import RevealOnScroll from './RevealOnScroll'

type Feature = {
  step: string
  tag: string
  title: string
  description: string
  icon: React.ReactNode
  stats: [string, string][]
}

const FEATURE_SECTIONS: Feature[] = [
  {
    step: '01',
    tag: 'Instant Deployment',
    title: 'Start in 60 Seconds',
    description: 'No slow queues. Start your server in under a minute.',
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    stats: [
      ['Startup Time', '< 60s'],
      ['Storage', 'SSD'],
      ['Tick Rate', '20.0 TPS'],
    ],
  },
  {
    step: '02',
    tag: 'Zero Paywalls',
    title: '100% Free Forever. No Credit Card.',
    description:
      'True free hosting with zero surprise fees or payment methods required. Jump straight into the dashboard and claim your server.',
    icon: <CreditCard className="w-8 h-8 text-amber-500" />,
    stats: [
      ['Payment Method', 'None'],
      ['Hidden Fees', '$0.00'],
      ['Cost Forever', '100% Free'],
    ],
  },
  {
    step: '03',
    tag: 'Community Ready',
    title: 'Bring Your Friends & Datapacks to the World',
    description:
      'Full support for Paper, Spigot. Install your favorite datapacks.',
    icon: <Blocks className="w-8 h-8 text-amber-500" />,
    stats: [
      ['Mod Engine', 'Paper/Spigot'],
      ['Slots', 'Uncapped'],
      ['DDoS Mitigation', 'Third-party'],
    ],
  },
]

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-gray-100 text-gray-900 py-32 px-6 md:px-12 scroll-mt-6"
    >
      <div className="max-w-7xl mx-auto space-y-28">
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4">
            <div className="font-minecraft inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider">
              Power of Playza
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Everything in the free server.
            </h2>
          </div>
        </RevealOnScroll>

        <div className="space-y-32">
          {FEATURE_SECTIONS.map((item, index) => (
            <RevealOnScroll key={item.step}>
              <div
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="font-minecraft text-2xl font-bold text-amber-500">
                      {item.step}
                    </span>
                    <span className="h-px w-12 bg-amber-300" />
                    <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                    {item.description}
                  </p>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="absolute -inset-4 bg-linear-to-r from-amber-300/30 to-amber-500/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />
                  <div className="relative bg-white border border-amber-200/80 rounded-3xl p-8 shadow-xl shadow-amber-500/5 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="font-minecraft text-xs px-3 py-1 rounded-md bg-amber-100 text-amber-700 font-semibold">
                        READY
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {item.stats.map(([label, value]) => (
                        <div
                          key={label}
                          className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center"
                        >
                          <span className="block text-[11px] text-gray-500 font-medium truncate mb-1">
                            {label}
                          </span>
                          <span className="font-minecraft text-sm font-bold text-gray-900">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
