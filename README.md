# 🚀 Startup Resource Discovery Platform — MERN Stack

Same platform as the Core Java version, rebuilt with MongoDB + Express + React + Node.js.

## ✨ Features
- User auth (founder/mentor/admin) with **mandatory OTP email verification** (Nodemailer + Gmail App Password)
- JWT-based sessions
- Resource database with admin CRUD (Funding, Govt Schemes, Mentors, Tools, Co-working, Legal)
- Search & filter (keyword + category/industry/stage/location)
- **AI recommendation engine** — cosine similarity, pure JavaScript, no external ML library
- **AI chatbot** — Gemini API (free tier), RAG-style (only talks about resources in your DB)
- **Match % scoring** on every resource
- **AI auto-tagging** for admins adding new resources
- **Trend analytics dashboard** (views grouped by industry)

## 🛠️ Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + React Router |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| AI | Custom cosine similarity (JS) + Gemini API |
| Mail | Nodemailer (Gmail SMTP, App Password) |

## 📁 Structure
```
StartupResourceHub-MERN/
├── backend/
│   ├── models/       User, Resource, Otp, Activity (Mongoose schemas)
│   ├── controllers/   auth, resource, chatbot, admin
│   ├── routes/        authRoutes, resourceRoutes, chatbotRoutes, adminRoutes
│   ├── services/       recommendationService (cosine similarity), geminiService
│   ├── middleware/    auth (JWT protect, adminOnly, optionalAuth)
│   ├── utils/mailer.js
│   ├── seed.js         sample data + default admin
│   └── server.js
└── frontend/
    └── src/
        ├── pages/       Login, Register, VerifyOtp, Dashboard, Search, Chatbot, Admin
        ├── components/  Navbar, ProtectedRoute
        └── api/         api.js (axios + JWT interceptor), AuthContext.js
```

## ⚙️ Setup

### 1. MongoDB
Install MongoDB locally, or use a free MongoDB Atlas cluster. Get your connection string.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/srh_db
JWT_SECRET=some_long_random_string
MAIL_USER=your_project_gmail@gmail.com
MAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GEMINI_API_KEY=your_gemini_key
```

**Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords →
generate one for "Mail". Use THIS (not your normal password) as `MAIL_APP_PASSWORD`.
This account only sends OTP emails; real users register with their own emails.

**Gemini API key (free):** https://aistudio.google.com/app/apikey

Seed sample data + a default admin account:
```bash
node seed.js
```
This creates `admin@srh.com` / `Admin@123` (already verified — change the password after first login).

Start the backend:
```bash
npm run dev        # nodemon, auto-restart
# or
npm start
```
Runs on `http://localhost:5000`.

### 3. Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
npm start
```
Runs on `http://localhost:3000` and talks to the backend at `http://localhost:5000/api`.

## 🧠 How the AI Layer Works
1. **Recommendation engine (self-contained):** each resource's tags/industry/stage/location and
   each user's profile become term-frequency vectors; cosine similarity between them gives a
   0–100% match score — see `backend/services/recommendationService.js`.
2. **Chatbot (Gemini):** the user's message is first run through the same cosine similarity
   engine to get the top-5 matching resources from MongoDB. Only those 5 are passed into the
   Gemini prompt, so the AI explains real resources instead of inventing fake ones (RAG pattern).
3. **Auto-tagging:** admin enters a title + description, clicks "AI Suggest Tags" →
   `POST /api/admin/suggest-tags` → Gemini extracts 5-8 keyword tags.

## 🔐 Security notes
- Passwords hashed with bcryptjs (12 rounds), never stored in plaintext
- JWT required for protected routes (`middleware/auth.js`)
- OTPs expire in 5 minutes, single-use
- `.env` is gitignored — never commit real secrets
- If `GEMINI_API_KEY` is missing/invalid, the chatbot gracefully falls back to pure
  keyword/cosine-similarity results instead of crashing

## 🆕 Founder & Mentor Features
- **Edit Profile** — founders update stage/industry/location/needs; mentors get a dedicated profile (expertise, experience, availability, bio) at `/profile`
- **Application Tracker** — "+Track" any resource from Search/Dashboard, manage status (Saved → Applied → In Progress → Approved/Rejected) at `/applications`
- **AI Mentor Matching ⭐** — founders see mentors ranked by match % (cosine similarity between founder's industry/needs/stage and mentor's expertise/industry/bio) at `/mentors`
- **Mentor Requests inbox** — mentors accept/decline incoming requests, with Pending/History tabs at `/mentor-requests`
- **Mentor Dashboard** — stats (pending/active/declined/total requests) + list of active mentees at `/mentor-dashboard`
- **Mentoring History** — past accepted/declined requests kept in the History tab
- **Notifications** — bell icon in navbar; founders get notified when a new resource matches their industry, both sides get notified on mentor request status changes

## 🆕 Advanced Admin Features
- **Stats dashboard** — KPI cards (total resources, users, views, weekly views)
- **Tabbed admin UI** — Add Resource / Manage / Analytics / Users / Activity Log
- **Charts** — Recharts bar chart (views by industry) + pie chart (category breakdown)
- **User management** — view all users, promote/demote roles inline
- **Activity log** — last 30 resource views across the platform
- **Bulk CSV import** — upload a CSV to create many resources at once
- **AI duplicate detection** — warns if a new resource looks similar to an existing one (cosine similarity)
- **CSV export** — download trend analytics as a spreadsheet
- **Toast notifications + confirm modals** — no more browser alert()/confirm()

## 📡 Key API Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | - | Register + send OTP |
| POST | `/api/auth/verify-otp` | - | Verify OTP |
| POST | `/api/auth/login` | - | Login, returns JWT |
| GET | `/api/resources/recommendations` | User | Personalized AI matches |
| GET | `/api/resources/search` | Optional | Search/filter resources |
| POST | `/api/chatbot` | Optional | AI chatbot query |
| POST | `/api/resources` | Admin | Create resource |
| POST | `/api/admin/suggest-tags` | Admin | AI auto-tag suggestion |
| POST | `/api/admin/check-duplicate` | Admin | AI duplicate detection |
| GET | `/api/admin/stats` | Admin | KPI dashboard stats |
| GET | `/api/admin/users` | Admin | List all users |
| PUT | `/api/admin/users/:id/role` | Admin | Change a user's role |
| GET | `/api/admin/activity` | Admin | Recent activity log |
| POST | `/api/admin/resources/bulk` | Admin | Bulk CSV import |
| GET | `/api/resources/analytics/trend` | Admin | Views by industry |
