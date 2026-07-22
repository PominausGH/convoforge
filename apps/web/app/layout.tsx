import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC
const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_ID

const inter = Inter({ subsets: ['latin'] })

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://convoforge.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ConvoForge — Daily AI communication coaching',
    template: '%s · ConvoForge',
  },
  description:
    'Master communication with a daily 5-minute AI-coached Forge Session. Carnegie-grounded lessons, real-time verbal and visual feedback.',
  applicationName: 'ConvoForge',
  keywords: [
    'communication coaching',
    'public speaking',
    'Dale Carnegie',
    'AI coaching',
    'speech coaching',
    'body language',
  ],
  authors: [{ name: 'ConvoForge' }],
  openGraph: {
    type: 'website',
    siteName: 'ConvoForge',
    url: '/',
    title: 'ConvoForge — Daily AI communication coaching',
    description:
      'Carnegie-grounded micro-lessons plus real-time AI feedback on your voice and body language. 5 minutes a day.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConvoForge — Daily AI communication coaching',
    description:
      'Carnegie-grounded micro-lessons plus real-time AI feedback on your voice and body language.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

// Runs before hydration so the correct theme class is on <html> before the
// first paint — no light→dark flash.
const themeInitScript = `(function(){try{
  var s = localStorage.getItem('cf_theme') || 'system';
  var dark = s === 'dark' || (s === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://analytics.daintytrading.com" />
        <link rel="alternate" type="application/rss+xml" title="ConvoForge Blog" href="/blog/rss.xml" />
      </head>
      <body className={`${inter.className} bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}>
        {children}
        <CookieBanner />
        {UMAMI_SRC && UMAMI_ID && (
          <Script
            src={UMAMI_SRC}
            data-website-id={UMAMI_ID}
            strategy="afterInteractive"
            defer
          />
        )}
        <Script
          src="https://analytics.daintytrading.com/script.js"
          data-website-id="115adfa9-2bac-4742-ba57-6e930b1b2752"
          strategy="afterInteractive"
          defer
        />
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{})}`}
        </Script>
        <Script
          src="https://everyring.ai/api/chat/widget.js"
          data-tenant="bright-path-education-mnn43eml"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
