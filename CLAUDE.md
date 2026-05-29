# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint
npm run seed      # Seed Firestore with sample data (seed-launcher.cjs)
```

No test suite is configured yet.

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ohresit
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GEMINI_API_KEY=your-gemini-api-key
```

`FIREBASE_SERVICE_ACCOUNT_KEY` is the full JSON string of the Firebase Admin service account — used only in Server Actions.  
`GEMINI_API_KEY` — get from [Google AI Studio](https://aistudio.google.com/app/apikey). Used for receipt OCR in `analyzeReceiptAction`.

## Architecture

### Two Firebase Clients
- `src/lib/firebase/client.ts` — browser SDK (`firebase/app`), exports `auth`, `db`, `storage`. Used in Client Components.
- `src/lib/firebase/admin.ts` — Admin SDK (`firebase-admin`), exports `auth`, `db`, `storage`. Used **only** in Server Actions (`"use server"`). Never import admin in client components.

### Data Model (`src/types/index.ts`)
Three core types:
- **`Transaction`** — the primary Firestore document (`/transactions/{id}`). Has optional `receipt` (AVIF metadata + OCR) and `compliance` (LHDN verification + eInvoiceRef) sub-objects.
- **`Receipt`** — embedded in Transaction; always `format: 'avif'`; stores `storagePath`, `downloadUrl`, and `ocrMetadata`.
- **`UserProfile`** — `/users/{uid}`; holds `settings.taxId` (TIN) and `settings.businessRegNo` (BRN) needed for LHDN.

### Server Actions (`src/actions/`)
Two-step receipt pipeline — user edits before committing:
- **`analyzeReceiptAction(formData, userId)`** — converts image to JPEG (for Gemini) and AVIF (for storage), uploads AVIF to Firebase Storage, calls `gemini-1.5-flash` Vision to extract `{ vendor, amount, date, category, rawText, confidence }`. Returns OCR data + storage URLs. Does **not** write to Firestore.
- **`saveTransactionAction(input)`** — takes user-confirmed fields and writes the `Transaction` document to Firestore. Called only when user clicks "Save Transaction" in the review step.
- **`lhdn-sync.ts`** — Real LHDN MyInvois integration. `syncWithLHDN(userId)` fetches OAuth2 token then calls `GET /api/v1.0/documents/recent`. `validateInvoice(txId, userId)` builds a minimal UBL 2.1 JSON document (8% SST, Malaysian format), base64-encodes it, and posts to `POST /api/v1.0/documentsubmissions`. On success, updates the transaction's `compliance.eInvoiceRef`. Production URL: `https://api.myinvois.hasil.gov.my`; preprod auto-selected outside `NODE_ENV=production`.
- **`save-settings.ts`** — `saveUserSettingsAction` (currency), `saveLhdnCredentialsAction` (TIN + BRN + clientId + clientSecret → `/users/{uid}`), `unlinkLhdnAction`.

### Page → Component Map
| Route | Page | Component |
|---|---|---|
| `/` | `app/page.tsx` | `components/dashboard/AnalyticsDashboard.tsx` |
| `/ledger` | `app/ledger/page.tsx` | `components/ledger/MobileLedger.tsx` |
| `/vault` | `app/vault/page.tsx` | `components/vault/ReceiptVault.tsx` |
| `/compliance` | `app/compliance/page.tsx` | `components/compliance/ComplianceTracker.tsx` |
| `/settings` | `app/settings/page.tsx` | _(inline)_ |

### Entry Flow Modal
`HybridEntryFlow.tsx` is a bottom-sheet modal with three internal steps: `CHOOSE → SCANNING → REVIEW`. It is opened/closed via `UIContext` (`src/lib/context/UIContext.tsx`), which is provided in `layout-wrapper.tsx`. The modal is triggered from the Navigation component.

### AVIF Policy
All receipts **must** go through Sharp before storage: `quality: 50`, `effort: 4`, max width `1600px`. This is enforced in `upload-receipt.ts` — do not bypass it.

### LHDN Compliance
- Malaysian e-Invois standard; targets LHDN MyInvois API.
- Tax rate assumed at 8% in PDF generation (`pdf-generator.ts`).
- TIN format: `CXXXXXXXXXX`; BRN format: `2024XXXXXXXX`.
- Preprod API: `https://preprod-api.myinvois.hasil.gov.my` (auto-selected when `NODE_ENV !== 'production'`).

## Key Conventions
- **Mobile-first**: write base styles for mobile, use `md:` prefixes for desktop.
- **Rounded, card-based UI**: consistent `rounded-[2rem]` / `rounded-[2.5rem]` border-radius; emerald green (`emerald-500/600`) is the primary brand colour.
- All components use `useTransactions(limit)` (`src/lib/hooks/useTransactions.ts`) — a real-time `onSnapshot` listener scoped to the signed-in user. Analytics are derived via `computeStats()` in the same file.
- Auth is provided via `AuthContext` (`src/lib/context/AuthContext.tsx`) — use `useAuth()` to get `user`, `signOut`, etc. in any Client Component.
- Route protection is handled by `AuthGuard` in `layout-wrapper.tsx`. Add paths to `PUBLIC_ROUTES` to exempt them from auth.
- On first sign-in (Google or email), a `/users/{uid}` Firestore document is auto-created with default settings.
