import type { Metadata } from 'next';

// page.tsx is a client component, so route metadata lives here.
export const metadata: Metadata = {
    alternates: { canonical: '/story-lab' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
