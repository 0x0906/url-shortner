# TrimURL - URL Shortener & Analytics

A full-stack URL shortener built with Express.js, TypeScript, PostgreSQL, and React. It supports custom link aliases, password-protected redirects, link expiration, dynamic QR codes, visitor analytics, and user authentication with email verification.

---

## Architecture

```mermaid
graph LR
    User[Browser / Client] --> Frontend[React + Vite Frontend]
    User -->|Open Short Link| Backend[Express Backend]
    Frontend -->|API Requests| Backend
    Backend -->|Read / Write| DB[(PostgreSQL Database)]
    Backend -->|Verification & Reset| Email[Resend API / SMTP]
```

---

## Features

- **URL Shortening**: Generate random 6-character short codes or set custom aliases (e.g. `yourdomain.com/launch`).
- **Visitor Analytics**: Track total clicks, daily click history, and breakdown by browser, OS, and device type.
- **Access Controls**:
  - **Password Protection**: Ask visitors for a password before redirecting.
  - **One-Time Links**: Automatically deactivate link after its first visit.
  - **Expiration Dates**: Set links to expire at a specific date and time.
- **QR Code Generator**: Generates downloadable QR codes for any shortened link.
- **User Authentication**:
  - Signup with email verification via **Resend HTTPS API** or **Nodemailer SMTP**.
  - Anti-spoofing protection (blocks `+alias` tricks and normalizes email dots/casing).
  - Secure JWT access and refresh tokens stored in HTTP-only cookies.
  - Device and session management (view active sessions or logout from all devices).
  - Password reset with time-limited email reset tokens.
- **Render Health Check**: `/health` and `/api/health` endpoints for uptime monitoring.

---

## Tech Stack & Packages

### Backend
- **Node.js & Express**: Web framework for building the REST API.
- **TypeScript**: Static typing for routes, models, and controllers.
- **pg**: Official PostgreSQL client pool with auto-initialization for tables and indexes on server start.
- **bcryptjs**: Hashes user passwords and link access passwords.
- **jsonwebtoken & cookie-parser**: Issues and reads JWT access and refresh tokens in HTTP-only cookies.
- **Email Service**: **Resend REST API** (HTTPS port 443, required for Render Free tier where SMTP ports are blocked) with **Nodemailer SMTP** fallback.
- **lru-cache**: High-speed in-memory cache to resolve short URLs quickly without hitting the database every time.
- **express-validator**: Middleware to validate request inputs (emails, URLs, passwords).
- **ua-parser-js**: Extracts visitor browser, operating system, and device from request headers.
- **dotenv**: Loads configuration from the `.env` file.

### Frontend
- **React 19 & Vite**: Fast development build and single-page application bundling.
- **React Router**: Client-side page routing and redirect handling.
- **Tailwind CSS**: Glassmorphic UI styling with dark mode support.
- **Axios**: HTTP client for API calls with cookie support.
- **qrcode.react**: Generates SVG/Canvas QR codes for links.
- **lucide-react**: Lightweight icon set.

---

## Environment Variables

### Backend (`backend/.env`)

Create a `.env` file in the `backend/` folder:

```env
PORT=5000

# PostgreSQL connection string (works with local Postgres, Supabase, Neon, or Render)
DATABASE_URL=postgresql://postgres:password@localhost:5432/url_shortener

# JWT Secret & Token Expirations
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# Client & Backend URLs (used for redirect links and email verification)
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Rate Limiting
RATE_LIMIT_API_MAX=150
RATE_LIMIT_API_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=30
RATE_LIMIT_AUTH_WINDOW_MS=900000

# Cache size
CACHE_MAX_SIZE=500

# -------------------------------------------------------------
# Email Configuration
# -------------------------------------------------------------
# Option 1: Resend API (RECOMMENDED for Render and cloud hosting)
# Render Free tier blocks outbound SMTP ports 25, 465, and 587.
# Resend uses standard HTTPS (port 443), so it delivers reliably.
# Sign up free at https://resend.com and paste your API key here:
RESEND_API_KEY=re_your_api_key_here

# Option 2: SMTP / Gmail (For local development or hosting without port blocks)
# If RESEND_API_KEY is not set, the backend falls back to SMTP:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=TrimURL <noreply@trimurl.com>
```

> **Render Deployment Tip:** When hosting the backend on Render Free Tier, you only need `RESEND_API_KEY` for emails. You can leave out all `SMTP_*` variables completely!

### Frontend (`frontend/.env`)

Optional for local development (Vite automatically proxies `/api` to `http://localhost:5000` via `vite.config.js`). For production deployment:

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm
- PostgreSQL database (local or free cloud database like Supabase/Neon)

---

### Step 1: Start the Backend

Open a terminal window:

```bash
# 1. Go to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file (copy from example and add your database URL)
cp env.example .env

# 4. Start backend dev server
npm run dev
```

The backend starts on `http://localhost:5000`. Database tables and indexes are automatically created on first run.

---

### Step 2: Start the Frontend

Open a **second** terminal window:

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start frontend dev server
npm run dev
```

The frontend dashboard starts on `http://localhost:5173`.

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account (sends email verification)
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout and clear session cookies
- `GET /api/auth/me` - Get current logged-in user profile
- `GET /api/auth/verify?token=...` - Verify email token
- `POST /api/auth/refresh` - Refresh access token using refresh cookie
- `GET /api/auth/sessions` - List active login sessions / devices
- `DELETE /api/auth/sessions/:id` - Terminate a specific session
- `POST /api/auth/logout-all` - Logout from all devices
- `POST /api/auth/forgot-password` - Send password reset link to email
- `POST /api/auth/reset-password` - Reset password with token

### URLs (`/api/urls`)
- `POST /api/urls` - Create shortened URL (supports alias, password, expiry, one-time)
- `GET /api/urls` - Get paginated list of user's URLs (with search and status filter)
- `PUT /api/urls/:id` - Update link settings (alias, password, expiry, active state)
- `DELETE /api/urls/:id` - Delete shortened URL
- `POST /api/urls/resolve/:shortCode` - Check password & get target URL for redirect

### Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` - Overall user summary (clicks, top links, chart, devices)
- `GET /api/analytics/url/:id` - Detailed analytics for a single URL

### Redirect & Health
- `GET /:shortCode` - 302 redirect to frontend redirect page
- `GET /health` (and `/api/health`) - Health check endpoint for Render deployment

---

## License

MIT License
