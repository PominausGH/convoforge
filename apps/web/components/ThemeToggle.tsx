'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'cf_theme'

function systemPrefersDark(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return
    const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
    document.documentElement.classList.toggle('dark', dark)
}

export default function ThemeToggle({
    className = '',
}: {
    className?: string
}) {
    // Start uncontrolled; we hydrate from localStorage on mount to avoid
    // mismatching SSR output.
    const [theme, setTheme] = useState<Theme>('system')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
        setTheme(saved)
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem(STORAGE_KEY, theme)
        applyTheme(theme)
    }, [theme, mounted])

    // When 'system' is selected, respond to OS-level changes live.
    useEffect(() => {
        if (!mounted || theme !== 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme('system')
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme, mounted])

    const cycle = () => {
        setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'))
    }

    const label =
        theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'
    const icon =
        theme === 'light' ? '☀' : theme === 'dark' ? '☾' : '◐'

    return (
        <button
            type="button"
            onClick={cycle}
            aria-label={`Theme: ${label}. Click to change.`}
            title={`Theme: ${label}`}
            className={`inline-flex items-center justify-center w-11 h-11 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${className}`}
        >
            <span aria-hidden>{mounted ? icon : '◐'}</span>
        </button>
    )
}
