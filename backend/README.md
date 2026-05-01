# DhanLekha Backend API

Node.js + TypeScript + PostgreSQL backend for the DhanLekha Wealth Vault mobile app.

## Stack
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Cache / Rate-limit:** Redis
- **Auth:** JWT (access + refresh tokens) + bcrypt PINs
- **File Storage:** Local disk (swap to AWS S3 via `STORAGE_PROVIDER=s3`)
- **Encryption:** AES-256 (per-document keys)
- **Blockchain:** Polygon via ethers.js (pluggable)
- **Cron:** node-cron (Dead-Man Switch)

## Quick Start (2 minutes)

```bash
# Prerequisites: Node 18+, Docker

cd DhanLekha_Backend

# Start PostgreSQL + Redis
docker-compose up postgres redis -d

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit DATABASE_URL if needed (default works with docker-compose)

# Run DB migrations
npx prisma migrate dev --name init

# Seed demo data
npm run prisma:seed

# Start dev server
npm run dev
```

Server starts at `http://localhost:3000`

**Demo login:** phone `+919876543210`, OTP `123456` (dev mode)

## Project Structure

```
src/
├── index.ts              # Server entry + graceful shutdown
├── app.ts                # Express app setup (middleware, routes)
├── config/
│   ├── env.ts            # Typed config from environment
│   └── prisma.ts         # Prisma client singleton
├── routes/
│   └── index.ts          # All API routes (auth, docs, nominees, etc.)
├── controllers/
│   ├── auth.controller.ts       # OTP, PIN, JWT, me
│   ├── document.controller.ts   # Upload, OCR, blockchain
│   ├── nominee.controller.ts    # CRUD, NGO, access grants
│   └── misc.controller.ts       # Accounts, reports, KYC, security, notifications, dashboard
├── middleware/
│   ├── auth.ts           # JWT authenticate, requireKYC, requirePro
│   └── errorHandler.ts   # Global error + validation handler
├── services/
│   └── deadManSwitch.ts  # Cron: inactivity alerts + nominee trigger
└── utils/
    ├── crypto.ts         # AES-256, SHA-256, OTP gen, masking
    ├── jwt.ts            # Sign/verify access & refresh tokens
    ├── logger.ts         # Winston logger
    └── response.ts       # Typed API response helpers
prisma/
├── schema.prisma         # Full DB schema (12 models, 15 enums)
└── seed.ts               # Demo user, docs, nominees, accounts
docs/
└── API.md                # Full endpoint reference
```

## Key API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/send-otp` | — | Send OTP |
| POST | `/api/v1/auth/verify-otp` | — | Login / Register |
| POST | `/api/v1/auth/verify-pin` | — | PIN login |
| GET | `/api/v1/dashboard` | ✅ | Net worth + stats |
| GET | `/api/v1/documents` | ✅ | List vault docs |
| POST | `/api/v1/documents` | ✅ | Upload + OCR |
| POST | `/api/v1/documents/:id/blockchain` | ✅ | Hash to Polygon |
| GET | `/api/v1/nominees` | ✅ | List nominees |
| POST | `/api/v1/nominees` | ✅ | Add individual/NGO |
| GET | `/api/v1/accounts` | ✅ | Portfolio accounts |
| POST | `/api/v1/reports` | ✅ | Generate wealth report |
| GET | `/api/v1/verify/:token` | — | Public report verify |
| POST | `/api/v1/kyc/submit` | ✅ | Submit KYC |
| GET | `/api/v1/security` | ✅ | Security settings |
| GET | `/api/v1/notifications` | ✅ | Notifications |

Full docs → `docs/API.md`

## Production Deployment

```bash
# Build
npm run build

# With Docker Compose (full stack)
docker-compose up --build -d

# Or just API (with external DB/Redis)
node dist/index.js
```

## Connecting to the React Native App

In `DhanLekha/src/config/env.ts` (or a similar config file), set:
```typescript
export const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api/v1';
```

For local dev with Expo Go on a physical device, use your machine's LAN IP (e.g. `192.168.1.x`), not `localhost`.
