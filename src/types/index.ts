export interface Receipt {
  storagePath: string;
  downloadUrl: string;
  format: 'avif';
  ocrMetadata?: {
    rawText: string;
    confidence: number;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  category: string;
  amount: number;
  date: any; // Firestore Timestamp
  vendor: string;
  description: string;
  receipt?: Receipt;
  compliance?: {
    isVerified: boolean;
    eInvoiceRef?: string;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  settings: {
    currency: string;
    taxId?: string;        // TIN e.g. C210928370
    businessRegNo?: string; // BRN e.g. 202401029384
  };
  lhdnCredentials?: {
    clientId: string;
    clientSecret: string;
    isLinked: boolean;
    linkedAt?: any;   // Firestore Timestamp
    lastSynced?: any; // Firestore Timestamp
  };
}
