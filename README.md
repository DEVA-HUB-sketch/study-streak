<div align="center">

# Study Streak

### Agentic AI-Powered Academic Intelligence Platform

**Track · Plan · Analyse · Improve · Achieve**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com/atlas)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-orange)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Live Demo](https://study-streak-gamma.vercel.app) ·
[Report Bug](https://github.com/DEVA-HUB-sketch/study-streak/issues) ·
[Request Feature](https://github.com/DEVA-HUB-sketch/study-streak/issues)

</div>

---

## What is Study Streak?

Study Streak is a full-stack **Agentic AI Academic Intelligence Platform** that transforms how college students track, plan, and improve their performance. It goes beyond a study tracker — an autonomous AI agent continuously monitors your study patterns, auto-rebalances timetables, predicts exam scores, detects burnout, and surfaces proactive recommendations every time you open your dashboard.

**What makes it different:**
- A **proactive AI Agent** (not just a chatbot) runs on every dashboard load — reads all MongoDB collections, reasons over the data, and acts (auto-rebalances timetables, updates long-term memory)
- The AI Coach reads your **real MongoDB study history** before generating study plans
- A **GitHub-style annual heatmap** visualises 365 days of study consistency
- **Exam performance analytics** correlate study hours with marks using Recharts
- **Streaming Study Buddy chatbot** powered by session history + agent memory
- **Google OAuth** (flow-aware: login vs signup) + email/password + forgot-password flow
- **14 gamification badges**, ruby rewards, global multi-user leaderboard
- **Subject-aware dropdowns** across all AI features — no manual typing

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Full-stack SSR + API routes |
| **Language** | TypeScript 5 | Type safety end-to-end |
| **Styling** | Tailwind CSS 4 + CSS design tokens | Utility classes + design system |
| **Animations** | Framer Motion | Page transitions, micro-interactions, ripple effects |
| **Charts** | Chart.js · Recharts | Dashboard activity charts · Exam analytics |
| **Database** | MongoDB Atlas + Mongoose ODM | Cloud database + schema modeling |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Stateless sessions + password hashing |
| **OAuth** | Google OAuth 2.0 (custom, no NextAuth) | Social login, flow-aware, production-ready |
| **AI** | Groq SDK — llama-3.3-70b-versatile | All AI features including the agentic pipeline |
| **Email** | Resend | Transactional email (password reset) |
| **Rate Limiting** | MongoDB-backed (serverless-safe) | Brute-force protection on all auth routes |
| **Deployment** | Vercel | Zero-config Next.js hosting |

---

## Feature Overview

### Authentication & Security

| Feature | Details |
|---|---|
| Email + Password | Multi-step signup (Account → Profile → Goals), bcrypt 10 rounds |
| Google OAuth | Custom OAuth 2.0 flow — **login flow** only lets existing accounts in; **signup flow** creates new accounts. `APP_URL` (server-only env var) used instead of `NEXT_PUBLIC_APP_URL` to prevent build-time baking issues on Vercel |
| JWT sessions | HTTP-only cookie, 7-day TTL, `sameSite: lax`, `secure: true` in production |
| Forgot password | SHA-256 hashed reset token, 1-hour expiry, Resend email with branded HTML template |
| Reset password | Single-use token via `updateOne` (bypasses Mongoose `select:false` bug) |
| Route protection | `proxy.ts` (Next.js 16 Proxy) guards all 15+ authenticated routes |
| Session expiry | `SessionGuard` patches `globalThis.fetch` — auto-redirects to `/login` on 401 |
| Rate limiting | MongoDB-backed: login 5/15min, register 3/hr, forgot-password 3/15min (works in Vercel serverless) |
| IDOR prevention | Every mutation verifies `doc.userId === auth.userId` → 403 Forbidden |
| OAuth CSRF | 16-byte random state + `secure: isProduction` cookies validated on callback |
| Mass assignment | Profile PATCH uses explicit whitelist; profile fields include targetCGPA, preferredStudyHours |

---

### AI Agent System (Proactive — Not Reactive)

The AI Agent is the core innovation. It runs **automatically on every dashboard load**, not when the user clicks a button.

#### How the Agent Works

```
Dashboard loads
     │
     ▼
GET /api/agent/state ──── Fresh cache? ──── YES → Render instantly (0ms Groq call)
     │
     NO (stale or first visit)
     │
     ▼
POST /api/agent/run
     ├── StudySession.find(userId)        ─┐
     ├── ExamResult.find(userId)          ─┤ All collections queried in parallel
     ├── Subject.find(userId)             ─┤
     ├── User.findById(userId)            ─┤
     ├── PinnedTimetable.findOne()        ─┤
     └── AgentMemory.findOne()            ─┘
          │
          ▼
     Single Groq call (llama-3.3-70b-versatile)
     with comprehensive data block
          │
          ▼
     3 AUTONOMOUS ACTIONS:
     1. Auto-rebalance PinnedTimetable in MongoDB (if exam scores show weak subject)
     2. Update AgentMemory (weak/strong subjects, patterns, consistency)
     3. Cache AgentState for 3 hours
          │
          ▼
     AIMissionCard: mission, warnings, reminder, next action
     AgentPanel:    confidence score, predicted exam grade, burnout level
```

#### Agent Features

| Feature | Output |
|---|---|
| Daily Mission | Proactive study directive citing actual hours and streak |
| Auto Timetable Rebalancing | Detects low exam scores + low study allocation → rewrites timetable slots in MongoDB automatically |
| Exam Prediction | Predicted score (0-100), grade, confidence level from study pace + exam history |
| Burnout Detection | None/Low/Medium/High/Critical with specific recovery advice |
| Study Reminder | Fires when >30min behind today's planned goal |
| Risk Assessment | Low/Medium/High/Critical based on pace vs exam date |
| Weekly Pattern | Detects week-over-week trends from session data |
| Long-term Memory | `AgentMemory` stores preferred study time, learning style, weak subjects across sessions |
| Goal Progress | Tracks user-set goals (stored in `AgentMemory.activeGoals`) |
| Agent Cache | 3-hour cache — max ~8 Groq calls/day per user |

#### AI Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/agent/run` | POST | Main pipeline — fetch all data → Groq → act → cache |
| `/api/agent/state` | GET | Return fresh cache or signal "stale, please rerun" |
| `/api/agent/memory` | GET/PATCH | Long-term student memory management |
| `/api/ai` | POST | Study plan generation with real data + agent memory injection |
| `/api/ai/chat` | POST | Streaming Study Buddy with session data + agent memory |
| `/api/performance-analysis` | POST | Deep AI academic analysis (sessions + exam history) |
| `/api/resources` | GET/POST | AI learning resource recommendations with weak-subject context |
| `/api/challenges/generate` | POST/PUT | MCQ test generation with **auto-difficulty calibration from past scores** |

---

### Study Management

- **Sessions** — `/sessions` page with filters (Today/Week/Month/Subject) + full-text search
- **Subjects** — Dashboard widget for instant add/edit/delete; also at `/subjects`. Connected to session form, test generator, exam tracker, resources via shared `SubjectSelect` component
- **Subject sync** — Creating/editing/deleting sessions auto-updates `totalMinutes` + `sessionCount` via MongoDB `$group` aggregation at read time
- **Session form** — Dropdown with user's subjects + "Enter manually" option (custom input stays visible while typing — fixed SessionForm bug)

---

### Gamification

| System | Details |
|---|---|
| **Rubies** | 1/session · +10 for 7-day streak · +50 for 30-day · +100 for 100h |
| **Streaks** | Custom algorithm with 1-day grace period |
| **14 Badges** | First Step → 200h Legend → Dedicated Scholar (500h) — auto-unlocked |
| **Daily Challenges** | Deterministic by date hash; live progress from sessions |
| **Leaderboard** | Global rankings via MongoDB `$group` across ALL users (filters non-ObjectId userIds) |
| **Knowledge Brain** | Animated SVG liquid-fill brain (dynamic import — fixes SSR hydration mismatch) |

---

### Study Analytics

- **Study Heatmap** (`/progress`) — GitHub-style 52×7 contribution graph with hover tooltip
- **Consistency Score** — 0-100: active days (50%) + streak (30%) + session volume (20%)
- **AI Insight Card** — Rule-based daily insight, 5 types (warning/achievement/improvement/suggestion/motivation)
- **Analytics Widgets** — Most Studied Subject, Weakest Subject, Exam Readiness ring (animated Recharts)
- **Monthly Bars** — 6-month consistency chart
- **Subject Comparison** — Active days + hours per subject with colour-coded bars

---

### Exam Performance (`/exams`)

- Add exam results: subject (dropdown), name, date, marks, total marks, study hours before exam
- Auto-computed percentage + grade (O/A+/A/B/C/F)
- **Three Recharts charts**: Subject averages (Bar), Marks trend (Line), Study hours vs score (Scatter)
- AI Academic Analysis modal with performance report, weak subjects, study efficiency, predictions
- History table with ownership-verified delete

---

### AI Test Generator (`/challenges`)

- Subject from user's library (SubjectSelect dropdown), custom topic, difficulty, question count (5/10/15)
- **Auto-difficulty calibration** — if past avg score ≥80%, automatically upgrades to Hard
- Groq generates validated MCQ (4 options + explanation)
- Test UI: numbered dot tracker, A/B/C/D buttons, Previous/Next
- Results: animated score ring, answer review with green/red, explanations
- History in MongoDB; shown on form page

---

### AI Learning Resources (`/resources`)

- Subject from user's library + topic + difficulty + goal
- Groq selects from **hardcoded catalog** (19 YouTube channels + 15 websites) — no hallucinated URLs
- User's **least-studied subjects injected automatically** from session data
- Output: YouTube channels, websites, study strategy, roadmap, quick tips
- History saved to MongoDB

---

### Profile & Settings

**Profile (`/profile`):**
- Edit: name, college, department, academic year, goals, target exam, **target CGPA (0-10)**, **preferred study hours**
- Rank badges (Beginner → Scholar → Master → Legend)
- Full achievement grid embedded

**Settings (`/settings`):**
- Change password (blocked with explanation for Google OAuth users)
- Notification toggles (UI)
- Danger zone: sign out with confirmation

---

### Dashboard Layout

```
WelcomeHero
AIMissionCard          ← Agentic: auto-loads, triggers Groq, shows skeleton while running
AIInsightCard          ← Rule-based: instant, no Groq
PinnedTimetableWidget  ← Full plan modal + expand slots + review flow
StatsGrid              ← Animated counters
SubjectsWidget         ← Inline add/edit/delete, connected to all features
AnalyticsWidgets       ← Most studied, weakest, readiness
30-Day Activity Chart
Session Form + Session List (with filters + search)

Right Panel:
  AgentPanel           ← Confidence ring, predicted score, burnout, patterns
  InsightsPanel        ← Leaderboard, badges, daily challenge
```

---

## Security Summary

| Threat | Mitigation |
|---|---|
| Password storage | bcrypt, 10 salt rounds |
| Session hijacking | HTTP-only JWT cookie, `sameSite: lax`, `secure: true` in production |
| IDOR on all mutations | Ownership check → 403 Forbidden |
| Brute force | MongoDB-backed rate limiting on all auth endpoints |
| Google OAuth CSRF | 16-byte state cookie with `secure: isProduction` |
| Google login for unregistered users | Flow-aware: login rejects unknown emails |
| OAuth build-time URL bug | `APP_URL` (server-only) used instead of `NEXT_PUBLIC_APP_URL` |
| Password reset token | SHA-256 hashed in DB; raw token in email only; 1-hour expiry |
| `select:false` field write bug | All password/resetToken writes use `updateOne/$set` not `document.save()` |
| Mass assignment | Profile PATCH has explicit field whitelist |
| User enumeration | Forgot-password always returns `{ success: true }` |
| Stale JWT after logout | Cookie cleared client-side; `SessionGuard` catches 401s globally |

---

## Database Models

| Model | Key Fields | Notes |
|---|---|---|
| `User` | name, email, password (select:false), googleId, authProvider, college, department, academicYear, goals, examTarget, targetCGPA, preferredStudyHours, resetToken (select:false), resetTokenExpiry | Password optional for Google users |
| `StudySession` | userId, subject, duration, date, notes, completed | Stats always computed fresh via aggregation |
| `Subject` | userId, name, color, icon | Stats computed via `$group` aggregation at read time |
| `DailyChallenge` | userId, challengeId, date, target, unit, rubyReward | Deterministic pick by date hash |
| `PinnedTimetable` | userId (unique), course, subjects, examDate, timetable[], weeklyRoadmap[], reviewed, reviewRating, reviewText | Auto-rebalanced by AI Agent |
| `ExamResult` | userId, subject, examName, examDate, marksObtained, totalMarks, percentage, grade, studyHoursBeforeExam | Grade auto-computed |
| `ResourceRecommendation` | userId, subject, topic, difficulty, goal, youtubeChannels[], websites[], studyStrategy[], roadmap[], quickTips[] | History for revisiting |
| `TestResult` | userId, subject, topic, difficulty, questions[], score, totalQuestions, percentage | Stores full Q&A for review |
| `AgentState` | userId, mission, priority, studyGoal, suggestedDuration, warnings[], predictedExamScore, predictedGrade, riskLevel, confidenceScore, agentStatus, burnoutLevel, timetableRebalanceNeeded, timetableAdjustments[], generatedAt, validUntil | 3-hour cache per user |
| `AgentMemory` | userId, preferredStudyTime, learningStyle, weakSubjects[], strongSubjects[], targetCGPA, examGoals, avgSessionDuration, consistencyPattern, activeGoals[], conversationSummaries[] | Long-term persistent memory |
| `RateLimit` | key, count, resetAt | TTL-indexed, MongoDB-backed |

---

## Complete API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account (rate limited) |
| POST | `/api/auth/login` | ❌ | Email + password login (rate limited) |
| POST | `/api/auth/logout` | ❌ | Clear JWT cookie |
| GET | `/api/auth/me` | ✅ | Current authenticated user |
| GET | `/api/auth/google` | ❌ | Initiate Google OAuth (`?flow=login\|signup`) |
| GET | `/api/auth/google/callback` | ❌ | Google OAuth token exchange + user creation |
| POST | `/api/auth/forgot-password` | ❌ | Send reset email (rate limited) |
| POST | `/api/auth/reset-password` | ❌ | Validate token + update password |
| PATCH | `/api/profile` | ✅ | Update profile (8 whitelisted fields) |
| PATCH | `/api/settings` | ✅ | Change password |

### Study Data

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/sessions` | ✅ | List / create sessions (syncs subject stats) |
| GET/PUT/DELETE | `/api/sessions/[id]` | ✅ | Read / update / delete (IDOR protected, syncs subject stats) |
| GET/POST | `/api/subjects` | ✅ | List with live aggregated stats / create |
| PUT/DELETE | `/api/subjects/[id]` | ✅ | Update / delete (IDOR protected) |
| GET/POST/PUT/DELETE | `/api/exams` + `/api/exams/[id]` | ✅ | Exam results CRUD |

### AI Agent

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/agent/run` | ✅ | Full agentic pipeline — fetch all data → Groq → act → cache |
| GET | `/api/agent/state` | ✅ | Return 3-hour cache or signal stale |
| GET/PATCH | `/api/agent/memory` | ✅ | Long-term memory read / update |

### AI Features

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai` | ✅ | Study plan (MongoDB data + agent memory → Groq) |
| POST | `/api/ai/chat` | ✅ | Streaming chatbot (session data + agent memory) |
| POST | `/api/performance-analysis` | ✅ | Deep academic analysis (sessions + exam history) |
| GET/POST | `/api/resources` | ✅ | Learning resource recommendations (weak subjects auto-injected) |
| POST/PUT | `/api/challenges/generate` | ✅ | MCQ generation (auto-difficulty) / save result |
| GET | `/api/challenges/history` | ✅ | Past test results |

### Analytics & Gamification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics` | ✅ | Full analytics: consistency, burnout, next badge, insight |
| GET | `/api/stats` | ✅ | Streaks, rubies, chart data, badge unlock status |
| GET | `/api/leaderboard` | ✅ | Global rankings via MongoDB `$group` aggregation |
| GET | `/api/challenges` | ✅ | Today's daily challenge + live progress |
| GET/POST/PATCH/DELETE | `/api/timetable` | ✅ | Pinned plan CRUD (auto-rebalanced by agent) |

---

## Project Structure

```
study-streak/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   ├── run/route.ts          # Core agentic pipeline
│   │   │   ├── state/route.ts        # Cache read / stale signal
│   │   │   └── memory/route.ts       # Long-term memory CRUD
│   │   ├── ai/
│   │   │   ├── route.ts              # Study plan (+ agent memory injection)
│   │   │   └── chat/route.ts         # Streaming chatbot (+ agent memory)
│   │   ├── analytics/route.ts
│   │   ├── auth/
│   │   │   ├── google/route.ts       # OAuth initiation (APP_URL, secure cookies)
│   │   │   ├── google/callback/route.ts # OAuth callback (7-step logging)
│   │   │   ├── forgot-password/route.ts
│   │   │   ├── reset-password/route.ts
│   │   │   ├── login/route.ts        # Rate limited
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── register/route.ts     # Rate limited
│   │   ├── challenges/
│   │   │   ├── route.ts
│   │   │   ├── generate/route.ts     # Auto-difficulty calibration
│   │   │   └── history/route.ts
│   │   ├── exams/[id]/route.ts
│   │   ├── leaderboard/route.ts      # Global $group aggregation
│   │   ├── performance-analysis/route.ts
│   │   ├── profile/route.ts
│   │   ├── resources/route.ts        # Weak subject auto-injection
│   │   ├── sessions/[id]/route.ts
│   │   ├── settings/route.ts
│   │   ├── stats/route.ts
│   │   ├── subjects/[id]/route.ts
│   │   └── timetable/route.ts
│   ├── (pages)/
│   │   ├── ai/page.tsx               # AI Study Coach
│   │   ├── challenges/page.tsx       # AI Test Generator
│   │   ├── dashboard/page.tsx        # Main dashboard (AIMissionCard + AgentPanel)
│   │   ├── exams/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── login/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── progress/page.tsx         # Study Heatmap
│   │   ├── reset-password/page.tsx
│   │   ├── resources/page.tsx
│   │   ├── sessions/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── signup/page.tsx
│   │   └── subjects/page.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── layout.tsx                    # SessionGuard + AIMentorFloat
│   └── globals.css                   # CSS micro-interactions, keyframes
├── components/
│   ├── brain/
│   │   ├── KnowledgeBrain.tsx        # SSR disabled (Math.sin hydration fix)
│   │   └── FloatingKnowledge.tsx     # SSR disabled
│   ├── dashboard/
│   │   ├── AgentPanel.tsx            # Right-panel: confidence, burnout, predictions
│   │   ├── AIInsightCard.tsx         # Rule-based daily insight (instant)
│   │   ├── AIMissionCard.tsx         # Agentic: auto-loads, triggers Groq
│   │   ├── AIMentorFloat.tsx         # Global floating AI mentor button
│   │   ├── AnalyticsWidgets.tsx
│   │   ├── PinnedTimetableWidget.tsx # Full plan modal + slot expander + review
│   │   ├── SessionForm.tsx           # SubjectSelect dropdown + custom input fix
│   │   ├── SessionList.tsx           # Filters + search + expandable notes
│   │   ├── StatsGrid.tsx             # Animated counters
│   │   ├── SubjectsWidget.tsx        # Inline subject CRUD on dashboard
│   │   └── WelcomeHero.tsx
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx               # minHeight:0 flex fix, 15 nav items
│   ├── progress/StudyHeatmap.tsx     # 52×7 GitHub-style grid
│   ├── providers/SessionGuard.tsx    # Global 401 → /login interceptor
│   └── ui/
│       └── SubjectSelect.tsx         # Shared subject dropdown (reused in 4 pages)
├── hooks/useCurrentUser.ts
├── lib/
│   ├── auth.ts                       # JWT, getUserFromRequest, getAuthCookieOptions
│   ├── constants.ts                  # 14 badges, CHALLENGE_POOL, ruby rules
│   ├── email.ts                      # Resend wrapper + HTML template
│   ├── mongodb.ts                    # Mongoose with global connection cache
│   ├── rateLimit.ts                  # MongoDB-backed, TTL-indexed
│   ├── rubies.ts
│   └── streaks.ts
├── models/
│   ├── AgentMemory.ts                # NEW — long-term student profile
│   ├── AgentState.ts                 # NEW — 3-hour cached agent output
│   ├── DailyChallenge.ts
│   ├── ExamResult.ts
│   ├── PinnedTimetable.ts
│   ├── ResourceRecommendation.ts
│   ├── StudySession.ts
│   ├── Subject.ts
│   ├── TestResult.ts
│   └── User.ts
└── proxy.ts                          # Next.js 16 route guard (15 protected routes)
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier)
- Groq API key — free at [console.groq.com](https://console.groq.com)
- Google OAuth credentials — [console.cloud.google.com](https://console.cloud.google.com)

### Installation

```bash
git clone https://github.com/DEVA-HUB-sketch/study-streak.git
cd study-streak
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/study-streak

# JWT — generate with: openssl rand -base64 32
JWT_SECRET=your-minimum-32-character-cryptographically-random-secret

# Groq AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth
# Authorized redirect URI: http://localhost:3000/api/auth/google/callback
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx

# ── Server-only URL (NOT baked at build time — critical for Vercel OAuth) ──
APP_URL=http://localhost:3000

# ── Public URL (used by client components) ──
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email — Resend (optional; logs to console if not set)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

> **Why two URL variables?** `NEXT_PUBLIC_APP_URL` is baked into the JavaScript bundle at build time — on Vercel, if it changes after a build it won't update. `APP_URL` is a server-only variable, always read at runtime from Vercel's environment dashboard.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. **Authorised JavaScript Origins:**
   - `http://localhost:3000`
   - `https://your-app.vercel.app`
4. **Authorised Redirect URIs:**
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-app.vercel.app/api/auth/google/callback`

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build   # TypeScript check + production build (47 routes)
npm start
```

---

## Deployment (Vercel)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DEVA-HUB-sketch/study-streak)

### Manual Deployment

1. Push to GitHub
2. Import repository in Vercel
3. Add **all** environment variables in **Project Settings → Environment Variables:**

```
MONGODB_URI           = <atlas connection string>
JWT_SECRET            = <random 32+ chars>
GROQ_API_KEY          = <groq key>
GOOGLE_CLIENT_ID      = <google client id>
GOOGLE_CLIENT_SECRET  = <google client secret>
APP_URL               = https://your-app.vercel.app      ← server-only, never stale
NEXT_PUBLIC_APP_URL   = https://your-app.vercel.app      ← baked at build time
RESEND_API_KEY        = <resend key>
RESEND_FROM_EMAIL     = <from email>
```

4. **Trigger a fresh deployment** (Redeploy — do not use cached build) after setting env vars
5. Add your Vercel URL to Google Cloud Console authorized origins and redirect URIs

> **MongoDB Atlas:** Ensure Network Access includes `0.0.0.0/0` or Vercel's IP ranges

---

## AI vs Agent — Key Difference

| Dimension | Previous AI Assistant | Current AI Agent |
|---|---|---|
| **Trigger** | User clicks a button | Runs automatically on every dashboard load |
| **Data scope** | 1-2 collections per feature | All 6 collections queried in parallel |
| **Memory** | Stateless — forgets between sessions | `AgentMemory` persists patterns across days |
| **Actions** | Recommends only | **Acts**: rewrites timetable in MongoDB, updates memory |
| **Personalization** | Form inputs + session data | Sessions + exams + memory + goals + patterns + time-of-day |
| **Cache** | No cache (Groq on every click) | 3-hour cache — max 8 runs/day per user |
| **Study Buddy chat** | Knows course + subjects | Knows course + subjects + real hours + memory + learning style |

---

## Roadmap

### Next (v1.8)
- [ ] Email verification on signup
- [ ] Study session Pomodoro timer
- [ ] Push notifications (streak reminders)
- [ ] Avatar upload (Cloudinary)
- [ ] Mobile layout improvements

### Growth (v2.0)
- [ ] Stripe subscription + plan enforcement (Free/Pro/Team tiers)
- [ ] Friend groups + private leaderboards
- [ ] Calendar export (.ics)
- [ ] WhatsApp/SMS reminder bot
- [ ] Agent-generated weekly email report

### Enterprise (v3.0)
- [ ] Institution admin dashboard
- [ ] Batch/cohort analytics
- [ ] AI fine-tuned on Indian engineering curriculum
- [ ] Multi-language support

---

## Status — v1.7

| Feature | Status |
|---|---|
| Email + Password authentication | ✅ Complete |
| Google OAuth (flow-aware, Vercel-compatible) | ✅ Complete |
| Forgot / Reset password | ✅ Complete |
| MongoDB-backed rate limiting | ✅ Complete |
| Session CRUD with IDOR protection | ✅ Complete |
| Subject management (dashboard widget + full page) | ✅ Complete |
| SubjectSelect shared component (4 pages) | ✅ Complete |
| Streak + Ruby gamification | ✅ Complete |
| 14 Achievement badges | ✅ Complete |
| Daily challenges | ✅ Complete |
| Global multi-user leaderboard | ✅ Complete |
| **AI Agent (proactive, agentic pipeline)** | ✅ Complete |
| **AgentMemory (long-term student memory)** | ✅ Complete |
| **Auto timetable rebalancing** | ✅ Complete |
| AI Study Coach (real data + agent memory) | ✅ Complete |
| Study Buddy Chatbot (streaming + agent memory) | ✅ Complete |
| AI Performance Analysis | ✅ Complete |
| AI Learning Resources (curated catalog) | ✅ Complete |
| AI Test Generator (auto-difficulty) | ✅ Complete |
| Floating AI Mentor (global) | ✅ Complete |
| Study Heatmap (GitHub-style) | ✅ Complete |
| Exam Performance Tracker + Recharts | ✅ Complete |
| Pinned Timetable + full plan modal + review | ✅ Complete |
| Dashboard analytics + AI insight | ✅ Complete |
| Sessions page (filters + search) | ✅ Complete |
| Profile (editable, CGPA + study hours) | ✅ Complete |
| Settings page (password change, preferences) | ✅ Complete |
| CSS micro-interactions (ripple, hover lift, nav indicator) | ✅ Complete |
| Sidebar CSS flex overflow fix (all items visible) | ✅ Complete |
| SSR hydration fix (KnowledgeBrain dynamic import) | ✅ Complete |
| Google OAuth Vercel deployment fix (APP_URL) | ✅ Complete |
| 7-step OAuth diagnostic logging | ✅ Complete |
| Error + 404 pages | ✅ Complete |
| Stripe payments | 📋 Planned |
| Email verification | 📋 Planned |
| Push notifications | 📋 Planned |

---

## Author

**Deva Dharshini K**
B.Tech Computer Science Engineering
Karunya Institute of Technology and Sciences

[![GitHub](https://img.shields.io/badge/GitHub-DEVA--HUB--sketch-black?logo=github)](https://github.com/DEVA-HUB-sketch)

---

## License

This project is licensed under the **MIT License**.

---

<div align="center">

⭐ **Star this repo if you found it helpful!**

Built with ❤️ for students who dare to study smarter.

</div>
