# 🏥 DocBook — Production-Ready Doctor Appointment SaaS

> A full-stack, enterprise-grade MERN application with role-based access, Razorpay payments, real-time Socket.io notifications, and a full Admin Dashboard.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/cloud/atlas)

---

## 🏗 Architecture Overview

```mermaid
graph TD
    subgraph Frontend[React + Vite + Tailwind]
        A[Pages] --> B[React Context / AuthContext]
        B --> C[socket.io-client]
        A --> D[React Hook Form + Zod Validation]
    end

    subgraph Backend[Node.js + Express]
        E[Auth Routes] --> F[Controllers]
        G[Doctor Routes] --> F
        H[Appointment Routes] --> F
        I[Admin Routes] --> F
        F --> J[Mongoose Models]
        F --> K[Winston Logger]
        F --> L[Nodemailer]
        F --> M[Razorpay SDK]
        F --> N[node-cache]
    end

    subgraph Database[MongoDB Atlas]
        O[(Users)]
        P[(Doctors)]
        Q[(Appointments)]
        R[(Reviews)]
    end

    subgraph RealTime[Socket.io]
        S[Server-side Events]
        T[Client-side Listeners]
    end

    A -- "Axios REST calls" --> E
    A -- "Axios REST calls" --> G
    A -- "Axios REST calls" --> H
    J --> O
    J --> P
    J --> Q
    J --> R
    S -- "Emit to user room" --> T
    C --> T
```

---

## 🚀 Local Setup (VS Code on Mac)

### Prerequisites
- Node.js v18+ (`brew install node`)
- MongoDB Community (`brew install mongodb-community && brew services start mongodb-community`)
- Git

### 1. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**`backend/.env`** (already created — fill in your real keys):
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/doctor_booking

JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_pass

CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`**:
```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_your_key
```

### 3. Seed Dummy Data
```bash
cd backend
npm run data:import
```
This creates sample doctors and a patient account.

### 4. Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Visit → **http://localhost:5173**

### Health Check
```
GET http://localhost:5000/api/health
```

---

## 📂 Folder Structure

```
netflix/
├── backend/
│   ├── config/            # DB connection (db.js)
│   ├── controllers/       # Business logic (auth, doctor, appointment, admin, review)
│   ├── middlewares/       # JWT auth, RBAC roles, error handler
│   ├── models/            # Mongoose schemas with indexes (User, Doctor, Appointment, Review)
│   ├── routes/            # Express route definitions
│   ├── utils/             # logger.js, sendEmail.js, generateToken.js, validators.js
│   ├── logs/              # Winston log output (auto-generated)
│   ├── seeder.js          # Dummy data seed script
│   └── server.js          # Express app entry point (Helmet, CORS, Socket.io, Rate Limiting)
│
└── frontend/
    └── src/
        ├── components/    # Navbar, DoctorCard, Toast, Skeletons, ErrorBoundary
        ├── context/       # AuthContext with Socket.io integration
        ├── pages/         # Home, Login, Signup, DoctorListing, DoctorProfile,
        │                  # PatientDashboard, DoctorDashboard, AdminDashboard
        └── App.jsx        # Router with ProtectedRoute wrappers
```

### Data Flow
1. User submits form → **React Hook Form + Zod** validates schema on client
2. Axios POST → **Express Route** → **Zod Middleware** validates on server
3. Controller → **Mongoose Model** → **MongoDB Atlas**
4. On booking → **Razorpay order** created → signature verified → payment status saved
5. On status change → **Socket.io** emits to patient room → **Toast notification** fires
6. Emails dispatched via **Nodemailer** asynchronously
7. All errors caught by **Winston** → `/logs/` files

---

## 🌍 Deployment Guide

### MongoDB Atlas
1. Create cluster → **Network Access** → Allow `0.0.0.0/0` → Create DB user
2. Copy connection string: `mongodb+srv://USER:PASS@cluster.mongodb.net/doctor_booking`

### Backend → Render
1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root Directory: `backend` | Build: `npm install` | Start: `node server.js`
4. Add all `.env` variables in Render dashboard
5. Set `NODE_ENV=production` and `MONGO_URI=<atlas_string>`

### Frontend → Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Root Directory: `frontend` | Framework: Vite
3. Add `VITE_API_URL=https://your-render-url.onrender.com`
4. Add `VITE_RAZORPAY_KEY_ID=rzp_live_...`
5. Deploy → done!

---

## 🛡️ Production Launch Checklist

Before sharing the live link, ensure you have completed these steps:

### 1. Razorpay Live Mode
- Go to Razorpay Dashboard → **Settings** → **API Keys**.
- Generate **Live Keys** (starts with `rzp_live_`).
- Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in your backend environment variables.
- Update `VITE_RAZORPAY_KEY_ID` in Vercel environment variables.
- Update the **Webhook URL** in Razorpay Dashboard to `https://your-backend.onrender.com/api/appointments/razorpay-webhook`.

