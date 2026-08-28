import Link from 'next/link'

const sections = [
  ['1. How Playza Operates', [
    '**100% Free & Ad-Supported:** Playza is completely free. We do not charge subscription fees or require credit card details. To keep our nodes running, we display third-party advertisements across our website and control panel.',
    '**Third-Party Infrastructure:** We do not own or manage physical data centers. We lease our server nodes, storage, and upstream networking from independent, third-party infrastructure companies. Consequently, network routing disruptions or upstream hardware maintenance are outside of our direct control.',
  ]],
  ['2. Minecraft & Mojang Disclaimer', [
    'Playza is an independent hosting platform and is **not affiliated with, endorsed by, or associated with Mojang AB or Microsoft Corporation**.',
    'You agree to follow the official **Mojang End User License Agreement (EULA)** and Commercial Usage Guidelines on any server you deploy with us.',
    'You are solely responsible for all gameplay rules, monetization, and content on your specific server.',
  ]],
  ['3. Backups and Data Responsibility (Crucial)', [
    'Because Playza is a free service:',
    '**No Automated Backup Guarantees:** We do not provide automated off-site backups, and we cannot guarantee that server files will never be lost in the event of node crashes, drive failures, or system updates.',
    '**Your Responsibility:** You must download and maintain your own local backups of your world saves, plugin configs, and server files via control panel.',
    '**Inactivity Cleanups:** To keep resources available for active players, Playza reserves the right to stop, archive, or remove server instances that remain offline or inactive for prolonged periods.',
    '**No Liability:** Playza is not responsible for lost builds, corrupted world saves, or deleted configurations.',
  ]],
  ['4. DDoS Protection & Network Defense', [
    'Playza provides basic network-level filtering provided by our upstream hosts, but we do **not** offer dedicated enterprise-grade Layer 7 DDoS mitigation.',
    '**Recommended Setup:** We strongly recommend securing your server by routing your domain through dedicated third-party gaming firewalls and proxy networks (such as **TCPShield** or **Cloudflare Spectrum**).',
    '**Node Protection:** If an incoming attack on your server disrupts the experience of other users sharing the same hardware, we reserve the right to temporarily pause or null-route your server instance to preserve stability.',
  ]],
  ['5. Acceptable Use & Community Guidelines', [
    'To keep our nodes fast and fair for everyone, you agree **not** to:',
    '• Run non-Minecraft workloads (e.g., crypto miners, web scraping bots, stressers, Discord bots, or unrelated background scripts).',
    '• Intentionally lag or crash server nodes using infinite loop redstone clocks, chunk-overloading crashers, or mass-entity spawners.',
    '• Host or distribute malicious software, backdoor-infected plugins (such as nulled/leaked resources with malware), phishing pages, or illegal content.',
    '• Attempt to bypass panel limits, access restricted network ports, or interfere with neighboring containers.',
    'Violating these guidelines will result in an immediate and permanent account suspension.',
  ]],
  ['6. Limitation of Liability', [
    'Playza is provided on an **"AS IS"** and **"AS AVAILABLE"** basis. While we strive to maintain high uptime, we make no warranties regarding uninterrupted service. To the fullest extent permitted by law, Playza is not liable for any downtime, loss of data, or damages arising from your use of the service.',
  ]],
  ['7. Contact Us', [
    'Have a question or need to report an issue?',
    '• **Email:** `support@playza.icu`',
    '• **Website:** [https://playza.icu](https://playza.icu)',
  ]],
] as const

function formatText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) return <a key={index} href={link[2]} className="text-amber-600 hover:underline">{link[1]}</a>
    return part
  })
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-900 md:px-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-amber-600 hover:text-amber-700">← Back to Playza</Link>
        <header className="mt-10 border-b border-gray-200 pb-8">
          <p className="font-minecraft text-xs font-bold uppercase tracking-widest text-amber-600">Legal</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-sm text-gray-500">Last Updated: August 28, 2026</p>
        </header>
        <article className="space-y-8 py-10 text-[15px] leading-7 text-gray-600">
          <p>Welcome to <strong>Playza</strong> (<code>playza.icu</code>). We provide free Minecraft server hosting so creators and friends can build and play together without financial barriers.</p>
          <p>By creating an account or running a server on our platform, you agree to the terms below. Please read them carefully—they explain how our free platform operates, what we expect from you, and how we protect our infrastructure.</p>
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
