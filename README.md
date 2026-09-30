# SetuCare 🏥
> **Unified Interoperable Healthcare Referral Platform**

SetuCare tracks healthcare referrals across fragmented government health systems (ABDM, RCH, ANMOL, HFR, e-Aushadhi, ORS) to provide a single, closed-loop referral journey for ASHA/ANM frontline workers, doctors, facility administrators, and district health managers.

---

## 🏗️ Architecture Overview

SetuCare is architected as a full-stack web application:

- **Backend (`/backend`)**: FastAPI (Python 3) + SQLAlchemy ORM + MySQL Database with custom role authorization (`X-Role`, `X-User`), automated SLA escalation engine, and audit logging.
- **Frontend (`/frontend`)**: Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + Recharts + `qrcode.react` + Simulated Offline Queue Engine.

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18.x+
- MySQL Server

---

### 2. Setting Up the Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Activate virtual environment (Windows)
..\venv\Scripts\activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Initialize Database Tables
python create_tables.py

# 5. Start the FastAPI Backend Server
uvicorn main:app --reload
```
The backend API will run live at: **`http://localhost:8000`**

#### Seed Sample Demo Data (Optional)
In a secondary terminal (while `uvicorn` is running):
```bash
cd backend
python seed_demo.py
```

---

### 3. Setting Up the Frontend

```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Verify environment configuration (.env.local)
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 4. Run Next.js Development Server
npm run dev
```
The frontend website will run live at: **`http://localhost:3000`**

---

## 🌟 Key Application Features

1. **Role Switcher & Custom Security Headers**:
   - Easily switch between `ASHA`, `DOCTOR`, `FACILITY_ADMIN`, `DISTRICT_MANAGER`, and `ADMIN` roles in the top navbar.
   - Automatically injects `X-Role` and `X-User` headers into all backend API calls.

2. **Simulated Offline-First Queue Engine**:
   - Header toggle switch for Online/Offline mode.
   - Saves offline `POST`/`PATCH` actions in a local queue (`setucare_offline_queue`).
   - Sync drawer allows inspecting queued actions and auto-replaying them when back online.

3. **Bilingual Navigation (EN / हिन्दी)**:
   - Instant language switcher for top navigation and page titles.

4. **11 Interoperable Healthcare Workflows**:
   - **`/patients/new`**: Patient registration, duplicate check (409 handling), and ABDM consent management.
   - **`/referrals/new`**: Clinical triage matrix helper, facility resource capacity auto-matching, and QR code generation.
   - **`/referrals`**: Live referral inbox sorted by severity (`EMERGENCY` first), status filters, SLA countdown timers, and 15s auto-refresh.
   - **`/referrals/[id]`**: 9-step horizontal lifecycle stepper, patient consent lock, contextual action panel, e-prescriptions, and stock lookup.
   - **`/track/[id]`**: Public patient tracking portal for scanned QR codes (privacy compliant).
   - **`/queue`**: Real-time facility queueing system auto-refreshing every 10s.
   - **`/resources`**: ICU bed, ambulance, and diagnostic resource availability management with inline quantity editing.
   - **`/medicines`**: e-Aushadhi drug inventory lookup and prescription dispensing dialog.
   - **`/dashboard`**: District Health Officer analytics console with Recharts charts, SLA breach table, and one-click SLA escalation dispatch (`POST /sla/check`).
   - **`/audit`**: Immutable audit log with client-side filtering and CSV export.

---

## 🚀 Cloud Deployment Guide (Render)

### Deploy Backend (FastAPI Web Service)
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Deploy Frontend (Next.js Web Service)
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variable**: `NEXT_PUBLIC_API_URL` = `https://<your-backend-render-url>.onrender.com`
