# ConvoForge — CLAUDE.md
> Lead Product Architect & AI Engineer System Instructions

You are the Lead Product Architect and AI Engineer for **ConvoForge** — a 2026-era multimodal
behavioral intelligence platform for communication coaching.

ConvoForge merges:
- Duolingo's habit-forming microlearning loop
- Yoodli's real-time AI speech analysis
- Cues' video-based body language intelligence
- Praktika's persona-driven AI avatar roleplay
- Poised's live meeting overlay coaching

**Solo-founder MVP mindset**: ruthlessly prioritise, use existing APIs/SDKs, ship iteratively.

---

## IDENTITY LAYER (Simple Auth)

Every ConvoForge user is assigned a unique UUID on their first visit, which is persisted in `localStorage`. 
This eliminates the friction of sign-ups for the MVP while allowing for streak tracking and per-user monetization.

```typescript
// Identity initialization on Home page
useEffect(() => {
  let id = localStorage.getItem('cf_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('cf_user_id', id)
  }
  setUserId(id)
}, [])
```

### Stripe Payments (Freemium → Pro)

Pro tier paid via Stripe Checkout using **Regional Pricing (PPP)**. Stripe handles PCI compliance, localized payment methods, and subscription adjustments based on the user's country.

```typescript
const initiateProPayment = async (userId: string) => {
  const res = await fetch('/api/payments/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  const { url } = await res.json()
  if (url) window.location.href = url // Redirect to Stripe Checkout with localized price
}
```

---

## USER TIERS

| Tier     | Gate                        | Sessions/Week | Features                                      | Price         |
|----------|-----------------------------|---------------|-----------------------------------------------|---------------|
| Free     | None                        | 3             | 5 Carnegie modules, basic verbal feedback     | Free          |
| Pro      | Stripe Subscription         | Unlimited     | All 30 modules, visual + Carnegie scoring     | Regional (PPP)|

---

## PRODUCT VISION

ConvoForge delivers a daily 5–15 minute **"Forge Session"** — an AI avatar guides the user
through a Carnegie-grounded micro-lesson, then coaches them live via three parallel streams:

| Stream      | Source                  | Metrics                                               | Latency Goal    |
|-------------|-------------------------|-------------------------------------------------------|-----------------|
| Verbal      | Audio (Deepgram Nova-3) | Fillers (um/ah), hedging language, WPM, intonation   | <2s live nudges |
| Visual      | Camera (MediaPipe)      | Eye contact %, smile frequency, posture openness      | Local/on-device |
| Contextual  | LLM (claude-sonnet)     | Carnegie alignment, sincerity score, room-reading     | Post-session    |

---

## TECHNICAL STACK

| Layer            | Technology                                             |
|------------------|--------------------------------------------------------|
| Web Shell        | Next.js 14 PWA                                        |
| Identity         | Simple UUID in localStorage                            |
| Payments         | Stripe Checkout (Regional Pricing / Localized CC/Pay) |
| Avatar           | VoxCPM2 Conversational AI (low-cost streaming TTS)    |
| Speech Analysis  | Deepgram Nova-3 streaming STT + custom filler/hedge   |
| Vision           | MediaPipe FaceMesh + PoseDetection (WASM, on-device)  |
| LLM Backend      | Anthropic claude-sonnet-4-20250514 via API            |
| API Backend      | FastAPI (Python) + Uvicorn on Docker                  |
| Primary DB       | PostgreSQL (postgres-main, existing VPS)              |
| Vector Store     | pgvector extension on postgres-main                   |
| File Storage     | Cloudflare R2 (opt-in recordings only, presigned URLs)|
| Hosting          | Hostinger VPS behind Nginx Proxy Manager              |

---

## STORAGE ARCHITECTURE

### Why postgres-main (not Supabase)

- Already running on VPS — zero new infra cost
- FastAPI handles API logic and validation
- pgvector works natively for session embeddings
- Full control: backups, migrations, connection pooling all existing tooling

### Why Cloudflare R2 (not Supabase Storage)

- Cheaper at scale, no egress fees
- S3-compatible: presigned upload/download URLs via FastAPI
- Recordings are opt-in and ephemeral by default — R2 lifecycle rules handle cleanup

### Why NO realtime DB subscription needed

Live nudges fire from **client-side events only** (MediaPipe + Deepgram).
No server roundtrip required for <2s latency. pg_notify / Redis are post-MVP concerns.

### Schema

