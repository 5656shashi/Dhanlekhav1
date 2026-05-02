# DhanLekha — Wealth Vault

Complete monorepo containing the React Native mobile app (SDK 54) and Node.js backend API.

## Repository Structure

```
DhanLekha/           ← React Native (Expo SDK 54)
DhanLekha_Backend/   ← Node.js + Express + PostgreSQL backend
```

---

## Quick Start

### Step 1 — Start the backend

```bash
cd DhanLekha_Backend

# Start PostgreSQL + Redis
docker-compose up postgres redis -d

# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev --name init

# Seed demo data
npm run prisma:seed

# Start development server
npm run dev
```

Backend starts at: http://localhost:3000

**Demo credentials (after seed):**
- Phone: +919876543210
- OTP: 123456 (dev mode)
- PIN: 123456

---

### Step 2 — Configure the frontend

Edit `DhanLekha/src/config/api.ts`:

```ts
// iOS Simulator:
export const API_BASE_URL = 'http://localhost:3000/api/v1';

// Android Emulator:
export const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';

// Physical device (same WiFi network):
export const API_BASE_URL = 'http://192.168.X.X:3000/api/v1';
```

### Step 3 — Run the mobile app

```bash
cd DhanLekha
npm install
npx expo start
```

Scan QR with Expo Go, or press `i` (iOS) / `a` (Android).

---

## Features

| Screen | Backend Endpoint |
|--------|-----------------|
| OTP Login | POST /auth/send-otp → POST /auth/verify-otp |
| Dashboard | GET /dashboard |
| Document Vault | GET/POST/DELETE /documents |
| AI Processing | GET /documents/:id/ocr |
| Blockchain Verify | POST/GET /documents/:id/blockchain |
| Nominees | GET/POST/PATCH/DELETE /nominees |
| NGO Nominees | GET /ngos |
| Connect Accounts | GET/POST/DELETE /accounts |
| Wealth Reports | GET/POST /reports |
| KYC Verification | POST /kyc/submit |
| Security Settings | GET/PATCH /security |
| Notifications | GET/PATCH /notifications |
| Profile | GET/PATCH /auth/me |

## Light / Dark Mode

Default is Light Mode. Toggle via:
- **Profile screen** → Dark Mode switch
- **Any header** → moon/sun icon (top right)