### 2. Custom Domain & HTTPS
- **Backend (Render)**: Go to **Settings** → **Custom Domains**. Render provides free SSL automatically once you point your `CNAME` or `A` record.
- **Frontend (Vercel)**: Go to **Settings** → **Domains**. Point your domain using Vercel's nameservers or `A` records. Vercel handles SSL/HTTPS renewal automatically.

### 3. Security Hardening
- [x] **Helmet & CSP**: Enabled in `server.js` to prevent XSS and clickjacking.
- [x] **Rate Limiting**: Configured to `100 requests / 15 mins` for production.
- [x] **Trust Proxy**: Enabled for Render/Railway load balancers.
- [x] **CORS**: Ensure `FRONTEND_URL` matches your final Vercel domain.

### 4. Monitoring & Logs
- **Backend Logs**: View real-time logs in the Render/Railway dashboard.
- **Error Tracking**: All system crashes and API errors are logged to `backend/logs/combined.log`. For professional tracking, integrate **Sentry.io**.
- **Health Check**: Regularly monitor `https://your-backend.onrender.com/api/health`.

### 5. Final Manual Testing
1. **Signup**: Register a new patient and a doctor.
2. **Approval**: Logistics: Login as Admin (`npm run data:import`) and approve the new doctor.
3. **Booking**: As a patient, book the approved doctor.
4. **Payment**: Complete a transaction (use Live mode card if testing real money, or stay in test mode for final validation).
5. **Webhook**: Verify that the appointment status changes to `confirmed` after payment completion.

---

## 📈 Performance Notes
- **API Optimization**: All heavy queries utilize MongoDB indexes.
- **Caching**: Admin analytics are cached for 5 minutes using `node-cache`.
- **Frontend**: Optimized with code-splitting and asset compression via Vite.

### Common Issues
| Issue | Fix |
|------|-----|
| CORS Error | Set `FRONTEND_URL` in backend `.env` to your Vercel URL |
| MongoDB connection refused | Whitelist `0.0.0.0/0` in Atlas Network Access |
| Socket.io not connecting | Ensure `FRONTEND_URL` is set and WebSocket transport is allowed |
| Razorpay signature mismatch | Verify `RAZORPAY_KEY_SECRET` matches what's in dashboard |

---

## 🔌 API Reference

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register-user` | Public | Register patient |
| POST | `/api/auth/register-doctor` | Public | Register doctor |
| POST | `/api/auth/login` | Public | Login (any role) |
| GET | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Public | Clear cookie + logout |
| GET | `/api/doctors` | Public | List doctors (pagination + filter) |
| GET | `/api/doctors/:id` | Public | Get doctor profile |
| GET | `/api/doctors/:id/reviews` | Public | Get reviews |
| POST | `/api/doctors/:id/reviews` | Patient | Submit review |
| POST | `/api/appointments` | Patient | Book appointment |
| POST | `/api/appointments/:id/razorpay-order` | Patient | Create Razorpay order |
| POST | `/api/appointments/verify-payment` | Patient | Verify Razorpay signature |
| GET | `/api/appointments/my` | Patient | My appointments |
| GET | `/api/appointments/doctor` | Doctor | Doctor's appointments |
| PUT | `/api/appointments/:id/status` | Doctor/Admin | Update status |
| GET | `/api/admin/analytics` | Admin | Dashboard stats |
| GET | `/api/admin/doctors` | Admin | All doctors |
| PUT | `/api/admin/doctors/:id/approve` | Admin | Approve/reject doctor |
| GET | `/api/admin/users` | Admin | All patients |
| DELETE | `/api/admin/users/:id` | Admin | Remove user |
| GET | `/api/admin/appointments` | Admin | All appointments |
| POST | `/api/upload` | Auth | Upload profile image |
| GET | `/api/health` | Public | Health check |

---

## 💼 Resume Description

**DocBook — Doctor Appointment Booking SaaS Platform**  
*React.js · Node.js · Express.js · MongoDB Atlas · Socket.io · Razorpay · Cloudinary · Tailwind CSS*

- Architected a production-grade MERN SaaS platform with role-based access control (Patient / Doctor / Admin), JWT + HttpOnly Refresh Token authentication, and Zod schema validation on both client and server.
- Integrated end-to-end Razorpay payment pipeline (order creation → HMAC signature verification → webhook-ready) with atomic double-booking prevention using MongoDB concurrency-safe queries.
- Built a real-time notification engine with Socket.io emitting per-user appointment status updates consumed by a toast notification system, enhancing user engagement with zero polling overhead.
- Engineered a full Admin Dashboard featuring MongoDB aggregation pipelines for revenue analytics, doctor approval workflows, and paginated user/appointment management — served with 5-minute server-side `node-cache` caching reducing DB load.
