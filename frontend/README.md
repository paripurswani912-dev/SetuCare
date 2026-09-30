# SetuCare Frontend 🏥

**SetuCare** is a unified, interoperable healthcare referral tracking platform bridging fragmented government systems (ABDM, RCH, ANMOL, HFR, e-Aushadhi). It enables ASHA/ANM frontline workers, medical officer doctors, facility administrators, and district health officers to monitor closed-loop patient care journeys.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js 18.x or higher
- SetuCare FastAPI backend running locally at `http://localhost:8000`

### 2. Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration (`.env.local`)
Create a `.env.local` file in the `frontend` root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Features & Capabilities

### 1. Role-Based Navigation & Dynamic Headers
- **Role Switcher**: Switch dynamically between `ASHA`, `DOCTOR`, `FACILITY_ADMIN`, `DISTRICT_MANAGER`, and `ADMIN`.
- **Custom User Name**: Editable username persisted in `localStorage`.
- **Role Headers**: Automatically injects `X-Role` and `X-User` headers in every API request.
- **Permission Guard**: On 403 response, surfaces *"Your role (X) is not allowed to do this"*.

### 2. Simulated Offline-First Engine
- **Online/Offline Pill Toggle**: Switch connectivity state on the fly.
- **Offline Queue**: When offline, all `POST`/`PATCH` mutations are safely stored in a local queue (`setucare_offline_queue`).
- **Sync Drawer**: Shows pending offline actions.
- **Automatic Sync**: Upon reconnecting, replays queued requests in sequence and toasts synchronization results.

### 3. Bilingual Support (English / हिन्दी)
- Toggle button in top bar switches navigation labels and page titles instantly.

### 4. Pages Overview
- **`/patients/new`**: Patient registration, duplicate check (handles 409 conflict card), and ABDM digital health consent management.
- **`/referrals/new`**: Triage helper matrix, resource matching (`GET /resources/match`), priority calculation, and QR code generation (`qrcode.react`).
- **`/referrals`**: Live referral inbox with priority sorting (EMERGENCY first), status filters, SLA countdown timer, and auto-refresh every 15s.
- **`/referrals/[id]`**: Unified tracking page featuring a 9-step horizontal stepper, vertical audit timeline, SMS/push notification bubbles, contextual action panel (enforcing valid next action by role), e-prescriptions, and stock lookup.
- **`/track/[id]`**: Public patient progress tracking page (no login required, privacy compliant, clean mobile layout for QR code scanning).
- **`/queue`**: Real-time facility resource queue auto-refreshing every 10s with emergency row highlights.
- **`/resources`**: Facility ICU bed, ambulance, and diagnostic equipment stock management with inline quantity editing.
- **`/medicines`**: e-Aushadhi DVDMS drug inventory stock lookup and prescription dispensing dialog.
- **`/dashboard`**: District Health Officer analytics with Recharts funnel & donut charts, KPI cards, SLA breach table, and one-click SLA escalation dispatch (`POST /sla/check`).
- **`/audit`**: Complete system audit log with client-side search and CSV export capability.

---

## 🎨 Tech Stack
- **Framework**: Next.js 14 App Router (TypeScript)
- **Styling**: Tailwind CSS v4 (Vanilla CSS variables)
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **QR Code**: `qrcode.react`