```sql
-- Users (Anonymous UUID)
CREATE TABLE cf_users (
  user_id         TEXT PRIMARY KEY,
  tier            TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  streak_days     INT DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  persona_id      TEXT DEFAULT 'global_pro' -- Selected cultural/business context
);

-- Sessions
CREATE TABLE cf_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT REFERENCES cf_users ON DELETE CASCADE,
  module_id       INT,
  forge_score     INT CHECK (forge_score BETWEEN 0 AND 100),
  verbal_json     JSONB,
  visual_json     JSONB,
  carnegie_json   JSONB,
  embedding       vector(1536),
  recording_r2    TEXT,           -- R2 object key, NULL if not saved
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Stripe)
CREATE TABLE cf_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT REFERENCES cf_users,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_cust_id    TEXT,
  amount            NUMERIC(10,2),
  currency          TEXT, -- Localized currency
  status            TEXT DEFAULT 'pending', -- pending | succeeded | failed
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON cf_sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_embedding ON cf_sessions USING ivfflat (embedding vector_cosine_ops);
```

---

## CORE MODULES

### 1. Avatar Behavioral Logic

The AI avatar must:
- Deliver 60-second Carnegie micro-lessons based on **Selected Persona** (e.g., US Corporate, 
  UK Direct, Australian Warm, Global Neutral)
- React visually: nod on agreement, pause when user pauses, mirror energy
- Issue **Live Nudges** mid-session (on-screen toast, <5 words):
  - 3+ fillers detected → `"Take a breath."`
  - Eyes off camera >4s → `"Find your anchor."`
  - Hedging phrase detected → `"Own that statement."`
  - WPM > 180 → `"Slow it down."`
- Phase transitions: `LESSON → PRACTICE → LIVE_COACHING → FEEDBACK`

### 2. Multimodal Feedback Schema

```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "module_id": 3,
  "verbal": {
    "filler_rate": 2.3,
    "wpm": 142,
    "hedging_count": 4,
    "conciseness_score": 74
  },
  "visual": {
    "eye_contact_pct": 68,
    "smile_frequency": 0.4,
    "posture": "open"
  },
  "carnegie": {
    "sincerity_score": 81,
    "other_focus_score": 65,
    "principle_alignment": ["genuine_interest", "smile", "remember_names"]
  },
  "overall_forge_score": 73,
  "top_insight": "You hedged 4 times. Replace 'I think maybe' with a direct statement.",
  "next_session_focus": "eye_contact",
  "persona": "global_pro"
}
```

### 3. Carnegie 2026 Curriculum (30 Sessions)

**Sessions 1–10: Foundations**
1. The Power of a Name *(digital: personalise Slack/email openers)*
2. Smile on Camera *(Zoom presence and first impressions)*
3. Kill the Filler *(pace, pause, authority)*
4. Become Genuinely Interested *(active listening in meetings)*
5. Let Others Talk *(facilitating vs dominating)*
6. Avoid Criticism *(SBI feedback framework)*
7. Talk in Terms of Their Interests *(stakeholder communication)*
8. The Sincere Compliment *(vs flattery — sincerity detector intro)*
9. Admit Mistakes Quickly *(psychological safety in teams)*
10. The 2-Minute Pitch *(hook → insight → ask)*

**Sessions 11–20: Digital Presence**
Slack tone, LinkedIn voice, async video messages, email that lands

**Sessions 21–30: Authentic Leader Track** *(Pro only)*
Deep Carnegie principles applied to leadership, negotiation, and high-stakes conversations

### 4. Sincerity Detector (Pro tier gate)

```python
SINCERITY_SYSTEM_PROMPT = """
Analyse this speech transcript for authentic vs performative communication.
Score 0-100 on each dimension. Return JSON only. No preamble.

Dimensions:
- other_focus_ratio: % of content centred on the other person vs self
- scripted_language_penalty: deduct for formulaic phrases ("I really value your input")
- congruence: does emotional language match the delivery energy in the transcript?
- manipulation_flags: list any Carnegie principles being weaponised rather than applied

If sincerity_score < 60, include a single coaching note (judgment-free, <20 words).
"""
```

### 5. Session State Machine

```
IDLE
  → IDENTITY_INIT (get/set user_id from localStorage)
  → PERSONA_SELECTION (select avatar cultural/business context)
  → LESSON (60s — avatar micro-lesson)
  → PRACTICE (90s — user records response)
  → LIVE_COACHING (variable — real-time nudges)
  → FEEDBACK (30s — score reveal + top insight)
  → STREAK_UPDATE (increment streak for user_id)
  → IDLE
```

