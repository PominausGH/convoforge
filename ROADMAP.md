# ConvoForge Roadmap

## 1. Solo-Founder 4-Sprint Roadmap (2 Weeks Each)

### Sprint 1: Identity & Foundation (Weeks 1-2)
- [x] Simple Identity Module (Local UUID)
- [x] PostgreSQL Schema & Alembic Migrations
- [x] FastAPI Core & Router Setup
- [x] Basic Session State Machine (Lesson -> Practice -> Feedback)

### Sprint 2: Multimodal Intelligence (Weeks 3-4)
- [x] Filler & Hedging Detection (Deepgram Streaming)
- [x] Client-side Vision Analysis (MediaPipe WASM)
- [x] Avatar System Prompt & Persona Development
- [ ] Real-time Low-latency TTS Integration (VoxCPM2/Vapi)

### Sprint 3: Monetization & Curriculum (Weeks 5-6)
- [x] Stripe Checkout with PPP support
- [x] Full Carnegie 2026 Curriculum (30 Sessions)
- [ ] User Progress Tracking & Streak System
- [ ] Shareable Post-session Cards

### Sprint 4: Polish & Performance (Weeks 7-8)
- [ ] Cloudflare R2 Ephemeral Recording Lifecycle
- [ ] On-device MediaPipe optimization (JS Bundle < 500KB)
- [ ] Beta Testing & Performance Profiling

---

## 2. Launch Checklist

### Identity & Security
- [ ] Local UUID persistence (localStorage)
- [ ] No PII stored on server
- [ ] Secure backend API with proper CORS and rate limiting

### UX & Branding
- [ ] Clean, minimalist dark mode interface
- [ ] Responsive design for mobile/desktop browsers
- [ ] Smooth transitions between session states

### Performance
- [ ] JS Bundle size < 500KB gzipped
- [ ] Initial load time < 2 seconds
- [ ] Low-latency visual/verbal feedback (< 2s)

### Monetization
- [ ] Regional Pricing (PPP) active for all supported regions
- [ ] Successful flow from App -> Stripe Checkout -> Success callback
- [ ] Webhook for subscription state synchronization
