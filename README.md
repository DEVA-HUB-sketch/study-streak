# Study Streak — EdTech SaaS Platform

A production-grade, full-stack EdTech SaaS platform built with Next.js 16, TypeScript, MongoDB Atlas, and Groq AI. Study Streak gamifies the learning experience through streak tracking, ruby rewards, achievements, AI-powered study coaching, and a real-time chatbot — all behind a secure JWT authentication system.

## Live Demo

https://study-streak-l5dbk7qhs-deva-hub.vercel.app

## GitHub Repository

https://github.com/DEVA-HUB-sketch/study-streak

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + inline design tokens |
| Animations | Framer Motion |
| Charts | Chart.js + react-chartjs-2 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| AI | Groq SDK — llama-3.3-70b-versatile |
| Deployment | Vercel |

---

## Features

### Authentication System

- Multi-step registration (Account → Profile → Goals → Done)
- Login with email + password (bcrypt hashed, 10 salt rounds)
- JWT stored in HTTP-only cookies (7-day expiry)
- Route protection via `proxy.ts` (Next.js 16 Proxy / Middleware)
- Global 401 interceptor (`SessionGuard`) auto-redirects expired sessions to `/login`
- Authenticated users redirected away from `/login` and `/signup`
- Logout clears cookie and redirects to landing page

### Study Session CRUD

- Log sessions with subject, duration, date, and notes
- Edit and delete sessions (ownership verified — IDOR-protected)
- Subject selector with custom colour and emoji icons
- Per-user data isolation via JWT userId

### Dashboard

- Animated Knowledge Brain (SVG liquid fill based on daily goal progress)
- 30-day activity chart (Chart.js bar chart)
- Subject distribution donut chart
- Stats grid: total sessions, total minutes, current streak, best streak, rubies
- Welcome hero with time-aware greeting
- Session form + session list with edit/delete
- Daily challenge widget
- Insights side panel with leaderboard + achievement badges

### Streak & Gamification

- Automatic streak calculation (consecutive study days)
- Ruby reward system: 1 ruby per session + streak bonuses
  - 7-day streak → +10 rubies
  - 30-day streak → +50 rubies
  - 100 hours → +100 rubies
- 8 unlockable achievement badges (First Step, 7-Day Warrior, 30-Day Master, 100 Hours Club, Ruby Collector, Getting Started, Halfway Hero, Consistency Champion)
- Brain celebration animation triggers at 100% daily goal

### Subjects

- Create subjects with custom name, colour, and emoji icon
- Edit and delete own subjects
- Subjects linked to session logging
- Per-user subject isolation

### Leaderboard

- Displays ranked study stats (hours studied, sessions, rubies, streak)
- Per-user data (multi-user expansion ready)

### Achievements

- Full badge grid showing locked/unlocked state
- Real-time unlock based on stats from MongoDB

### Profile

- Displays real authenticated user: name, email, college, department
- Join date formatted from MongoDB `createdAt`
- Rank computed from total sessions (Beginner → Scholar → Master → Legend)
- Stat chips: sessions, hours, best streak, rubies
- Achievement grid embedded in profile

### AI Study Coach (Groq — llama-3.3-70b-versatile)

Accessible at `/ai`. Generates a fully personalised study plan from:

| Input | Description |
|---|---|
| Course & Year | e.g. B.Tech CSE, 2nd Year |
| Subjects | Comma-separated list |
| Weak / Strong Subjects | Focuses effort where needed |
| Exam Date | Calculates days remaining |
| Daily Study Hours | Builds a realistic timetable |

Output includes 7 sections rendered in a dark-themed UI:

1. **Exam Readiness Score** — animated SVG ring (0–100)
2. **Motivation Message** — personalised encouragement
3. **Study Strategy** — overall approach for the timeline
4. **Daily Targets** — 5 numbered actionable tasks
5. **Today's Timetable** — colour-coded table (unique colour per subject)
6. **Subject-wise Methods** — priority badge, 3 methods, 1 key tip per subject
7. **Weekly Roadmap** — week-by-week goals until exam
8. **Recommended Resources** — subject-specific books, channels, websites

#### Pin to Dashboard

- "📌 Pin to Dashboard" button saves the plan to MongoDB
- Pinned plan appears on the dashboard as a compact widget
- Widget shows: today's schedule, exam countdown chip, readiness bar
- "View Full Plan" links back to `/ai`

#### Review & Remove Flow

- Clicking the unpin (PinOff) button opens a review modal
- If exam date has passed: "How did your exam go?"
- If exam is still upcoming: "Are you sure?"
- User rates 1–5 stars + writes optional feedback (saved to DB)
- Plan is deleted after review submission or skip

### Study Buddy Chatbot

- Floating chat panel on the `/ai` page (bottom-right)
- Streaming responses via Groq (real-time token-by-token output)
- Context-aware: knows the student's course and subjects
- Keeps last 12 messages as conversation history
- Concise answers (<180 words) with subject-specific help

### Error Handling

- `app/error.tsx` — branded error boundary with retry button and error digest
- `app/not-found.tsx` — 404 page with "Go to Dashboard" CTA
- All API routes return structured JSON errors with correct HTTP status codes

---

## Security

| Threat | Mitigation |
|---|---|
| Password storage | bcrypt hash, salt rounds 10 |
| Session hijacking | HTTP-only JWT cookie, `sameSite: lax` |
| IDOR on sessions | Ownership check before every PUT/DELETE |
| IDOR on subjects | Ownership check before every PUT/DELETE |
| Unauthorised access | `proxy.ts` redirects unauthenticated routes to `/login` |
| Expired sessions | `SessionGuard` patches `globalThis.fetch` to intercept 401s |
| Duplicate registration | Handles MongoDB code 11000 + explicit email check |
| Password not returned | `select: false` on User model password field |
| userId forgery | Stripped from PUT body before DB update |

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, sets JWT cookie |
| POST | `/api/auth/logout` | Clears JWT cookie |
| GET | `/api/auth/me` | Returns current authenticated user |