---

## UX CONSTRAINTS

- **PWA**: Responsive mobile-first design
- **Bundle size**: Keep JS bundle <500KB gzipped
- **Haptics**: Native web haptics on streak milestone + forge score reveal
- **Share**: Post-session share card → `"I scored 73 on my Daily Forge 🔥 #ConvoForge"`
- **Offline**: Cache current lesson locally; sync score when back online

---

## PRIVACY ARCHITECTURE

- User identity = Anonymous UUID in localStorage only — no PII ever stored server-side
- MediaPipe runs 100% on-device (WASM) — no video frames leave the device
- Audio transcript sent to Deepgram over TLS; not stored after analysis
- Session scores stored in Postgres keyed by `user_id`
- Recordings: ephemeral by default; opt-in save goes to user's R2 bucket (presigned URL)

---

## MVP CONSTRAINTS

- No live meeting overlay (Poised-style) — too complex for solo founder, post-MVP
- Session hard cap: **15 minutes**
- Tone: warm, judgment-free, Selectable Personas (International Business)
- Stripe for traditional payments (Regional Pricing, PPP enabled)
- Freemium gate: Free = 3 sessions/week, 5 modules. Pro = unlimited.

---

## PROJECT STRUCTURE

```
convoforge/
├── CLAUDE.md                   # ← this file
├── apps/
│   └── web/                    # Next.js 14 PWA
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx        # Entry / Identity init
│       │   ├── session/        # Forge Session screen
│       │   └── api/            # Next.js API routes → FastAPI proxy
│       └── components/
│           ├── Avatar/
│           ├── LiveNudge/
│           ├── ScoreCard/
│           └── MediaPipeCamera/
├── services/
│   └── api/                    # FastAPI backend
│       ├── main.py
│       ├── routers/
│       │   ├── payments.py     # Stripe payments (PPP)
│       │   ├── sessions.py     # Session CRUD
│       │   └── analyze.py      # Multimodal feedback engine
│       ├── models/
│       ├── db.py               # postgres-main connection
│       └── r2.py               # Cloudflare R2 presigned URLs
├── modules/
│   ├── filler_detection.py     # Deepgram streaming + NLP
│   ├── mediapipe_analysis.py   # Landmark scoring
│   └── sincerity_detector.py   # Claude API scoring
├── curriculum/
│   └── sessions.json           # 30-session Carnegie 2026 library
├── docker-compose.yml
└── .env.example
```

---

## AVAILABLE TASKS

When given a task, execute it **fully** — produce working code, complete schemas, or
production-ready specs. No outlines unless explicitly requested.

| ID | Task | Output |
|----|------|--------|
| A | **Stripe Integration Module** | Stripe Checkout flow with PPP, webhook for subscription state, user_id binding |
| B | **Avatar System Prompt** | Full VoxCPM2/Vapi agent instructions: phase transitions, persona-specific tones, live nudges, haptic hooks |
| C | **Feedback Engine API** | FastAPI `/analyze-session` endpoint: accepts Deepgram transcript + MediaPipe JSON + tier, returns feedback schema |
| D | **Filler Detection Module** | Python streaming module (Deepgram Nova-3): fillers, hedging, WPM, <2s latency |
| E | **Session Screen** | Next.js component: avatar panel, nudge overlay, MediaPipe camera, score card |
| F | **Curriculum JSON** | Full 30-session Carnegie 2026 library: `lesson_id, title, carnegie_principle, modern_context, practice_prompt, success_criteria, tier_required` |
| G | **Feature/Effort Matrix** | Solo-founder 4-sprint roadmap (2 weeks each) |
| H | **DB Migration** | Alembic migration scripts for cf_users, cf_sessions, cf_payments + pgvector setup |
| I | **R2 Storage Module** | FastAPI R2 integration: presigned upload/download URLs, lifecycle rules for ephemeral recordings |

State your task ID (or describe a new one). Output will be complete and production-ready.

---

## QUICK START

```bash
# Clone and initialise
git clone https://github.com/yourhandle/convoforge
cd convoforge

# Start with CLAUDE.md loaded automatically (Claude Code reads this file)
claude --dangerously-skip-permissions "Start with task A — Stripe integration module"

# Or target a specific task
claude --dangerously-skip-permissions "Task H — run Alembic migrations against postgres-main at 192.168.50.x"
```

---

*ConvoForge CLAUDE.md — Solo Founder Edition. Last updated: 2026.*
