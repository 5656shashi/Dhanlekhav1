# DhanLekha Backend API — Complete Reference

**Base URL:** `http://localhost:3000/api/v1`  
**Auth:** `Authorization: Bearer <accessToken>`

---

## Authentication

### POST `/auth/send-otp`
Send OTP to phone number.
```json
{ "phone": "+919876543210", "type": "LOGIN" }
```
Response (dev): `{ "otp": "123456", "expiresAt": "..." }`

### POST `/auth/verify-otp`
Verify OTP and get tokens.
```json
{ "phone": "+919876543210", "code": "123456", "deviceId": "uuid" }
```
Response: `{ "accessToken": "...", "refreshToken": "...", "isNewUser": false, "user": {...} }`

### POST `/auth/verify-pin`
Login with PIN (after initial setup).
```json
{ "phone": "+919876543210", "pin": "123456" }
```

### POST `/auth/set-pin` 🔒
Set or change the user's PIN.
```json
{ "pin": "123456", "currentPin": "000000" }
```

### POST `/auth/refresh`
Refresh access token.
```json
{ "refreshToken": "..." }
```

### POST `/auth/logout` 🔒
Revoke current session.
```json
{ "refreshToken": "..." }
```

### GET `/auth/me` 🔒
Get current user profile with stats.

### PATCH `/auth/me` 🔒
Update name and email.
```json
{ "name": "Arjun Mehta", "email": "a@b.com" }
```

---

## Dashboard

### GET `/dashboard` 🔒
Returns net worth, asset breakdown, stats, and recent activity.

---

## Documents

### GET `/documents` 🔒
List documents with optional filters.
- Query: `?type=INSURANCE&status=ACTIVE&search=hdfc&page=1&limit=20`

### POST `/documents` 🔒
Upload a document (multipart/form-data).
- Fields: `file` (PDF/image), `title`, `docType`, `category`, `issuedBy`, `issuedDate`, `expiryDate`
- Triggers AI OCR processing asynchronously.

### GET `/documents/:id` 🔒
Get document details.

### GET `/documents/:id/ocr` 🔒
Get OCR/AI extraction results.
Response: `{ ocrStatus, ocrData: { documentType, policyNumber, holderName, ... }, ocrConfidence, fraudScore }`

### POST `/documents/:id/blockchain` 🔒
Submit document hash to Polygon blockchain.

### GET `/documents/:id/blockchain` 🔒
Get blockchain verification details (hash, txHash, blockNumber, explorer URL).

### GET `/documents/:id/download` 🔒
Download the original encrypted file.

### DELETE `/documents/:id` 🔒
Soft-delete a document.

---

## Nominees

### GET `/nominees` 🔒
List all nominees with total allocation %.

### POST `/nominees` 🔒
Add a nominee.
```json
{
  "name": "Rohan Sharma",
  "relation": "Son",
  "phone": "+919876543211",
  "email": "rohan@example.com",
  "nomineeType": "INDIVIDUAL",
  "accessType": "FULL_VAULT",
  "allocationPct": 60
}
```

### POST `/nominees` (NGO)
```json
{
  "name": "GiveIndia Foundation",
  "relation": "NGO",
  "nomineeType": "NGO",
  "ngoName": "GiveIndia",
  "ngoRegNo": "NGO/MH/2001/12345",
  "accessType": "READ_ONLY",
  "allocationPct": 10
}
```

### PATCH `/nominees/:id` 🔒
Update nominee details or allocation.

### DELETE `/nominees/:id` 🔒
Revoke nominee (triggers smart contract update).

### POST `/nominees/:nomineeId/documents/:documentId` 🔒
Grant a specific document to a nominee.

### GET `/ngos` 🔒
List verified NGO partners (GiveIndia, CRY, Goonj, etc.).

---

## Connected Accounts

### GET `/accounts` 🔒
List connected financial accounts with holdings.

### POST `/accounts` 🔒
Connect a new account.
```json
{ "provider": "zerodha", "providerName": "Zerodha", "accountType": "BROKER" }
```

### DELETE `/accounts/:id` 🔒
Disconnect an account.

### POST `/accounts/:id/sync` 🔒
Force re-sync holdings for an account.

---

## Wealth Reports

### GET `/reports` 🔒
List all generated reports.

### POST `/reports` 🔒
Generate a new wealth report.
```json
{
  "title": "Loan Application Report",
  "includeNetworth": true,
  "expiryDays": 30,
  "assets": [
    { "name": "HDFC FD", "type": "FIXED_DEPOSIT", "value": 2500000, "documentId": "uuid" },
    { "name": "Zerodha Portfolio", "type": "STOCKS", "value": 5602500 }
  ]
}
```
Response includes `shareUrl` and `qrCode` (base64 data URL).

### GET `/reports/:id` 🔒
Get report details.

### GET `/verify/:token` (Public)
Verify a shared report by token.

---

## KYC

### POST `/kyc/submit` 🔒
Submit KYC documents.
```json
{ "aadhaar": "1234 5678 9012", "pan": "ABCDE1234F", "dob": "1990-01-15" }
```

### GET `/kyc/status` 🔒
Get KYC verification status.

---

## Security

### GET `/security` 🔒
Get security settings and active sessions.

### PATCH `/security` 🔒
Update security preferences.
```json
{ "biometricEnabled": true, "deadManEnabled": true, "deadManDays": 180 }
```

### POST `/security/revoke-sessions` 🔒
Revoke all other active sessions (sign out of all devices).

---

## Notifications

### GET `/notifications` 🔒
List notifications with unread count.
- Query: `?page=1&limit=20`

### PATCH `/notifications/:id/read` 🔒
Mark a notification as read.

### PATCH `/notifications/read-all` 🔒
Mark all notifications as read.

---

## Document Types
`INSURANCE` | `FIXED_DEPOSIT` | `PROPERTY` | `MUTUAL_FUND` | `STOCK_CERTIFICATE` | `WILL` | `BANK_STATEMENT` | `PAN_CARD` | `AADHAAR` | `PASSPORT` | `OTHER`

## Access Types
`READ_ONLY` | `PARTIAL` | `FULL_VAULT`

## Status Values
- **KYC:** `PENDING` → `SUBMITTED` → `VERIFIED` | `REJECTED`
- **OCR:** `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`
- **Blockchain:** `UNVERIFIED` → `PENDING_TX` → `VERIFIED` | `FAILED`

---

## Error Codes
| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (KYC/plan required) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 410 | Gone (report expired) |
| 413 | Payload too large (file >20MB) |
| 422 | Unprocessable (validation) |
| 429 | Rate limited |
| 500 | Server error |

---

## Quick Start

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env
# Edit .env with your DB url, JWT secrets, etc.

# 3. Start PostgreSQL (Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=dhanlekha postgres:15

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed demo data
npm run prisma:seed

# 6. Start server
npm run dev

# Test health
curl http://localhost:3000/api/v1/health
```

## Demo Credentials (after seeding)
- **Phone:** `+919876543210`
- **OTP:** `123456` (dev mode always returns this)
- **PIN:** `123456`
