# Budget & E-Invois Tracker - Engineering Docs

This project is a high-performance, mobile-first financial management system compliant with LHDN Malaysia e-Invois standards.

## 🏗️ Architecture
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (Airbnb Design Language)
- **Database/Auth**: Firebase (Firestore, Storage, Auth)
- **Image Processing**: `sharp` (AVIF conversion for OCR optimization)
- **PDF Generation**: `jsPDF` + `autotable`

## 📂 Core Modules
1. **Hybrid Entry Flow**: `src/components/ledger/HybridEntryFlow.tsx` - Handles OCR and manual entry.
2. **AI Receipt Vault**: `src/app/vault/page.tsx` - Searchable AVIF receipt storage.
3. **Compliance Tracker**: `src/app/compliance/page.tsx` - LHDN validation and PDF generation.
4. **Analytics**: `src/app/page.tsx` - Interactive spending trends using Recharts.

## 🛠️ Setup Instructions
1. Install dependencies: `npm install`
2. Configure `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-id
   FIREBASE_SERVICE_ACCOUNT_KEY='{...}'
   ```
3. Run development server: `npm run dev`

## 🚀 Key Patterns
- **Mobile-First**: Use `md:` prefixes in Tailwind to expand from mobile to desktop.
- **Server Actions**: Use `src/actions/upload-receipt.ts` for secure, heavy processing (Sharp/OCR).
- **AVIF Policy**: All receipts must be converted to AVIF (quality 50) before storage to optimize for cost and OCR clarity.
