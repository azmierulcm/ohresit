"use server";

import sharp from "sharp";
import { storage, db } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";
import { Receipt } from "@/types";

export async function processReceiptAction(formData: FormData, userId: string) {
  try {
    const file = formData.get("receipt") as File;
    if (!file) throw new Error("No file uploaded");

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Convert to AVIF & Compress using Sharp
    // Optimized for OCR readability while keeping file size minimal
    const avifBuffer = await sharp(buffer)
      .avif({ quality: 50, effort: 4 }) 
      .resize(1600, null, { withoutEnlargement: true }) // Larger for OCR clarity
      .toBuffer();

    const fileId = nanoid();
    const fileName = `receipts/${userId}/${fileId}.avif`;
    const fileRef = storage.bucket().file(fileName);

    // 2. Save to Firebase Storage
    await fileRef.save(avifBuffer, { 
      contentType: "image/avif",
      metadata: {
        cacheControl: 'public, max-age=31536000',
        userId: userId,
      }
    });

    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    // 3. Mock OCR Pipeline
    // In a real scenario, you'd call Google Vision or OpenAI here
    const mockOcrData = {
      amount: 45.50,
      vendor: "Village Grocer",
      date: new Date().toISOString(),
      category: "Groceries",
      confidence: 0.98,
      rawText: "VILLAGE GROCER\nSTREET NAME\nTOTAL: RM 45.50\nCASH: 50.00\nCHANGE: 4.50"
    };

    const receiptData: Receipt = {
      storagePath: fileName,
      downloadUrl: url,
      format: 'avif',
      ocrMetadata: {
        rawText: mockOcrData.rawText,
        confidence: mockOcrData.confidence
      }
    };

    // 4. Create Transaction Record in Firestore
    const transactionRef = db.collection('transactions').doc();
    await transactionRef.set({
      userId,
      type: 'expense',
      category: mockOcrData.category,
      amount: mockOcrData.amount,
      date: new Date(mockOcrData.date),
      vendor: mockOcrData.vendor,
      description: `Scanned from receipt at ${mockOcrData.vendor}`,
      receipt: receiptData,
      compliance: {
        isVerified: true,
      },
      createdAt: new Date(),
    });

    return {
      success: true,
      transactionId: transactionRef.id,
      data: mockOcrData,
      url,
    };
  } catch (error: any) {
    console.error("Receipt processing error:", error);
    return { success: false, error: error.message };
  }
}
