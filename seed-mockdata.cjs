/**
 * Mock data seed for mainemirul@gmail.com
 * Usage: node seed-mockdata.cjs
 * Requires .env.local with FIREBASE_SERVICE_ACCOUNT_KEY
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// ── Init ──────────────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// ── Transactions ──────────────────────────────────────────────────────────────
const mockTransactions = [
  // Income
  { vendor: 'Monthly Salary',       amount: 8500.00, type: 'income',  category: 'Salary',       date: daysAgo(1),  verified: true,  lhdnRef: 'LHDN-2026-SAL-001' },
  { vendor: 'Freelance Project',    amount: 2200.00, type: 'income',  category: 'Freelance',    date: daysAgo(10), verified: false, lhdnRef: null },

  // Food & Drink
  { vendor: 'Village Grocer',       amount: 145.20,  type: 'expense', category: 'Food & Drink', date: daysAgo(0),  verified: true,  lhdnRef: 'LHDN-2026-VG-991' },
  { vendor: 'Starbucks KLCC',       amount: 28.50,   type: 'expense', category: 'Food & Drink', date: daysAgo(1),  verified: false, lhdnRef: null },
  { vendor: 'Grab Food',            amount: 32.40,   type: 'expense', category: 'Food & Drink', date: daysAgo(2),  verified: false, lhdnRef: null },
  { vendor: 'Nando\'s Mid Valley',  amount: 64.90,   type: 'expense', category: 'Food & Drink', date: daysAgo(3),  verified: false, lhdnRef: null },
  { vendor: 'MyNews Convenience',   amount: 12.80,   type: 'expense', category: 'Food & Drink', date: daysAgo(5),  verified: false, lhdnRef: null },
  { vendor: 'Tealive Bangsar',      amount: 15.00,   type: 'expense', category: 'Food & Drink', date: daysAgo(8),  verified: false, lhdnRef: null },

  // Transport
  { vendor: 'Shell Petrol',         amount: 80.00,   type: 'expense', category: 'Transport',    date: daysAgo(1),  verified: true,  lhdnRef: 'LHDN-2026-SH-772' },
  { vendor: 'Touch \'n Go Reload',  amount: 50.00,   type: 'expense', category: 'Transport',    date: daysAgo(4),  verified: false, lhdnRef: null },
  { vendor: 'Grab Car',             amount: 18.50,   type: 'expense', category: 'Transport',    date: daysAgo(6),  verified: false, lhdnRef: null },
  { vendor: 'Parking Pavilion KL',  amount: 8.00,    type: 'expense', category: 'Transport',    date: daysAgo(3),  verified: false, lhdnRef: null },

  // Utilities
  { vendor: 'TNB Electric Bill',    amount: 312.40,  type: 'expense', category: 'Utilities',    date: daysAgo(5),  verified: true,  lhdnRef: 'LHDN-2026-TNB-445' },
  { vendor: 'Unifi Home 500Mbps',   amount: 139.00,  type: 'expense', category: 'Utilities',    date: daysAgo(7),  verified: true,  lhdnRef: 'LHDN-2026-UNF-229' },
  { vendor: 'Air Selangor',         amount: 45.20,   type: 'expense', category: 'Utilities',    date: daysAgo(12), verified: false, lhdnRef: null },

  // Shopping
  { vendor: 'ZARA Pavilion',        amount: 299.00,  type: 'expense', category: 'Shopping',     date: daysAgo(6),  verified: false, lhdnRef: null },
  { vendor: 'Shopee',               amount: 87.50,   type: 'expense', category: 'Shopping',     date: daysAgo(9),  verified: false, lhdnRef: null },
  { vendor: 'IKEA Cheras',          amount: 560.00,  type: 'expense', category: 'Shopping',     date: daysAgo(14), verified: false, lhdnRef: null },

  // Software / Subscriptions
  { vendor: 'Netflix',              amount: 54.90,   type: 'expense', category: 'Software',     date: daysAgo(2),  verified: true,  lhdnRef: 'LHDN-2026-NFX-103' },
  { vendor: 'Spotify Premium',      amount: 17.90,   type: 'expense', category: 'Software',     date: daysAgo(5),  verified: false, lhdnRef: null },
  { vendor: 'Adobe Creative Cloud', amount: 89.90,   type: 'expense', category: 'Software',     date: daysAgo(8),  verified: true,  lhdnRef: 'LHDN-2026-ADO-334' },

  // Healthcare
  { vendor: 'Caring Pharmacy',      amount: 68.30,   type: 'expense', category: 'Healthcare',   date: daysAgo(4),  verified: false, lhdnRef: null },
  { vendor: 'KPJ Specialist Clinic',amount: 320.00,  type: 'expense', category: 'Healthcare',   date: daysAgo(11), verified: true,  lhdnRef: 'LHDN-2026-KPJ-881' },

  // Older transactions (last month)
  { vendor: 'Monthly Salary',       amount: 8500.00, type: 'income',  category: 'Salary',       date: daysAgo(32), verified: true,  lhdnRef: 'LHDN-2026-SAL-000' },
  { vendor: 'Village Grocer',       amount: 203.10,  type: 'expense', category: 'Food & Drink', date: daysAgo(28), verified: true,  lhdnRef: 'LHDN-2026-VG-880' },
  { vendor: 'Shell Petrol',         amount: 75.00,   type: 'expense', category: 'Transport',    date: daysAgo(30), verified: true,  lhdnRef: 'LHDN-2026-SH-654' },
  { vendor: 'TNB Electric Bill',    amount: 287.60,  type: 'expense', category: 'Utilities',    date: daysAgo(35), verified: true,  lhdnRef: 'LHDN-2026-TNB-389' },
  { vendor: 'Unifi Home 500Mbps',   amount: 139.00,  type: 'expense', category: 'Utilities',    date: daysAgo(37), verified: true,  lhdnRef: 'LHDN-2026-UNF-201' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding mock data for mainemirul@gmail.com...\n');

  // 1. Look up user UID by email
  let uid;
  try {
    const userRecord = await auth.getUserByEmail('mainemirul@gmail.com');
    uid = userRecord.uid;
    console.log(`✅ Found user: ${userRecord.displayName || userRecord.email} (${uid})`);
  } catch (err) {
    console.error('❌ User mainemirul@gmail.com not found in Firebase Auth.');
    console.error('   Make sure the user has signed in at least once via the app first.');
    process.exit(1);
  }

  // 2. Upsert user profile
  await db.collection('users').doc(uid).set({
    uid,
    email: 'mainemirul@gmail.com',
    displayName: 'Azmierul',
    settings: {
      currency: 'MYR',
      taxId: 'C210928370',
      businessRegNo: '202401029384',
    },
    lhdnCredentials: null,
    updatedAt: new Date(),
  }, { merge: true });
  console.log('✅ User profile upserted');

  // 3. Delete existing transactions for this user (clean slate)
  const existing = await db.collection('transactions').where('userId', '==', uid).get();
  if (!existing.empty) {
    const delBatch = db.batch();
    existing.docs.forEach(doc => delBatch.delete(doc.ref));
    await delBatch.commit();
    console.log(`🗑  Deleted ${existing.size} existing transactions`);
  }

  // 4. Write mock transactions
  const batch = db.batch();
  mockTransactions.forEach((tx) => {
    const ref = db.collection('transactions').doc();
    batch.set(ref, {
      userId: uid,
      vendor: tx.vendor,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: `${tx.vendor} — ${tx.category}`,
      compliance: {
        isVerified: tx.verified,
        eInvoiceRef: tx.lhdnRef || null,
      },
      createdAt: new Date(),
    });
  });

  await batch.commit();
  console.log(`✅ Inserted ${mockTransactions.length} transactions`);

  // 5. Summary
  const income = mockTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = mockTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const verified = mockTransactions.filter(t => t.verified).length;

  console.log('\n📊 Summary:');
  console.log(`   Income:      RM ${income.toFixed(2)}`);
  console.log(`   Expenses:    RM ${expense.toFixed(2)}`);
  console.log(`   Balance:     RM ${(income - expense).toFixed(2)}`);
  console.log(`   Verified:    ${verified} / ${mockTransactions.length} transactions`);
  console.log('\n🎉 Done! Open the app to see the data.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
