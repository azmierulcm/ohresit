import { db } from "./src/lib/firebase/admin";

/**
 * SEED SCRIPT: Run this to initialize your Firestore with default data.
 * Usage: node seed.js (Requires FIREBASE_SERVICE_ACCOUNT_KEY in your env)
 */

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
        createdAt: new Date(),
      });
    });

    // 2. Seed a Demo User (Optional - replace 'demo-user' with a real UID if known)
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
      createdAt: new Date()
    });

    // 3. Seed initial transactions for the demo user
    console.log("📝 Seeding Initial Transactions...");
    const transactions = [
      {
        userId: demoUserId,
        vendor: 'Starbucks',
        amount: 18.50,
        type: 'expense',
        category: 'Food & Drink',
        date: new Date(),
        compliance: { isVerified: true }
      },
      {
        userId: demoUserId,
        vendor: 'Monthly Salary',
        amount: 8500.00,
        type: 'income',
        category: 'Salary',
        date: new Date(),
        compliance: { isVerified: false }
      }
    ];

    transactions.forEach(t => {
      const tRef = db.collection('transactions').doc();
      batch.set(tRef, { ...t, createdAt: new Date() });
    });

    await batch.commit();
    console.log("✅ Database Seeded Successfully!");
    
  } catch (error) {
    console.error("❌ Seed Failed:", error);
  }
}

seedDatabase();
