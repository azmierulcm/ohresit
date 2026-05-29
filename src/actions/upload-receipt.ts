"use server";

import sharp from "sharp";
import { storage, db } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Receipt } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OcrResult {
  vendor: string;
  amount: number;
  date: string;        // ISO string
  category: string;
  rawText: string;
  confidence: number;
}

export interface AnalyzeResult {
  success: true;
  ocr: OcrResult;
  receipt: {
    storagePath: string;
    downloadUrl: string;
  };
}

export interface SaveTransactionInput {
  userId: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  notes: string;
  receipt: {
    storagePath: string;
    downloadUrl: string;
  };
  rawText: string;
  confidence: number;
}

// ─── Step 1: Analyze receipt (OCR + Storage, no Firestore write) ─────────────

export async function analyzeReceiptAction(
  formData: FormData,
  userId: string
): Promise<AnalyzeResult | { success: false; error: string }> {
  try {
    const file = formData.get("receipt") as File;
    if (!file) throw new Error("No file uploaded.");

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // Convert to JPEG for Gemini Vision (AVIF not supported by Gemini)
    const jpegBuffer = await sharp(originalBuffer)
      .jpeg({ quality: 85 })
      .resize(1600, null, { withoutEnlargement: true })
      .toBuffer();

    // Convert to AVIF for Firebase Storage (smaller, OCR-optimised)
    const avifBuffer = await sharp(originalBuffer)
      .avif({ quality: 50, effort: 4 })
      .resize(1600, null, { withoutEnlargement: true })
      .toBuffer();

    // Upload AVIF to Firebase Storage
    const fileId = nanoid();
    const fileName = `receipts/${userId}/${fileId}.avif`;
    const fileRef = storage.bucket().file(fileName);

    await fileRef.save(avifBuffer, {
      contentType: "image/avif",
      metadata: {
        cacheControl: "public, max-age=31536000",
        userId,
      },
    });

    const [downloadUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    // Run Gemini Vision OCR on the JPEG
    const ocr = await runGeminiOcr(jpegBuffer);

    return {
      success: true,
      ocr,
      receipt: { storagePath: fileName, downloadUrl },
    };
  } catch (error: any) {
    console.error("analyzeReceiptAction error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Step 2: Save confirmed transaction to Firestore ─────────────────────────

export async function saveTransactionAction(
  input: SaveTransactionInput
): Promise<{ success: true; transactionId: string } | { success: false; error: string }> {
  try {
    const hasReceipt = !!input.receipt?.storagePath;

    const receiptData: Receipt | null = hasReceipt
      ? {
          storagePath: input.receipt.storagePath,
          downloadUrl: input.receipt.downloadUrl,
          format: "avif",
          ocrMetadata: {
            rawText: input.rawText,
            confidence: input.confidence,
          },
        }
      : null;

    const transactionRef = db.collection("transactions").doc();
    const txData: any = {
      userId: input.userId,
      type: "expense",
      category: input.category,
      amount: Number(input.amount),
      date: new Date(input.date),
      vendor: input.vendor,
      description: input.notes || `${input.vendor} — ${input.category}`,
      compliance: { isVerified: false },
      createdAt: new Date(),
    };
    if (receiptData) txData.receipt = receiptData;

    await transactionRef.set(txData);

    return { success: true, transactionId: transactionRef.id };
  } catch (error: any) {
    console.error("saveTransactionAction error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Gemini Vision OCR ───────────────────────────────────────────────────────

async function runGeminiOcr(jpegBuffer: Buffer): Promise<OcrResult> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[OCR] GEMINI_API_KEY not set — returning empty OCR result for manual review.");
    return {
      vendor: "",
      amount: 0,
      date: new Date().toISOString(),
      category: "Other",
      rawText: "",
      confidence: 0,
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an expert at reading Malaysian receipts. Analyze this receipt image and extract the data below.

Respond with ONLY valid JSON matching this exact shape (no markdown, no code block):
{
  "vendor": "business name shown on receipt",
  "amount": <total amount as a number, MYR, no currency symbol>,
  "date": "<ISO 8601 date string, e.g. 2026-05-30T00:00:00.000Z>",
  "category": "<one of: Food & Drink, Transport, Utilities, Shopping, Healthcare, Entertainment, Software, Other>",
  "rawText": "<all visible text from the receipt joined by newlines>",
  "confidence": <number 0-1 representing your confidence>
}

Rules:
- amount: use the TOTAL / JUMLAH / GRAND TOTAL line, not subtotal
- date: if not visible, use today ${new Date().toISOString().split("T")[0]}
- vendor: use the business name at the top of the receipt
- category: pick the most appropriate from the list`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: jpegBuffer.toString("base64"),
      },
    },
  ]);

  const text = result.response.text().trim();

  try {
    // Strip any accidental markdown code fences
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback if Gemini returns malformed JSON
    console.error("Gemini OCR parse error. Raw response:", text);
    return {
      vendor: "Unknown Vendor",
      amount: 0,
      date: new Date().toISOString(),
      category: "Other",
      rawText: text,
      confidence: 0.1,
    };
  }
}