### Sessions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sessions` | Get all sessions for current user |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/[id]` | Get single session (ownership verified) |
| PUT | `/api/sessions/[id]` | Update session (ownership verified) |
| DELETE | `/api/sessions/[id]` | Delete session (ownership verified) |

### Stats & Gamification

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stats` | Streaks, rubies, badges, chart data |
| GET | `/api/leaderboard` | Ranked user stats |
| GET | `/api/challenges` | Today's daily challenge + live progress |

### Subjects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | Get user's subjects |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/[id]` | Update subject (ownership verified) |
| DELETE | `/api/subjects/[id]` | Delete subject (ownership verified) |

### AI

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai` | Generate full study plan (Groq) |
| POST | `/api/ai/chat` | Streaming Study Buddy chat (Groq) |

### Timetable (Pinned Plan)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/timetable` | Get pinned study plan |
| POST | `/api/timetable` | Pin/replace study plan |
| PATCH | `/api/timetable` | Save review rating + text |
| DELETE | `/api/timetable` | Remove pinned plan |

---

## Database Models

| Model | Key Fields |
|---|---|
| `User` | name, email, password (hidden), college, department, totalRubies, rank |
| `StudySession` | userId, subject, duration, date, notes, completed |
| `Subject` | userId, name, color, icon, totalMinutes, sessionCount |
| `DailyChallenge` | userId, challengeId, date, target, unit, rubyReward |
| `Achievement` | userId, badgeId, unlockedAt |
| `PinnedTimetable` | userId, course, subjects, examDate, timetable[], weeklyRoadmap[], reviewed, reviewRating, reviewText |

---

## Project Structure

```
app/
├── api/
│   ├── ai/
│   │   ├── route.ts          # Groq study plan generation
│   │   └── chat/route.ts     # Groq streaming chatbot
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── me/route.ts
│   │   └── register/route.ts
│   ├── challenges/route.ts
│   ├── leaderboard/route.ts
│   ├── sessions/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── stats/route.ts
│   ├── subjects/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── timetable/route.ts
├── ai/page.tsx               # AI Study Coach UI
├── achievements/page.tsx
├── dashboard/page.tsx
├── leaderboard/page.tsx
├── login/page.tsx
├── profile/page.tsx
├── signup/page.tsx
├── subjects/page.tsx
├── error.tsx                 # Global error boundary
├── not-found.tsx             # 404 page
├── layout.tsx
└── globals.css

components/
├── brain/
│   ├── KnowledgeBrain.tsx    # Animated SVG liquid brain
│   ├── FloatingKnowledge.tsx
│   └── BrainCelebration.tsx
├── charts/StudyChart.tsx
├── dashboard/
│   ├── SessionForm.tsx
│   ├── SessionList.tsx
│   ├── StatsGrid.tsx
│   ├── WelcomeHero.tsx
│   ├── StreakCalendar.tsx
│   ├── DailyChallenge.tsx
│   ├── MotivationCorner.tsx
│   ├── RubyCounter.tsx
│   └── PinnedTimetableWidget.tsx
├── insights/InsightsPanel.tsx
├── layout/
│   ├── DashboardLayout.tsx
│   └── Sidebar.tsx
├── leaderboard/LeaderboardTable.tsx
├── achievements/AchievementGrid.tsx
├── providers/SessionGuard.tsx  # Global 401 interceptor
└── ui/LoadingScreen.tsx

hooks/
└── useCurrentUser.ts

lib/
├── auth.ts                   # JWT sign/verify, cookie helpers, getUserFromRequest
├── mongodb.ts                # Mongoose connection with caching
├── constants.ts              # Badges, challenges, ruby rules, quotes
├── streaks.ts
└── rubies.ts

models/
├── User.ts
├── StudySession.ts
├── Subject.ts
├── DailyChallenge.ts
├── Achievement.ts
└── PinnedTimetable.ts

proxy.ts                      # Route protection (Next.js 16 Proxy)
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier)
- Groq API key (free at console.groq.com)

### Installation

```bash
git clone https://github.com/DEVA-HUB-sketch/study-streak.git
cd study-streak
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/study-streak?retryWrites=true&w=majority
JWT_SECRET=your-minimum-32-character-random-secret
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Generate a secure JWT secret: `openssl rand -base64 32`

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables (`MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`)
4. Deploy

Live URL: https://study-streak-l5dbk7qhs-deva-hub.vercel.app

---

## Author

**Deva Dharshini K**
B.Tech Computer Science Engineering
Karunya Institute of Technology and Sciences
Full Stack Development Project

---

## Status

**Active development — Sprint 1 complete**

| Feature | Status |
|---|---|
| Authentication (JWT + bcrypt) | Complete |
| Session CRUD with IDOR protection | Complete |
| Streak & Ruby gamification | Complete |
| Achievements & Badges | Complete |
| Daily Challenges | Complete |
| Subjects management | Complete |
| Leaderboard | Complete |
| AI Study Coach (Groq) | Complete |
| Study Buddy Chatbot (streaming) | Complete |
| Pin plan to Dashboard | Complete |
| Exam review & removal flow | Complete |
| Error pages (error.tsx, not-found.tsx) | Complete |
| Hydration fix (dynamic SSR) | Complete |
| Rate limiting | Planned |
| Password reset via email | Planned |
| Email verification | Planned |
| Real multi-user leaderboard | Planned |
| Stripe payment integration | Planned |
