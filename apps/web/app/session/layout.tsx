import type { Metadata } from 'next'

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    alternates: { canonical: '/session' },
}

export default function SessionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
