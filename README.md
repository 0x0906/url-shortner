# Hey there! Welcome to TrimURL 👋

Ever looked at a massive, ugly link and thought, *"I can't send this to someone?"* That's exactly why **TrimURL** exists. It's a modern, full-stack URL shortener that doesn't just shrink your links—it supercharges them. 

Built from the ground up with a sleek, distraction-free interface, TrimURL lets you track exactly who is clicking your links, from what devices, and from what browsers. Plus, it packs advanced features like password protection, custom aliases, and self-destructing one-time links. 

---

## ✨ What can it do?

- **Shrink It:** Turn massive URLs into clean, short links instantly.
- **Make It Yours:** Use custom aliases (like `trimurl.com/my-launch`) so people know exactly what they're clicking.
- **Track Everything:** Get deep, real-time analytics. We're talking total clicks, browser breakdowns, OS stats, and device types.
- **QR Codes on Demand:** Instantly download scannable QR codes for your flyers, presentations, or business cards.
- **Lock It Down:** 
  - Need to share something private? Throw a **password** on the link.
  - Only want it viewed once? Create a **One-Time Link** that self-destructs after the first click.
  - Time-sensitive? Set an **expiration date**.
- **Dark Mode by Default:** A beautiful, high-contrast UI that looks amazing in both light and dark modes.

---

## 🛠️ What's under the hood?

I wanted this app to be fast, reliable, and easy to maintain. Here is the tech stack powering TrimURL:

**The Frontend:**
- **React & Vite:** For a lightning-fast single-page application experience.
- **Tailwind CSS:** To craft that sleek, modern, glass-like UI without writing endless CSS files.
- **Lucide React:** For beautiful, minimal icons.
- **React Router:** For seamless client-side navigation.

**The Backend & Database:**
- **Node.js & Express:** The workhorse handling all API requests and redirects.
- **PostgreSQL:** A rock-solid relational database to store users, URLs, and every single click event.
- **Prisma:** A modern ORM that makes interacting with the database a breeze.
- **JWT (JSON Web Tokens):** For secure, stateless user authentication.
- **Nodemailer:** To handle transactional emails like password resets.

---

## 💻 Running it on your machine

Want to play around with the code or host it yourself? It's pretty straightforward. You'll need **Node.js** (v18+ is best) and a **PostgreSQL** database running.

### 1. Grab the code
```bash
git clone https://github.com/yourusername/URL_Shortner.git
cd URL_Shortner
```

### 2. Boot up the Backend
First, let's get the server running. Head into the backend folder:
```bash
cd backend
npm install
```

You'll need to tell the app how to connect to your database and handle secrets. Create a file named `.env` inside the `backend` folder and fill it in:
```env
# The port your backend will run on
PORT=5000

# Your Postgres connection string
DATABASE_URL="postgresql://username:password@localhost:5432/trimurl?schema=public"

# Make up some random strings for these!
JWT_SECRET="super_secret_key_here"
JWT_REFRESH_SECRET="another_super_secret_key_here"

# Where your frontend lives
FRONTEND_URL="http://localhost:5173"

# Email config (for password resets and verification)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your_email@example.com"
SMTP_PASS="your_email_password"
```

Next, sync up your database tables using Prisma:
```bash
npx prisma generate
npx prisma db push
```

And finally, start the engine:
```bash
npm run dev
```
*(Your backend is now listening on `http://localhost:5000`)*

### 3. Boot up the Frontend
Open a completely new terminal window, and let's get the UI running:
```bash
cd frontend
npm install
npm run dev
```
*(Your frontend is now live at `http://localhost:5173`)*

Open that URL in your browser, and you're good to go! 🎉

---

## 🔌 API Documentation

If you want to build your own frontend or integrate TrimURL into another app, here is a quick cheat sheet for the main REST API endpoints.

> **Note:** Most of these routes require an `Authorization` header containing your JWT Bearer token (except for logging in, registering, and resolving links).

### 🔐 Authentication (`/api/auth`)
- `POST /register` — Create a new account. Requires `name`, `email`, and `password`.
- `POST /login` — Log in and receive your access/refresh tokens. Requires `email` and `password`.
- `POST /logout` — Log out of your current session.
- `GET /sessions` — View all the devices/browsers currently logged into your account.
- `DELETE /sessions/:sessionId` — Log out a specific device remotely.
- `DELETE /sessions` — Log out of *all* devices at once.
- `POST /forgot-password` — Send a password reset email.
- `POST /reset-password` — Set a new password using an emailed token.
- `POST /change-password` — Change your password while logged in.

### 🔗 URLs (`/api/urls`)
- `POST /` — Shorten a new URL. 
  - *Body:* `original_url` (required), `custom_alias`, `expires_at`, `password`, `is_one_time`.
- `GET /` — Fetch a paginated list of all your shortened URLs.
- `PUT /:id` — Update settings for a specific URL (like toggling it active/inactive).
- `DELETE /:id` — Permanently delete a short link.
- `POST /resolve/:shortCode` — Resolve a password-protected link to get the original destination.

### 📊 Analytics (`/api/analytics`)
- `GET /dashboard` — Get high-level stats for your dashboard (total clicks, recent activity, top links).
- `GET /url/:id` — Get deep-dive analytics for a specific link (timeline graphs, device, and browser breakdowns).

### 🚀 Redirection
- `GET /:shortCode` — **This is the magic route!** Visiting `http://localhost:5000/your-alias` automatically tracks the click, figures out the user's browser/device, and redirects them to the original massive URL.

---
## 📷 Screenshots
<img width="1919" height="2984" alt="1" src="https://github.com/user-attachments/assets/7e63fcbd-4f64-4489-8738-e41e9cb7dbd9" />
<img width="1919" height="1979" alt="2" src="https://github.com/user-attachments/assets/723c8b85-01e2-4238-bbfc-6833ec99f13e" />
<img width="1919" height="1979" alt="3" src="https://github.com/user-attachments/assets/32d16247-47d7-4477-a4bd-7c9082e3b7df" />
<img width="1919" height="1979" alt="4" src="https://github.com/user-attachments/assets/e68bb397-4c24-407f-819c-956767d37396" />
<img width="1919" height="1979" alt="5" src="https://github.com/user-attachments/assets/59c9755d-febc-4670-ab7e-255e6933dc03" />
<img width="1919" height="1979" alt="6" src="https://github.com/user-attachments/assets/32b348a8-a00d-4572-a90c-758a30a283a7" />
<img width="1919" height="1979" alt="7" src="https://github.com/user-attachments/assets/d952a163-d4cd-4d2b-b7bd-de4543ad3a2c" />


---

## 📜 License

Feel free to use, modify, and distribute this project however you like! It's licensed under the MIT License.
