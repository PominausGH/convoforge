import type { Metadata } from 'next'

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    alternates: { canonical: '/forge' },
}

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
