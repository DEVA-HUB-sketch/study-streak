# Study Streak

A full-stack Study Session Tracker built with Next.js, TypeScript, MongoDB Atlas, and Vercel. This application helps users track their study sessions, monitor learning progress, and manage study records through complete CRUD operations.

## Live Demo

https://study-streak-l5dbk7qhs-deva-hub.vercel.app

## GitHub Repository

https://github.com/DEVA-HUB-sketch/study-streak

---

## Features

### Authentication

* User authentication support
* Secure backend API routes

### CRUD Operations

* Create a new study session
* Read all study sessions
* Update existing study sessions
* Delete study sessions

### Dashboard

* Total study sessions count
* Total study minutes tracked
* Session history display

### Database

* MongoDB Atlas cloud database
* Mongoose ODM integration
* Persistent data storage

### Deployment

* Deployed on Vercel
* Production-ready environment variables
* Cloud-hosted MongoDB Atlas database

---

## Tech Stack

### Frontend

* Next.js 16
* React
* TypeScript
* CSS

### Backend

* Next.js API Routes
* Node.js

### Database

* MongoDB Atlas
* Mongoose

### Deployment

* Vercel

---

## Project Structure

app/
├── api/
│ └── sessions/
│ ├── route.ts
│ └── [id]/
│ └── route.ts
├── page.tsx
├── layout.tsx
└── globals.css

lib/
└── mongodb.ts

models/
└── StudySession.ts

---

## API Endpoints

### Create Session

POST /api/sessions

Request Body

```json
{
  "subject": "DSA",
  "duration": 50,
  "date": "2026-06-24",
  "completed": true
}
```

### Get All Sessions

GET /api/sessions

### Update Session

PUT /api/sessions/[id]

### Delete Session

DELETE /api/sessions/[id]

---

## CRUD Evidence

### Create

Users can add a new study session using the Add Session form.

### Read

All study sessions are fetched from MongoDB and displayed on the dashboard.

### Update

Existing study sessions can be edited using the Edit button.

### Delete

Users can remove sessions using the Delete button.

---

## MongoDB Integration

The application uses MongoDB Atlas for cloud database storage and Mongoose for schema modeling and database operations.

Connection is managed through:

```ts
connectDB()
```

Environment Variable:

```env
MONGODB_URI=your_mongodb_connection_string
```

---

## Local Setup

Clone the repository:

```bash
git clone https://github.com/DEVA-HUB-sketch/study-streak.git
```

Install dependencies:

```bash
npm install
```

Create .env.local

```env
MONGODB_URI=your_mongodb_connection_string
```

Run development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Deployment

The application is deployed using Vercel.

Deployment URL:

https://study-streak-l5dbk7qhs-deva-hub.vercel.app

---

## Author

Deva Dharshini K

B.Tech Computer Science Engineering

Karunya Institute of Technology and Sciences

Internship Project – Full Stack Development

---

## Status

Completed

Working Features:

* Authentication
* Create Session
* Read Sessions
* Update Session
* Delete Session
* MongoDB Atlas Integration
* Vercel Deployment
* Responsive Dashboard
