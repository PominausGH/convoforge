import { totalLessonsFor } from '@/lib/curriculum'

// Served from a route (not public/llms.txt) so lesson counts come from
// curriculum.json and can't drift from the homepage/JSON-LD again.
export const dynamic = 'force-static'

export function GET() {
    const total = totalLessonsFor('pro')
    const free = totalLessonsFor('free')
    const body = `# ConvoForge

> Daily AI communication coaching. Five-minute, Carnegie-grounded "Forge Session" lessons with real-time verbal and visual feedback.

- Site: https://convoforge.app/
- Pricing: Free (3 sessions/week) + Pro $9/month (unlimited)

## What it is

ConvoForge builds a daily communication-coaching habit through short (five-minute) AI-coached practice sessions ("Forge Sessions"), grounded in Carnegie-style principles, with real-time verbal and visual scoring during practice.

## Pricing (USD)

- **Free** — $0 forever. Three sessions per week, ${free} lessons (Carnegie, Remote & Small Talk), verbal + visual scoring, Forge Score with one insight per session, on-device privacy.
- **Pro** — $9/month, regional pricing via Stripe. Unlimited sessions, all ${total} lessons (including Psychology & High-Stakes scenarios), a Claude-scored sincerity detector, Carnegie alignment and manipulation flags, priority access to new lessons. Early-adopter pricing of $9/month is guaranteed through 2028 for anyone who upgrades now.
- Cancel anytime. Seven-day refund, no questions asked.

## Frequently asked questions

### Do I need to pay to start?
No — the free tier gives three sessions per week with no time limit on how long you stay on it.

### What makes ConvoForge different from generic AI chat practice?
Sessions are grounded in Carnegie-style communication principles, with real-time verbal and visual feedback during the conversation itself, plus a sincerity detector on the Pro tier that flags manipulation vs. genuine communication.
`
    return new Response(body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
