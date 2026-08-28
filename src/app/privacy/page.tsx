import Link from 'next/link'

const sections = [
  ['1. Information We Collect', [
    '**Account Information:** When you sign up, we collect your **email address** and an encrypted password hash to create and secure your account.',
    '**Server Files & Logs:** The Minecraft server files, plugin configurations, and server console logs you upload and generate while running your server.',
    '**Technical & Security Data:** Standard server log data, including your IP address, browser type, and timestamps, used for fraud detection, bot prevention, and panel security.',
  ]],
  ['2. Cookies & Local Storage', [
    'We use cookies and similar browser storage technologies for three clear purposes:',
    '**Login Information:** Session cookies that keep you authenticated as you navigate your dashboard.',
    '**User Preferences:** Functional cookies that remember your interface settings (such as dark mode, panel layouts, or table filters).',
    '**Browsing Activity & Analytics:** Aggregate metrics to understand which features are used most, helping us improve speed and stability.',
  ]],
  ['3. Advertising Partners', [
    'Because our service is free, we partner with third-party ad networks to display advertisements on `playza.icu`.',
    'These ad networks may use cookies and web beacons to serve ads relevant to your general browsing interests.',
    'You can adjust your cookie settings or opt out of personalized advertising directly through your browser or device settings.',
  ]],
  ['4. How Your Data Is Stored & Shared', [
    '**No Selling of Personal Data:** We do not sell, rent, or trade your email address or personal details to third parties.',
    '**Infrastructure Providers:** Your server files, database entries, and account logs reside on secured server infrastructure leased from established data center providers.',
  ]],
  ['5. Account Deletion & Data Rights', [
    'You are always in control of your data. If you wish to delete your Playza account, remove your server files, or ask any privacy-related questions, simply email us at **`support@playza.icu`**, and we will process your request promptly.',
  ]],
] as const

function formatText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    return part
  })
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-900 md:px-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-amber-600 hover:text-amber-700">← Back to Playza</Link>
        <header className="mt-10 border-b border-gray-200 pb-8">
          <p className="font-minecraft text-xs font-bold uppercase tracking-widest text-amber-600">Legal</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-gray-500">Last Updated: August 28, 2026</p>
        </header>
        <article className="space-y-8 py-10 text-[15px] leading-7 text-gray-600">
          <p>At <strong>Playza</strong>, we value your trust and keep our data collection strictly focused on what is needed to manage your server account, maintain platform security, and fund the service through ads.</p>
          {sections.map(([title, paragraphs]) => (
            <section key={title}>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <div className="mt-3 space-y-3">{paragraphs.map((paragraph) => <p key={paragraph}>{formatText(paragraph)}</p>)}</div>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}
