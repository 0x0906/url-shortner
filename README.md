# TrimURL 👋 — Premium URL Shortener & Analytics Suite

Have you ever looked at a massive, messy link and hesitated before sharing it? **TrimURL** turns long, unwieldy web addresses into sleek, memorable links—complete with real-time analytics, access controls, and custom branding.

Built with a fast **Express.js + TypeScript** backend and a responsive **React** frontend, TrimURL lets you track link clicks, analyze visitor demographics (browser, OS, device), and protect sensitive redirects with passwords or expiration dates.

---

## ✨ Features

- **⚡ Instant Shortening:** Shrink long URLs into clean, short codes in milliseconds.
- **🏷️ Custom Branding & Aliases:** Create branded links (e.g., `trimurl.com/my-launch`) that build trust with your audience.
- **📊 Real-Time Analytics:** Monitor click counts, visitor locations, operating systems, browsers, and device breakdowns.
- **📱 Dynamic QR Code Generator:** Instantly generate scannable QR codes for print, presentations, or business cards.
- **🛡️ Custom Access Controls:**
  - **Password Protection:** Lock destination links behind a secure password check.
  - **Self-Destructing (One-Time) Links:** Automatically deactivate URLs after their first click.
  - **Custom Expiration Dates:** Set links to expire after a specific date and time.
- **🌙 Glassmorphic Dark Mode:** High-contrast, polished dark UI designed for modern web apps.

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph TD
    A[React + Vite Frontend] -->|REST API Requests| B[Express.js + TypeScript Backend]
    B -->|Cookie & Header Authentication| C[JWT + bcryptjs Middleware]
    B -->|Fast Resolution Cache| D[LRU Cache]
    B -->|Data Models & Queries| E[PostgreSQL pg Pool]
    B -->|Transactional Emails| F[Nodemailer SMTP]
```

### Frontend
- **React & Vite:** Fast single-page application bundling.
- **Tailwind CSS:** Custom glassmorphic styling system.
- **Lucide Icons:** Minimalist UI icon set.

### Backend
- **Node.js & Express.js:** Fast, asynchronous HTTP REST API server.
- **TypeScript:** Type-safe development across models, controllers, routes, and services.
- **PostgreSQL (pg pool):** Lightweight, direct parameterized SQL queries with automatic table and index initialization.
- **Nodemailer:** Automated HTML account verification emails and password reset links.
- **JWT & HTTP-Only Cookies:** Secure, stateless session management with access and refresh tokens.
- **LRU Cache:** In-memory caching for instant short URL resolution.
- **Custom Rate Limiter:** Protects authentication and URL creation routes from abuse.

---

## 💻 Quick Start

### Prerequisites
Make sure you have installed:
- **Node.js (v18+)**
- **npm**
- **PostgreSQL Database** running on `localhost:5432`

---

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/URL_Shortner.git
cd URL_Shortner
```

---

### 2. Set Up the PostgreSQL Database
Create a database named `url_shortener` in PostgreSQL:
```sql
CREATE DATABASE url_shortener;
```

---

### 3. Configure & Start the Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update environment variables in `.env` if needed:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:123@localhost:5432/url_shortener
   JWT_SECRET=mySuperSecretKeyForJwtTokenGenerationThatIsLongEnough123456
   CLIENT_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000

   # Email configuration (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=TrimURL <noreply@trimurl.com>
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(Backend will start on `http://localhost:5000`)*

---

### 4. Start the React Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend dashboard will start on `http://localhost:5173`)*

---

## 🔌 REST API Overview

All protected routes authenticate users using HTTP-only cookies (`token` / `refreshToken`) or standard `Authorization: Bearer <token>` headers.

### 🔐 Authentication (`/api/auth`)

#### Register Account
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "Alex",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```

#### Current User Profile
- **GET** `/api/auth/me`

#### Logout
- **POST** `/api/auth/logout`

---

### 🔗 URLs (`/api/urls`)

#### Create Short Link
- **POST** `/api/urls`
- **Body:**
  ```json
  {
    "original_url": "https://wikipedia.org/wiki/Systems_architecture",
    "custom_alias": "systems-arch",
    "is_one_time": false,
    "expires_at": "2026-12-31T23:59:59Z"
  }
  ```

#### Get User URLs
- **GET** `/api/urls?search=&is_active=true&page=1&limit=10`

#### Update Link Options
- **PUT** `/api/urls/:id`

#### Delete Link
- **DELETE** `/api/urls/:id`

---

### 📊 Analytics (`/api/analytics`)

#### User Dashboard Summary
- **GET** `/api/analytics/dashboard`

#### Single Link Analytics
- **GET** `/api/analytics/url/:id`

---

### 🚀 Redirection
- **GET** `/:shortCode` — Redirects visitors to target destination while recording analytics asynchronously.

---

### 🩺 Health Checks
- **GET** `/health` (and `/api/health`) — Live status check and PostgreSQL connection health for Render and uptime monitoring.

---

## 📜 License

Distributed under the MIT License. Feel free to use, adapt, and build upon this project!
