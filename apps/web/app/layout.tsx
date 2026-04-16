import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import MiniKitProvider from '@/components/providers/MiniKitProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ConvoForge',
  description: 'Multimodal behavioral intelligence platform for communication coaching',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
