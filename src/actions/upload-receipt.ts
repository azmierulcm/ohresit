"use server";

import sharp from "sharp";
import { storage, db } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Receipt } from "@/types";
import { convertToMYR } from "@/lib/utils/exchange-rate";
import { parseReceiptAmount } from "@/lib/utils/receipt-parser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OcrResult {
  vendor: string;
  amount: number;         // original amount in detected currency
  currency: string;       // ISO 4217 code detected from receipt (e.g. "USD")
  amountMYR: number;      // converted to MYR
  exchangeRate: number;   // 1 [currency] = X MYR
  date: string;           // ISO string
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
  amountMYR: number;        // MYR amount to save
  originalAmount: number;   // amount in original currency
  currency: string;         // ISO code
  exchangeRate: number;
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

    // Convert to JPEG for Gemini (AVIF not supported; high quality for OCR)
    const jpegBuffer = await sharp(originalBuffer)
      .jpeg({ quality: 92 })
      .resize(2000, null, { withoutEnlargement: true })
      .toBuffer();

    // Convert to AVIF for Firebase Storage
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
      metadata: { cacheControl: "public, max-age=31536000", userId },
    });

    const [downloadUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    // Run Gemini Vision OCR
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
    const amountMYR = parseReceiptAmount(input.amountMYR);
    if (!amountMYR || amountMYR <= 0) {
      return { success: false, error: "Amount must be greater than 0." };
    }

    const hasReceipt = !!input.receipt?.storagePath;
    const receiptData: Receipt | null = hasReceipt
      ? {
          storagePath: input.receipt.storagePath,
          downloadUrl: input.receipt.downloadUrl,
          format: "avif",
          ocrMetadata: { rawText: input.rawText, confidence: input.confidence },
        }
      : null;

    const transactionRef = db.collection("transactions").doc();
    const txData: any = {
      userId: input.userId,
      type: "expense",
      category: input.category,
      amount: amountMYR,                              // always MYR
      currency: input.currency || "MYR",
      originalAmount: parseReceiptAmount(input.originalAmount) || amountMYR,
      exchangeRate: input.exchangeRate || 1,
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
  const empty: OcrResult = {
    vendor: "", amount: 0, currency: "MYR", amountMYR: 0,
    exchangeRate: 1, date: new Date().toISOString(), category: "Other",
    rawText: "", confidence: 0,
  };

  if (!process.env.GEMINI_API_KEY) {
    console.warn("[OCR] GEMINI_API_KEY not set — skipping OCR.");
    return empty;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are reading a receipt or invoice from anywhere in the world.

Return ONLY a JSON object — no markdown, no explanation, nothing else.

Examples:
{"vendor":"Starbucks","amount":8.50,"currency":"USD","date":"2026-05-30","category":"Food & Drink"}
{"vendor":"Village Grocer","amount":45.50,"currency":"MYR","date":"2026-05-30","category":"Food & Drink"}
{"vendor":"Bic Camera","amount":3200,"currency":"JPY","date":"2026-05-30","category":"Shopping"}

Rules:
- vendor: store or business name (usually largest text at top)
- amount: the final TOTAL / GRAND TOTAL as a plain decimal number, no symbols
- currency: ISO 4217 code detected from the receipt symbol or text.
  Common mappings — RM/Ringgit→MYR, $→USD (unless context says AUD/SGD/CAD/HKD), €→EUR, £→GBP,
  S$→SGD, A$→AUD, C$→CAD, HK$→HKD, ¥/円→JPY, 元/CNY→CNY, ₩→KRW, ฿→THB, Rp→IDR, ₹→INR
  Default to MYR if currency is ambiguous.
- date: date on receipt in YYYY-MM-DD. Write ${today} if not visible
- category: exactly one of — Food & Drink, Transport, Utilities, Shopping, Healthcare, Entertainment, Software, Other`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: jpegBuffer.toString("base64") } },
  ]);

  const raw = result.response.text().trim();
  console.log("[OCR] Gemini raw response:", raw.substring(0, 300));

  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    console.error("[OCR] No JSON found in Gemini response.");
    return { ...empty, rawText: raw };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("[OCR] JSON.parse failed on:", jsonMatch[0]);
    return { ...empty, rawText: raw };
  }

  const amount   = parseReceiptAmount(parsed.amount);
  const vendor   = String(parsed.vendor   || "").trim();
  const category = String(parsed.category || "Other").trim();
  const currency = String(parsed.currency || "MYR").toUpperCase().trim();

  let date = new Date().toISOString();
  if (parsed.date) {
    const d = new Date(parsed.date);
    if (!isNaN(d.getTime())) date = d.toISOString();
  }

  // Fetch live exchange rate and convert to MYR
  let amountMYR = amount;
  let exchangeRate = 1;
  if (currency !== "MYR" && amount > 0) {
    try {
      const fx = await convertToMYR(amount, currency);
      amountMYR = fx.amountMYR;
      exchangeRate = fx.rate;
      console.log(`[OCR] ${amount} ${currency} → RM ${amountMYR} (rate: ${exchangeRate})`);
    } catch (fxErr) {
      console.warn("[OCR] Exchange rate fetch failed, using original amount as MYR:", fxErr);
      amountMYR = amount;
      exchangeRate = 1;
    }
  }

  const confidence = vendor && amount > 0 ? 0.9 : 0.4;
  console.log(`[OCR] → vendor: "${vendor}", ${amount} ${currency} = RM ${amountMYR}`);

  return { vendor, amount, currency, amountMYR, exchangeRate, date, category, rawText: raw, confidence };
}

// parseReceiptAmount is imported from @/lib/utils/receipt-parser
