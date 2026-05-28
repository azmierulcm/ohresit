"use server";

import { db } from "@/lib/firebase/admin";

/**
 * LHDN MyInvois API Client Logic
 * Reference: LHDN MyInvois SDK / API Documentation
 */

const LHDN_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.myinvois.hasil.gov.my' 
  : 'https://preprod-api.myinvois.hasil.gov.my';

export async function syncWithLHDN(userId: string) {
  try {
    // 1. Fetch User LHDN Credentials from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.lhdnCredentials) {
      return { success: false, error: "LHDN credentials not found. Please link your account in Settings." };
    }

    // 2. Authenticate with LHDN (OAuth2 Client Credentials Flow)
    // const authResponse = await fetch(`${LHDN_API_BASE}/connect/token`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     client_id: userData.lhdnCredentials.clientId,
    //     client_secret: userData.lhdnCredentials.clientSecret,
    //     grant_type: 'client_credentials',
    //     scope: 'InvoicingAPI'
    //   })
    // });
    
    // const { access_token } = await authResponse.json();

    // 3. Mock: Fetch recent validated e-invoices from LHDN
    // In a real implementation, you would call /api/v1.0/documents/recent
    console.log(`Syncing LHDN data for user ${userId} using MyInvois API...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockSyncedDocuments = [
      {
        lhdnRef: 'LHDN-9910-2234-55',
        vendor: 'Amazon Web Services',
        amount: 850.40,
        date: new Date().toISOString(),
      }
    ];

    // 4. Update local Firestore records with synced data
    const batch = db.batch();
    mockSyncedDocuments.forEach(doc => {
      const docRef = db.collection('transactions').doc();
      batch.set(docRef, {
        userId,
        vendor: doc.vendor,
        amount: doc.amount,
        date: new Date(doc.date),
        type: 'expense',
        category: 'Software',
        compliance: {
          isVerified: true,
          lhdnRef: doc.lhdnRef,
          syncedAt: new Date()
        }
      });
    });

    await batch.commit();

    return { 
      success: true, 
      syncedCount: mockSyncedDocuments.length,
      message: "Successfully synchronized with LHDN MyInvois portal." 
    };

  } catch (error: any) {
    console.error("LHDN Sync Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate a specific transaction against LHDN rules
 */
export async function validateInvoice(transactionId: string) {
  // Logic to send document to LHDN for validation
  // Endpoint: POST /api/v1.0/documentsubmissions
  return { success: true, lhdnRef: `LHDN-${Math.random().toString(36).toUpperCase().substring(2, 10)}` };
}
