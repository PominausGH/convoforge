import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ConvoForge',
        short_name: 'ConvoForge',
        description:
            'Daily AI communication coaching grounded in Carnegie principles.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'portrait',
        categories: ['education', 'productivity', 'lifestyle'],
        icons: [
            { src: '/icon', sizes: '64x64', type: 'image/png' },
            { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
            { src: '/icon-192', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512', sizes: '512x512', type: 'image/png' },
            { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    }
}
