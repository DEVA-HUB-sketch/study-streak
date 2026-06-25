<div align="center">

# Study Streak

### AI-Powered Academic Intelligence Platform

**Track · Plan · Analyse · Improve · Achieve**

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com/atlas)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-orange)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Live Demo](https://study-streak-l5dbk7qhs-deva-hub.vercel.app) ·
[Report Bug](https://github.com/DEVA-HUB-sketch/study-streak/issues) ·
[Request Feature](https://github.com/DEVA-HUB-sketch/study-streak/issues)

</div>

---

## What is Study Streak?

Study Streak is a full-stack AI-powered EdTech SaaS platform that transforms how college students track, plan, and improve academic performance. It combines real-time study analytics, Groq AI coaching, gamification, exam performance tracking, and personalised learning resources into one cohesive platform — purpose-built for Indian engineering students.

**What makes it different:**
- The AI Coach reads your **actual MongoDB study history** before generating recommendations
- A **GitHub-style heatmap** visualises 365 days of study consistency
- **Exam performance analytics** correlate study hours with marks using Recharts
- A **streaming Study Buddy chatbot** that knows your real streak and subject distribution
- **Google OAuth** + email/password auth with full forgot-password flow
- **14 gamification badges**, ruby rewards, and a global leaderboard

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Full-stack SSR + API routes |
| **Language** | TypeScript 5 | Type safety end-to-end |
| **Styling** | Tailwind CSS 4 + CSS design tokens | Utility classes + design system |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Charts** | Chart.js · Recharts | Dashboard charts · Exam analytics |
| **Database** | MongoDB Atlas + Mongoose ODM | Cloud database + schema modeling |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Stateless sessions + password hashing |
| **OAuth** | Google OAuth 2.0 (custom, no NextAuth) | Social login without extra dependencies |
| **AI** | Groq SDK — llama-3.3-70b-versatile | All 5 AI features |
| **Email** | Resend | Password reset emails |
| **Rate Limiting** | MongoDB-backed in-app limiter | Works in serverless (Vercel) |
| **Deployment** | Vercel | Zero-config Next.js hosting |

---

## Feature Overview

### Authentication & Security

| Feature | Details |
|---|---|
| Email + Password registration | Multi-step signup (Account → Profile → Goals → Done), bcrypt 10 rounds |
| Google OAuth | Custom flow — login only lets existing accounts in; signup creates new accounts |
| JWT sessions | HTTP-only cookie, 7-day TTL, `sameSite: lax` |
| Forgot password | Secure SHA-256 hashed token, 1-hour expiry, Resend email |
| Reset password | Single-use token, uses `updateOne` (safe for `select: false` fields) |
| Route protection | `proxy.ts` (Next.js 16 Proxy) guards all 13 authenticated routes |
| Session expiry | `SessionGuard` patches `globalThis.fetch` — auto-redirects to `/login` on 401 |
| Rate limiting | MongoDB-backed: login 5/15min, register 3/hr, forgot-password 3/15min |
| IDOR prevention | Every mutation verifies `doc.userId === auth.userId` → 403 on mismatch |
| Password field | `select: false` — never returned in any query |
| Mass assignment | Profile PATCH uses explicit whitelist of allowed fields |

### Study Management

- **Sessions** — Log with subject, duration, date, notes. Filters: Today / This Week / This Month / Subject / Search text
- **Subjects** — Custom name, colour, emoji. Stats computed live from sessions via MongoDB `$group`
- **Session history** — Dedicated `/sessions` page with expandable notes, edit/delete inline
- **Subject sync** — Creating/editing/deleting sessions automatically updates subject `totalMinutes` + `sessionCount`

### Gamification

| System | Details |
|---|---|
| **Rubies** | 1 per session · +10 for 7-day streak · +50 for 30-day · +100 for 100 hours |
| **Streaks** | Custom algorithm with 1-day grace period; `currentStreak` + `longestStreak` |
| **Badges** | 14 unlockable: First Step → 200h Legend → Dedicated Scholar (500h) |
| **Daily Challenges** | Deterministic daily goal; live progress from sessions |
| **Leaderboard** | Global rankings via MongoDB `$group` aggregation across all users |
| **Knowledge Brain** | Animated SVG liquid-fill brain tracks daily goal (0–100%) |

### AI Features (Groq — llama-3.3-70b-versatile)

| Route | Feature | Data injected |
|---|---|---|
| `POST /api/ai` | **AI Study Coach** — 13-section personalised plan | Real sessions, subject %, streak, burnout, week-over-week trend, recent history |
| `POST /api/ai/chat` | **Study Buddy Chat** — streaming token-by-token | Sessions, subject distribution, current streak |
| `POST /api/performance-analysis` | **AI Academic Analyst** — deep analysis | Sessions + exam marks, consistency score, custom question |
| `POST /api/resources` | **Learning Resources** — curated YouTube + websites | User's least-studied subjects from DB |
| `POST /api/challenges/generate` | **AI Test Generator** — MCQ tests | Past test scores (auto-adjusts difficulty) |

**AI Study Plan sections:** Exam Readiness Score · Motivation Message · Study Strategy · Daily Targets · Colour-coded Timetable · Subject Methods · Weekly Roadmap · Resources · Weak Subject Analysis · Strength Analysis · Burnout Detection · Productivity Insight · Personalised Recommendations

### Analytics & Progress

- **Study Heatmap** — GitHub-style 52×7 contribution graph with hover tooltip (date, hours, sessions, subjects)
- **Consistency Score** — 0–100 computed from active days (50%) + streak (30%) + session volume (20%)
- **AI Insight Card** — Rule-based daily insight (5 types: warning, achievement, improvement, suggestion, motivation)
- **Analytics Widgets** — Most Studied Subject · Weakest Subject · Predicted Exam Readiness (animated radial bar)
- **Monthly Consistency** — 6-month bar chart on `/progress`
- **Subject Comparison** — Active days + hours per subject, stacked bars

### Exam Performance Tracker (`/exams`)

- Add exam results: subject, name, date, marks obtained / total marks, study hours before exam
- Auto-computed: percentage + grade (O / A+ / A / B / C / F)
- **Recharts** — Subject averages (BarChart) · Marks trend over time (LineChart) · Study hours vs score (ScatterChart)
- **AI Academic Analysis** modal — performance report, weak subjects, efficiency analysis, exam readiness, recommendations
- History table with delete

### AI Learning Resources (`/resources`)

- Input: subject + topic + difficulty + learning goal
- Groq selects from a **hardcoded catalog** of 19 YouTube channels + 15 websites → no hallucinated URLs
- Output: Best YouTube channels · Best websites · Study strategy · Learning roadmap · Quick tips
- History saved to MongoDB — revisit past searches without regenerating
- "Open Resource" buttons link directly to real URLs

### AI Test Generator (`/challenges`)

- Select subject (from user's list), topic, difficulty (Easy / Medium / Hard), question count (5 / 10 / 15)
- Groq generates validated MCQ with 4 options + explanation per question
- **Auto-difficulty calibration** — if past test score ≥ 80%, upgrades to Hard automatically
- Test UI: numbered dot progress, A/B/C/D buttons, Previous/Next navigation
- Results: animated score ring, answer review with green/red indicators, explanation for each question
- History saved to MongoDB; shown on the form page

### Dashboard

| Widget | Description |
|---|---|
| Welcome Hero | Time-aware greeting (Morning/Afternoon/Evening) |
| AI Insight Card | Daily personalised insight from analytics engine |
| Pinned Study Plan | Active timetable widget: today's schedule, exam countdown, readiness bar |
| Stats Grid | 5 animated counters: sessions, minutes, streak, best streak, rubies |
| Analytics Widgets | Most studied, weakest subject, exam readiness ring |
| 30-Day Activity Chart | Bar chart + subject donut (Chart.js) |
| Session Form | Log sessions with subject dropdown + custom input |
| Session List | Filters, search, inline edit/delete, expandable notes |
| Insights Panel | Leaderboard + achievements in right sidebar |

### Profile & Settings

**Profile (`/profile`):**
- Edit: name, college, department, academic year, study goals, target exam, target CGPA (0–10), preferred study hours
- Shows: rank badge (Beginner → Scholar → Master → Legend), join date, auth method
- Stats: sessions, hours, best streak, rubies
- Full achievement grid embedded

**Settings (`/settings`):**
- Change password (disabled + explanation for Google users)
- Notification toggles (email, streak reminder, weekly report)
- Preferences (links to Profile, AI Coach)
- Security info (active session status)
- Danger zone: sign out with confirmation, delete account

---

## Security Summary

| Threat | Mitigation |
|---|---|
| Password storage | bcrypt, 10 salt rounds |
| Session hijacking | HTTP-only JWT cookie, `sameSite: lax` |
| XSS token theft | No localStorage — JWT in HTTP-only cookie only |
| IDOR on sessions | Ownership verified before every PUT/DELETE → 403 |
| IDOR on subjects/exams | Same ownership pattern throughout |
| Brute force | Rate limiting on login (5/15min) + register (3/hr) |
| Google OAuth CSRF | 16-byte random state cookie validated on callback |
| Google login for unregistered | Returns error — only existing accounts can sign in via Google |
| Password reset token | SHA-256 hashed in DB, raw token in email only, 1-hour TTL |
| `select: false` + `save()` bug | All `select: false` field writes use `updateOne` / `$set` directly |
| Mass assignment | Profile PATCH whitelists 8 specific fields |
| User enumeration | Forgot-password always returns `{ success: true }` |
| Unauthorised API access | Every API route independently verifies JWT |

---

## Database Models

| Model | Key Fields | Notes |
|---|---|---|
| `User` | name, email, password (select:false), googleId, authProvider, college, department, academicYear, goals, examTarget, targetCGPA, preferredStudyHours, resetToken (select:false), resetTokenExpiry | Password optional for Google users |
| `StudySession` | userId, subject, duration, date, notes, completed | All stats computed fresh per request |
| `Subject` | userId, name, color, icon | Stats computed via `$group` aggregation at read time |
| `DailyChallenge` | userId, challengeId, date, target, unit, rubyReward | Deterministic pick by date hash |
| `PinnedTimetable` | userId (unique), course, subjects, examDate, timetable[], weeklyRoadmap[], examined, reviewRating, reviewText | One per user, upsert pattern |
| `ExamResult` | userId, subject, examName, examDate, marksObtained, totalMarks, percentage, grade, studyHoursBeforeExam | Grade auto-computed pre-save |
| `ResourceRecommendation` | userId, subject, topic, difficulty, goal, youtubeChannels[], websites[], studyStrategy[], roadmap[], quickTips[] | History for revisiting |
| `TestResult` | userId, subject, topic, difficulty, questions[], score, totalQuestions, percentage | Stores full Q&A for review |
| `RateLimit` | key, count, resetAt | TTL-indexed, MongoDB-backed, serverless-safe |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account (rate limited 3/hr) |
| POST | `/api/auth/login` | ❌ | Email+password login (rate limited 5/15min) |
| POST | `/api/auth/logout` | ❌ | Clear JWT cookie |
| GET | `/api/auth/me` | ✅ | Current authenticated user |
| GET | `/api/auth/google` | ❌ | Initiate Google OAuth (`?flow=login` or `?flow=signup`) |
| GET | `/api/auth/google/callback` | ❌ | Google OAuth callback |
| POST | `/api/auth/forgot-password` | ❌ | Send reset email (rate limited 3/15min) |
| POST | `/api/auth/reset-password` | ❌ | Validate token + update password |
| PATCH | `/api/profile` | ✅ | Update profile fields (whitelisted) |
| PATCH | `/api/settings` | ✅ | Change password |

### Study Data

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET / POST | `/api/sessions` | ✅ | List / create sessions |
| GET / PUT / DELETE | `/api/sessions/[id]` | ✅ | Read / update / delete (IDOR protected) |
| GET / POST | `/api/subjects` | ✅ | List with live stats / create |
| PUT / DELETE | `/api/subjects/[id]` | ✅ | Update / delete (IDOR protected) |
| GET / POST / PUT / DELETE | `/api/exams` + `/api/exams/[id]` | ✅ | Exam results CRUD |

### Analytics & Gamification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics` | ✅ | Full analytics: consistency, burnout, next badge, insight |
| GET | `/api/stats` | ✅ | Streaks, rubies, chart data, badges |
| GET | `/api/leaderboard` | ✅ | Global rankings (MongoDB `$group` all users) |
| GET | `/api/challenges` | ✅ | Daily challenge + live progress |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai` | ✅ | Generate study plan (MongoDB data → Groq) |
| POST | `/api/ai/chat` | ✅ | Streaming Study Buddy (sessions injected) |
| POST | `/api/performance-analysis` | ✅ | Full AI academic analysis |
| GET / POST | `/api/resources` | ✅ | Resource history / generate recommendations |
| POST / PUT | `/api/challenges/generate` | ✅ | Generate MCQ / save test result |
| GET | `/api/challenges/history` | ✅ | Past test results |

### Timetable

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET / POST / PATCH / DELETE | `/api/timetable` | ✅ | Get / pin / review / remove pinned plan |

---

## Project Structure

```
study-streak/
├── app/
│   ├── api/
│   │   ├── ai/                           # Study plan + streaming chat
│   │   │   ├── route.ts
│   │   │   └── chat/route.ts
│   │   ├── analytics/route.ts            # Full analytics engine
│   │   ├── auth/
│   │   │   ├── login/route.ts            # Rate limited
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   ├── register/route.ts         # Rate limited
│   │   │   ├── google/route.ts           # OAuth initiation
│   │   │   ├── google/callback/route.ts  # OAuth token exchange
│   │   │   ├── forgot-password/route.ts  # Send reset email
│   │   │   └── reset-password/route.ts   # Validate token + update
│   │   ├── challenges/
│   │   │   ├── route.ts                  # Daily challenge
│   │   │   ├── generate/route.ts         # MCQ generation
│   │   │   └── history/route.ts
│   │   ├── exams/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── leaderboard/route.ts          # Global $group aggregation
│   │   ├── performance-analysis/route.ts # AI academic analysis
│   │   ├── profile/route.ts              # PATCH profile
│   │   ├── resources/route.ts            # AI learning resources
│   │   ├── sessions/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── settings/route.ts             # Change password
│   │   ├── stats/route.ts
│   │   ├── subjects/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── timetable/route.ts
│   ├── (pages)/
│   │   ├── ai/page.tsx                   # AI Study Coach
│   │   ├── achievements/page.tsx
│   │   ├── challenges/page.tsx           # AI Test Generator
│   │   ├── dashboard/page.tsx
│   │   ├── exams/page.tsx                # Exam Performance Tracker
│   │   ├── forgot-password/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── login/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── progress/page.tsx             # Study Heatmap
│   │   ├── reset-password/page.tsx
│   │   ├── resources/page.tsx            # AI Learning Resources
│   │   ├── sessions/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── signup/page.tsx
│   │   └── subjects/page.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── brain/
│   │   ├── KnowledgeBrain.tsx            # Animated SVG (dynamic import, SSR disabled)
│   │   ├── FloatingKnowledge.tsx
│   │   └── BrainCelebration.tsx
│   ├── charts/StudyChart.tsx
│   ├── dashboard/
│   │   ├── AIInsightCard.tsx             # Daily AI insight with type variants
│   │   ├── AIMentorFloat.tsx             # Global floating AI mentor button
│   │   ├── AnalyticsWidgets.tsx          # Most studied · weakest · readiness
│   │   ├── PinnedTimetableWidget.tsx     # Full plan modal + slot expander
│   │   ├── SessionForm.tsx
│   │   ├── SessionList.tsx               # Filters + search
│   │   ├── StatsGrid.tsx                 # Animated counters
│   │   └── WelcomeHero.tsx
│   ├── insights/InsightsPanel.tsx
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx                   # Dynamic imports for SSR hydration fix
│   ├── leaderboard/LeaderboardTable.tsx
│   ├── achievements/AchievementGrid.tsx
│   ├── progress/StudyHeatmap.tsx         # GitHub-style 52×7 grid
│   └── providers/SessionGuard.tsx        # Global 401 → /login interceptor
├── hooks/
│   └── useCurrentUser.ts
├── lib/
│   ├── auth.ts                           # JWT sign/verify/getUserFromRequest
│   ├── constants.ts                      # 14 badges, challenges, ruby rules
│   ├── email.ts                          # Resend wrapper with HTML template
│   ├── mongodb.ts                        # Mongoose with global connection cache
│   ├── rateLimit.ts                      # MongoDB-backed, serverless-safe
│   ├── rubies.ts
│   └── streaks.ts                        # Grace-period streak algorithm
├── models/
│   ├── DailyChallenge.ts
│   ├── ExamResult.ts
│   ├── PinnedTimetable.ts
│   ├── ResourceRecommendation.ts
│   ├── StudySession.ts
│   ├── Subject.ts
│   ├── TestResult.ts
│   └── User.ts
└── proxy.ts                              # Next.js 16 route guard (renamed from middleware)
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier)
- Groq API key — free at [console.groq.com](https://console.groq.com)

### Installation

```bash
git clone https://github.com/DEVA-HUB-sketch/study-streak.git
cd study-streak
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB Atlas — standard connection string (non-SRV avoids DNS issues on Windows)
MONGODB_URI=mongodb://<user>:<password>@<host>:27017/study-streak?ssl=true&authSource=admin

# JWT — generate with: openssl rand -base64 32
JWT_SECRET=your-minimum-32-character-cryptographically-random-secret

# Groq AI — https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google OAuth — https://console.cloud.google.com
# Authorised redirect URI: http://localhost:3000/api/auth/google/callback
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx

# App base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend) — https://resend.com — optional; logs to console if not set
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

> **Google OAuth setup:** In Google Cloud Console → OAuth 2.0 Client IDs, add `http://localhost:3000/api/auth/google/callback` as an authorised redirect URI. For production, add your Vercel URL too.

> **Email in development:** If `RESEND_API_KEY` is not set, password reset URLs are logged to the terminal — no email is required locally.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build   # TypeScript check + production build
npm start       # Start production server
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repository in Vercel
3. Add all environment variables in **Project Settings → Environment Variables**
4. Add your Vercel URL to Google Cloud Console authorised redirect URIs
5. Deploy

**Live URL:** https://study-streak-l5dbk7qhs-deva-hub.vercel.app

> MongoDB Atlas: ensure **Network Access** includes `0.0.0.0/0` or Vercel's IP ranges.

---

## Roadmap

### Next (v1.7)
- [ ] Email verification on signup
- [ ] Push notifications (streak reminders)
- [ ] Study session Pomodoro timer
- [ ] Avatar upload (Cloudinary)
- [ ] Mobile layout fixes

### Growth (v2.0)
- [ ] Stripe subscription + plan enforcement
- [ ] Friend groups + private leaderboards
- [ ] Calendar export (.ics)
- [ ] WhatsApp reminder bot

### Enterprise (v3.0)
- [ ] Institution admin dashboard
- [ ] Team/batch leaderboards
- [ ] AI fine-tuned on Indian engineering curriculum

---

## Author

**Deva Dharshini K**
B.Tech Computer Science Engineering
Karunya Institute of Technology and Sciences

[![GitHub](https://img.shields.io/badge/GitHub-DEVA--HUB--sketch-black?logo=github)](https://github.com/DEVA-HUB-sketch)

---

## Status

**v1.6 — Production-ready MVP**

| Feature | Status |
|---|---|
| Email + Password authentication | ✅ Complete |
| Google OAuth (login + signup) | ✅ Complete |
| Forgot / Reset password (Resend) | ✅ Complete |
| Rate limiting (MongoDB-backed) | ✅ Complete |
| Session CRUD with IDOR protection | ✅ Complete |
| Subject management | ✅ Complete |
| Streak & Ruby gamification | ✅ Complete |
| 14 Achievement badges | ✅ Complete |
| Daily challenges | ✅ Complete |
| Global leaderboard (all users) | ✅ Complete |
| AI Study Coach (real data injection) | ✅ Complete |
| Study Buddy Chatbot (streaming) | ✅ Complete |
| AI Performance Analysis | ✅ Complete |
| AI Learning Resources | ✅ Complete |
| AI Test Generator (auto-difficulty) | ✅ Complete |
| Floating AI Mentor | ✅ Complete |
| Study Heatmap (GitHub-style) | ✅ Complete |
| Exam Performance Tracker + Recharts | ✅ Complete |
| Pinned Timetable + review flow | ✅ Complete |
| Analytics engine + AI insight card | ✅ Complete |
| Sessions page with filters + search | ✅ Complete |
| Profile (editable, 8 fields) | ✅ Complete |
| Settings page (password, preferences) | ✅ Complete |
| Error + 404 pages | ✅ Complete |
| Button micro-interactions (CSS) | ✅ Complete |
| Email verification on signup | 📋 Planned |
| Stripe payments | 📋 Planned |
| Push notifications | 📋 Planned |

---

## License

This project is licensed under the **MIT License**.

---

<div align="center">

⭐ **Star this repo if you found it helpful!**

Built with ❤️ for students who dare to study smarter.

</div>
