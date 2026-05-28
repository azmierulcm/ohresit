require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Parse the service account from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();

const DEFAULT_CATEGORIES = [
  { name: 'Food & Drink', icon: 'Utensils', color: '#10b981' },
  { name: 'Transport', icon: 'Car', color: '#0ea5e9' },
  { name: 'Utilities', icon: 'Zap', color: '#f59e0b' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#f43f5e' },
  { name: 'Health', icon: 'HeartPulse', color: '#8b5cf6' },
  { name: 'Personal', icon: 'User', color: '#64748b' },
];

async function seedDatabase() {
  console.log("🚀 Starting Database Seed...");

  try {
    const batch = db.batch();

    // 1. Seed Global Categories
    console.log("📂 Seeding Categories...");
    DEFAULT_CATEGORIES.forEach((cat) => {
      const catRef = db.collection('categories').doc(cat.name.toLowerCase().replace(/\s+/g, '-'));
      batch.set(catRef, {
        ...cat,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // 2. Seed a Demo User
    const demoUserId = 'demo-user-123';
    console.log(`👤 Seeding Demo User: ${demoUserId}...`);
    
    const userRef = db.collection('users').doc(demoUserId);
    batch.set(userRef, {
      uid: demoUserId,
      email: 'demo@finvault.com',
      displayName: 'Demo User',
      settings: {
        currency: 'MYR',
        taxId: 'C1234567890',
        businessRegNo: '202401012345'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Seed initial transactions
    console.log("📝 Seeding Initial Transactions...");
    const transactions = [
      {
        userId: demoUserId,
        vendor: 'Starbucks',
        amount: 18.50,
        type: 'expense',
        category: 'Food & Drink',
        date: admin.firestore.Timestamp.now(),
        compliance: { isVerified: true }
      },
      {
        userId: demoUserId,
        vendor: 'Monthly Salary',
        amount: 8500.00,
        type: 'income',
        category: 'Salary',
        date: admin.firestore.Timestamp.now(),
        compliance: { isVerified: false }
      }
    ];

    transactions.forEach(t => {
      const tRef = db.collection('transactions').doc();
      batch.set(tRef, { ...t, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
    console.log("✅ Database Seeded Successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Seed Failed:", error);
    process.exit(1);
  }
}

seedDatabase();
