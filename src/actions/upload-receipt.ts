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

    // Convert to JPEG for Gemini Vision (AVIF not supported; high quality for OCR accuracy)
    const jpegBuffer = await sharp(originalBuffer)
      .jpeg({ quality: 92 })
      .resize(2000, null, { withoutEnlargement: true })
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

    const amount = parseReceiptAmount(input.amount);
    if (!amount || amount <= 0) {
      return { success: false, error: "Amount must be greater than 0." };
    }

    const transactionRef = db.collection("transactions").doc();
    const txData: any = {
      userId: input.userId,
      type: "expense",
      category: input.category,
      amount,
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
    console.warn("[OCR] GEMINI_API_KEY not set — skipping OCR.");
    return { vendor: "", amount: 0, date: new Date().toISOString(), category: "Other", rawText: "", confidence: 0 };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const today = new Date().toISOString().split("T")[0];

  // ── Prompt: no rawText (causes JSON parse failures with literal newlines) ──
  const prompt = `You are reading a Malaysian receipt or invoice image.

Return ONLY a JSON object — no markdown, no explanation, nothing else.

Example:
{"vendor":"Village Grocer","amount":45.50,"date":"2026-05-30","category":"Food & Drink"}

Rules:
- vendor: store or restaurant name (largest text, usually at top)
- amount: the final TOTAL / JUMLAH / GRAND TOTAL as a plain decimal number. Strip "RM". Example: if you see "RM 128.90" write 128.90
- date: date printed on receipt in YYYY-MM-DD. Write ${today} if not visible
- category: exactly one of — Food & Drink, Transport, Utilities, Shopping, Healthcare, Entertainment, Software, Other`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: jpegBuffer.toString("base64") } },
  ]);

  const raw = result.response.text().trim();
  console.log("[OCR] Gemini raw response:", raw.substring(0, 300));

  // Use regex to find the first {...} block — handles markdown fences and trailing text
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    console.error("[OCR] No JSON object found in Gemini response.");
    return { vendor: "", amount: 0, date: new Date().toISOString(), category: "Other", rawText: raw, confidence: 0 };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("[OCR] JSON.parse failed on:", jsonMatch[0]);
    return { vendor: "", amount: 0, date: new Date().toISOString(), category: "Other", rawText: raw, confidence: 0 };
  }

  const amount  = parseReceiptAmount(parsed.amount);
  const vendor  = String(parsed.vendor  || "").trim();
  const category = String(parsed.category || "Other").trim();

  // Parse date — accept YYYY-MM-DD or ISO strings
  let date = new Date().toISOString();
  if (parsed.date) {
    const d = new Date(parsed.date);
    if (!isNaN(d.getTime())) date = d.toISOString();
  }

  const confidence = vendor && amount > 0 ? 0.9 : 0.4;
  console.log(`[OCR] Parsed → vendor: "${vendor}", amount: ${amount}, date: ${date}, confidence: ${confidence}`);

  return { vendor, amount, date, category, rawText: raw, confidence };
}

/**
 * Robustly parse an amount value from Gemini.
 * Handles: numbers, strings like "RM 45.50", "45,50", "128.90", null
 */
function parseReceiptAmount(raw: unknown): number {
  if (typeof raw === "number") return isNaN(raw) ? 0 : raw;
  if (typeof raw === "string") {
    // Strip currency symbols, letters, spaces; keep digits and decimal point
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
