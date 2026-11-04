import Link from 'next/link'
import SupportEmail from '@/components/SupportEmail'

export default function SiteFooter() {
    return (
        <footer className="w-full max-w-6xl mx-auto px-6 py-8 text-xs text-zinc-500 dark:text-zinc-400 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800">
            <div>© {new Date().getFullYear()} ConvoForge</div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                <Link href="/about" className="hover:underline">About</Link>
                <Link href="/curriculum" className="hover:underline">Curriculum</Link>
                <Link href="/blog" className="hover:underline">Blog</Link>
                <Link href="/restore" className="hover:underline">Use on another device</Link>
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <Link href="/terms" className="hover:underline">Terms</Link>
                <SupportEmail className="hover:underline" />
            </div>
        </footer>
    )
}
