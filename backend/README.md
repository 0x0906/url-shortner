# TrimURL Backend API

Express.js + TypeScript REST API server for URL shortening, real-time analytics, and secure link access.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `env.example` to `.env` and update your PostgreSQL connection:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/url_shortener
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Email Configuration (Choose one)
# Option 1: Resend API (Recommended for Render Free tier - uses HTTPS, no port blocking)
RESEND_API_KEY=re_your_api_key_here

# Option 2: SMTP (For local development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

## Health Check
- `GET /health` (and `GET /api/health`) — Used by Render and uptime pingers.
