# 🔐 Secure User Registration System

A full-stack MERN application demonstrating advanced cybersecurity best practices for user authentication and registration.

## 📌 Project Overview

This project implements a secure user registration and authentication system using MongoDB, Express.js, React.js, and Node.js. It demonstrates strong secure system design principles including multi-factor authentication, password policies, input validation, and real-time security monitoring.

## ⚙️ Features

### Authentication & Registration
- **User Registration** — Username, email, password with full client + server validation
- **Password Strength Meter** — Real-time visual feedback (Weak/Medium/Strong) with criteria checklist
- **Math-based CAPTCHA** — Prevents bot registrations
- **Google reCAPTCHA v3** — Invisible bot detection with risk scoring on registration and login
- **OTP Email Verification (2FA)** — 6-digit code valid for 5 minutes, required for both signup and login
- **Disposable Email Rejection** — Blocks temp/throwaway email providers

### Password Security
- **bcrypt Hashing** — 12 salt rounds, no plaintext storage
- **Password Expiry** — Configurable (default: 30 days), forced update on expiry
- **Password History** — Prevents reuse of last 3 passwords (stored as hashes)
- **Strength Requirements** — Min 8 chars, upper/lower/number/special, cannot contain username

### Account Security
- **JWT Authentication** — Access tokens (15min) + refresh tokens (7d, httpOnly cookie)
- **Account Lockout** — Locks after 5 failed attempts for 30 minutes
- **Login 2FA** — OTP required on every login

### Backend Security
- **Helmet.js** — Security HTTP headers including HSTS
- **Rate Limiting** — 100 req/15min global, 10 req/15min on auth endpoints
- **Input Sanitization** — NoSQL injection prevention via mongo-sanitize
- **HPP** — HTTP parameter pollution prevention
- **CORS** — Strict origin policy with credentials
- **Request Size Limiting** — 10kb max body size

### Security Dashboard
- Login history with timestamps and IP addresses
- Browser, OS, and device detection
- Failed login attempt tracking
- Suspicious activity alerts
- Password expiry status

## 🧪 Technologies Used

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Security | bcryptjs, JWT, Helmet, express-rate-limit, mongo-sanitize, hpp, Google reCAPTCHA v3 |
| Email | Nodemailer |
| Parsing | ua-parser-js (user agent detection) |
| Validation | express-validator |

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with App Password (for OTP emails)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Edit `frontend/.env`:

```env
REACT_APP_RECAPTCHA_V3_SITE_KEY=your_recaptcha_v3_site_key
# Optional when frontend and backend are hosted separately
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
```

If you deploy the frontend on Netlify and the backend elsewhere, set `REACT_APP_API_BASE_URL` to your backend URL before building.

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure_auth_db
JWT_SECRET=your_strong_random_secret_here
JWT_REFRESH_SECRET=another_strong_random_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:3000
RECAPTCHA_V3_SECRET_KEY=your_recaptcha_v3_secret_key
```

**Getting a Gmail App Password:**
1. Enable 2FA on your Google account
2. Go to Security → App Passwords
3. Generate a password for "Mail"

### 3. Deploy the backend

Your backend is a Node.js/Express app in `backend/`. It is ready for deployment and includes:

- `backend/server.js` — entry point
- `backend/package.json` — start script and dependencies
- `backend/Dockerfile` — Docker-ready container
- `backend/Procfile` — deploy helper for Heroku and similar hosts

#### Recommended deployment flow

1. Deploy the backend to a hosting service such as Render, Railway, Heroku, or a VPS.
2. Use the deployed backend URL as your API host, for example:

```env
REACT_APP_API_BASE_URL=https://your-backend-host.com/api
```

3. Set `CLIENT_URL=https://securesys.netlify.app` in your backend deployment environment so CORS allows requests from your frontend.
4. Configure `RECAPTCHA_V3_SECRET_KEY` in the backend deployment environment.

#### Example Render setup

- Service type: Web Service
- Branch: `main`
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `CLIENT_URL=https://securesys.netlify.app`
  - `RECAPTCHA_V3_SECRET_KEY`

#### Example Railway setup

- Connect your GitHub repo
- Select the `backend` folder as the project root
- Set the same environment variables
- Use the generated backend URL for `REACT_APP_API_BASE_URL`


## 🐳 Docker Setup (One Command)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### Quick Start

1. Configure your backend environment:
```bash
cd backend
cp .env.example .env
# Edit .env with your Gmail credentials, JWT secrets, and reCAPTCHA keys
```

2. (Optional) Set your reCAPTCHA v3 site key:
```bash
export RECAPTCHA_V3_SITE_KEY=your_site_key_here
```

3. Start everything:
```bash
docker-compose up --build
```

That's it! The app will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

To stop: `docker-compose down`
To stop and remove data: `docker-compose down -v`

### 3. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Backend runs on `http://localhost:5000`, Frontend on `http://localhost:3000`.

## 🔐 Security Measures Explained

