/** @type {import('next').NextConfig} */

function originOf(url) {
    try {
        return url ? new URL(url).origin : '';
    } catch {
        return '';
    }
}

// Derive origins from URLs so CSP stays tight.
const UMAMI_ORIGIN = originOf(process.env.NEXT_PUBLIC_UMAMI_SRC);
const SENTRY_ORIGIN = originOf(process.env.NEXT_PUBLIC_SENTRY_DSN);

// The Deepgram proxy WebSocket lives on a different subdomain. Add both
// wss:// and https:// variants to connect-src so the browser allows it.
const WS_URL = process.env.NEXT_PUBLIC_API_WS_URL || '';
const WS_ORIGIN = WS_URL
    ? WS_URL.replace(/^ws/, 'http').replace(/\/$/, '').split('/').slice(0, 3).join('/')
    : '';
const WS_WSS = WS_ORIGIN ? WS_ORIGIN.replace(/^http/, 'ws') : '';

const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    // wasm-unsafe-eval targets WASM runtimes specifically; unsafe-eval kept for
    // Sentry error reporting compat.
    "'wasm-unsafe-eval'",
    "'unsafe-eval'",
    'https://js.stripe.com',
    'https://static.cloudflareinsights.com',
    // MediaPipe ships its WASM loader from jsDelivr.
    'https://cdn.jsdelivr.net',
    // Self-hosted analytics relay
    'https://analytics.daintytrading.com',
    UMAMI_ORIGIN,
    // EveryRing embeddable chat widget script
    'https://everyring.ai',
].filter(Boolean).join(' ');

const connectSrc = [
    "'self'",
    'https://api.deepgram.com',
    'wss://api.deepgram.com',
    'https://api.stripe.com',
    'https://api.openai.com',
    // MediaPipe fetches WASM + the face-landmark model at runtime.
    'https://cdn.jsdelivr.net',
    'https://storage.googleapis.com',
    // FastAPI WebSocket relay (Deepgram proxy).
    WS_ORIGIN,
    WS_WSS,
    // Self-hosted analytics relay
    'https://analytics.daintytrading.com',
    UMAMI_ORIGIN,
    SENTRY_ORIGIN,
    // EveryRing embeddable chat widget's API calls
    'https://everyring.ai',
].filter(Boolean).join(' ');

const workerSrc = ["'self'", 'blob:', 'https://cdn.jsdelivr.net'].join(' ');

const securityHeaders = [
    // HSTS: instruct browsers to always use HTTPS. Qualys requires this for A grade.
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
    },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(self), geolocation=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com")',
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self' https://checkout.stripe.com",
            "frame-ancestors 'none'",
            `script-src ${scriptSrc}`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "media-src 'self' blob:",
            `connect-src ${connectSrc}`,
            "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
            `worker-src ${workerSrc}`,
            "object-src 'none'",
            "upgrade-insecure-requests",
        ].join('; '),
    },
];

const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                source: '/audio/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            {
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
                    { key: 'Service-Worker-Allowed', value: '/' },
                ],
            },
        ];
    },
};

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { withSentryConfig } = require('@sentry/nextjs');
    module.exports = withSentryConfig(nextConfig, {
        silent: true,
        // No auth token → webpack plugin skips source map upload, which is
        // what we want for a self-hosted GlitchTip instance.
        dryRun: !process.env.SENTRY_AUTH_TOKEN,
        hideSourceMaps: true,
        disableLogger: true,
    });
} else {
    module.exports = nextConfig;
}
