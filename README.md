# The Verdict Room Studio
### AI-Powered Instagram Content Generation, Creative Studio & Automated Publishing Platform

> *"The Internet Is The Jury."*

**The Verdict Room Studio** is the internal content management and automation platform for an Instagram youth-culture brand. It operates an anonymous, editorial-style online courtroom where Indian Gen Z debates relationships, situationships, loyalty, ego, money, salary gaps, family expectations, and uncomfortable social opinions.

---

## 🏛️ Key Features

- **Multi-Provider LLM Integration**:
  - Primary Engine: **Google Gemini** (`gemini-2.5-flash`).
  - Automatic Cascade Fallback: **OpenRouter** (`deepseek/deepseek-chat` / `meta-llama/llama-3.3-70b-instruct`) triggers seamlessly if Gemini encounters rate limits or errors.
  - Zod structured JSON validation, token tracking, and USD cost recording.
- **Brand Voice & Strategy Engine**:
  - Configurable content pillar mix: **Relationships & Dating (40%)**, **Social Behaviour & Ego (30%)**, **Money & Modern Life (30%)**.
  - Modern Indian Gen Z cultural references with natural conversational Hinglish nuances (*delulu, situationship, cooked, aura, red flag, bhai, yaar*).
  - Strict bans on cliché robotic filler and fake statistical claims (*"99% of people agree"*).
- **6 Recurring Content Formats**:
  1. **Format A — The Case**: Compelling dilemma with 4 distinct defensible verdicts (A, B, C, D).
  2. **Format B — Unpopular Opinion**: Sharp provocative statement with an editorial defense.
  3. **Format C — Anonymous Confession**: Reviewed submissions with automatic PII scrubbing.
  4. **Format D — The People Have Spoken**: Real poll summaries with debate analysis.
  5. **Format E — Aura Tax**: Behavioral penalty or reward audit (-1000 / +1000 Aura).
  6. **Format F — Two Sides**: Comparative split-panel contrasting Perspective A vs B.
- **Deterministic 1080 × 1350 px Creative Studio**:
  - Exact 4:5 Instagram Feed Canvas with high-contrast dark luxury aesthetics.
  - 5 visual templates: *The Courtroom Flagship*, *Unpopular Opinion*, *Aura Tax*, *Two Sides*, and *Multi-Slide Carousel*.
  - Live in-browser interactive editor with instant SVG & PNG download.
  - Multi-slide carousel composer with per-slide editing.
- **Content Calendar & Adaptive Scheduler**:
  - 5 daily publishing slots configured in `Asia/Kolkata` (IST) timezone.
  - 300-second (5 minute) rate-limit spacing to protect Instagram accounts against spam flags.
  - Atomic job claiming, exponential backoff retries, and reboot recovery.
- **Official Meta Instagram Graph API v21.0**:
  - Official container creation, status polling, and feed publishing.
  - Multi-slide carousel container creation and dispatch.
  - Supported insights telemetry (reach, impressions, likes, comments, shares, saves).
  - Safe Demo/Mock mode when live Meta credentials are not yet configured.
- **Automated Content Moderation**:
  - Automated regex and keyword filters for Indian PII (+91 phone numbers, Aadhaar IDs, emails, personal handles).
  - Defamation and targeted harassment blocking.
- **Operational Controls & Governance**:
  - Prominent master **Emergency Stop Kill-Switch** to immediately freeze all outbound publishing.
  - Human-in-the-loop editorial approval gate.
  - Audit logs tracking every AI generation, editorial edit, and publication event.
  - System health diagnostics measuring DB latency and background worker heartbeat.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+

### 2. Installation
```bash
git clone <repo-url>
cd genz-bot
npm install
```

### 3. Initialize Database & Seed Content
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Automated Test Suite
```bash
npm test
```
*Executes all 17 integration tests covering moderation, creative templates, mock publishing, scheduler idempotency, and emergency kill-switch.*

### 5. Start Development Server & Background Worker

**Terminal 1 (Web Dashboard):**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default Owner Credentials:**
- Email: `owner@theverdictroom.internal`
- Password: `Verdict@2026!`

**Terminal 2 (Background Publishing Worker):**
```bash
npm run worker
```

---

## 🐳 Production Deployment via Docker Compose

```bash
docker compose up -d --build
docker compose exec web npx prisma db push
docker compose exec web npx prisma db seed
```

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for complete details on PostgreSQL, Redis, PM2, and Nginx.

---

## 📚 Documentation Reference

- [Meta & Instagram Graph API Guide](docs/META_GRAPH_SETUP.md)
- [AI Provider & Fallback Setup](docs/AI_PROVIDER_SETUP.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Troubleshooting & FAQ](docs/TROUBLESHOOTING.md)

---

## ⚖️ Brand Concept

**The Verdict Room**
- **Tagline**: *"The Internet Is The Jury."*
- **Aesthetic**: Premium dark editorial courtroom with deep crimson accents, sharp vector typography, and jury verdict stamps.
- **Audience**: Indian Gen Z (18–26).