### Password Hashing (bcrypt)
Passwords are hashed with bcrypt using 12 salt rounds before storage. The salt is automatically generated and embedded in the hash. Plain text passwords never touch the database.

### OTP System
- Random 6-digit codes generated with `crypto.randomInt()`
- OTPs are hashed with bcrypt before storage (not stored in plaintext)
- 5-minute expiry enforced at database level
- Maximum 5 verification attempts per OTP
- Auto-cleanup via MongoDB TTL index

### CAPTCHA
Server-side math-based CAPTCHA with in-memory storage. Each CAPTCHA has a unique ID and 5-minute expiry. Answers are validated server-side only.

### CSRF & XSS Protection
- Helmet.js sets security headers (X-Content-Type-Options, X-Frame-Options, CSP)
- HSTS enforced with 1-year max-age
- Strict CORS origin policy
- Input sanitization at middleware level
- mongo-sanitize prevents NoSQL injection (`$gt`, `$regex` attacks)

### JWT Strategy
- Short-lived access tokens (15min) in memory/localStorage
- Long-lived refresh tokens (7d) in httpOnly, secure, sameSite cookies
- Automatic token refresh via Axios interceptor
- Refresh token rotation on each use

## 📊 System Architecture

```
┌─────────────────────┐     ┌──────────────────────────────────┐
│    React Frontend    │────▶│        Express Backend           │
│                      │     │                                  │
│ • Registration Form  │     │ ┌────────────────────────────┐   │
│ • Login Form         │     │ │     Middleware Stack        │   │
│ • OTP Verification   │     │ │ • Helmet (security headers)│   │
│ • Password Strength  │     │ │ • Rate Limiter             │   │
│ • Security Dashboard │     │ │ • CORS                     │   │
│ • CAPTCHA Component  │     │ │ • mongo-sanitize           │   │
└─────────────────────┘     │ │ • express-validator        │   │
                             │ │ • JWT auth                 │   │
                             │ └────────────────────────────┘   │
                             │                                  │
                             │ ┌────────────────────────────┐   │
                             │ │     MongoDB Collections    │   │
                             │ │ • Users                    │   │
                             │ │ • PasswordHistory          │   │
                             │ │ • OTPs (TTL indexed)       │   │
                             │ │ • LoginActivity            │   │
                             │ └────────────────────────────┘   │
                             │                                  │
                             │ ┌────────────────────────────┐   │
                             │ │     Nodemailer             │   │
                             │ │ • OTP email delivery       │   │
                             │ └────────────────────────────┘   │
                             └──────────────────────────────────┘
```

## 📁 Project Structure

```
secure-auth-mern/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── disposableEmails.js    # Blocked email domains
│   ├── controllers/
│   │   ├── authController.js      # Register, login, OTP, CAPTCHA
│   │   └── userController.js      # Profile, password change, dashboard
│   ├── middleware/
│   │   ├── auth.js                # JWT protection middleware
│   │   ├── recaptcha.js           # reCAPTCHA v3 server verification
│   │   └── validate.js            # Input validation rules
│   ├── models/
│   │   ├── User.js                # User schema with bcrypt hooks
│   │   ├── OTP.js                 # OTP schema with TTL
│   │   ├── PasswordHistory.js     # Password reuse prevention
│   │   └── LoginActivity.js       # Security audit log
│   ├── routes/
│   │   ├── auth.js                # Auth endpoints
│   │   └── user.js                # User endpoints
│   ├── utils/
│   │   ├── captcha.js             # CAPTCHA generation & verification
│   │   ├── email.js               # Nodemailer OTP sender
│   │   └── tokens.js              # JWT generation & verification
│   ├── server.js                  # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Captcha.js         # Math CAPTCHA widget
│   │   │   ├── ReCaptchaV3.js     # Google reCAPTCHA v3 hook + badge
│   │   │   ├── OTPInput.js        # 6-digit OTP input
│   │   │   └── PasswordStrengthMeter.js
│   │   ├── pages/
│   │   │   ├── Register.js        # Registration with validation
│   │   │   ├── Login.js           # Login with lockout display
│   │   │   ├── VerifyOTP.js       # OTP verification for 2FA
│   │   │   ├── Dashboard.js       # Security monitoring dashboard
│   │   │   └── ChangePassword.js  # Password update with history check
│   │   ├── styles/
│   │   │   └── index.css          # Complete dark theme UI
│   │   ├── utils/
│   │   │   ├── api.js             # Axios instance with interceptors
│   │   │   └── passwordStrength.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## ⭐ Bonus Enhancements (Future)

- [x] Google reCAPTCHA v3 integration
- [ ] Biometric authentication simulation (WebAuthn)
- [ ] Admin panel for user monitoring
- [ ] Email alerts for suspicious login attempts
- [ ] Password breach checking (Have I Been Pwned API)
- [ ] Session management with device listing
- [ ] Geo-IP based suspicious login detection

## 📄 License

MIT License — Free to use for educational and commercial purposes.
