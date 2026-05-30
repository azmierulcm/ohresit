"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  ImageUp,
  PenLine,
  Check,
  ChevronRight,
  AlertCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeReceiptAction, saveTransactionAction, OcrResult } from "@/actions/upload-receipt";
import { useAuth } from "@/lib/context/AuthContext";
import { currencySymbol } from "@/lib/utils/exchange-rate";
import { parseReceiptAmount } from "@/lib/utils/receipt-parser";

type Step = "CHOOSE" | "SCANNING" | "REVIEW";
type Mode = "scan" | "manual";

interface ReviewData {
  vendor: string;
  amountMYR: string;      // editable MYR amount (what gets saved)
  originalAmount: string; // original currency amount (read-only reference)
  currency: string;       // ISO code
  exchangeRate: number;
  date: string;
  category: string;
  notes: string;
  ocr?: OcrResult;
  receipt?: { storagePath: string; downloadUrl: string };
}

const CATEGORIES = [
  "Food & Drink", "Transport", "Utilities", "Shopping",
  "Healthcare", "Entertainment", "Software", "Other",
];

const CURRENCIES = [
  "MYR", "USD", "EUR", "GBP", "SGD", "JPY", "CNY",
  "AUD", "CAD", "HKD", "KRW", "THB", "IDR", "INR", "AED",
];

export default function HybridEntryFlow({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("CHOOSE");
  const [mode, setMode] = useState<Mode>("scan");
  const [saving, setSaving] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
    vendor: "",
    amountMYR: "",
    originalAmount: "",
    currency: "MYR",
    exchangeRate: 1,
    date: new Date().toISOString().split("T")[0],
    category: "Other",
    notes: "",
  });

  // ── File processing (shared by Take Photo + Upload) ────────────────────────
  const processFile = async (file: File) => {
    setMode("scan");
    setStep("SCANNING");

    try {
      const formData = new FormData();
      formData.append("receipt", file);
      const result = await analyzeReceiptAction(formData, user?.uid || "");

      if (!result.success) {
        fallbackToManualReview();
        return;
      }

      const { ocr, receipt } = result;
      setReviewData({
        vendor: ocr.vendor,
        amountMYR: ocr.amountMYR > 0 ? ocr.amountMYR.toFixed(2) : "",
        originalAmount: ocr.amount > 0 ? ocr.amount.toFixed(2) : "",
        currency: ocr.currency || "MYR",
        exchangeRate: ocr.exchangeRate || 1,
        date: ocr.date ? ocr.date.split("T")[0] : new Date().toISOString().split("T")[0],
        category: ocr.category || "Other",
        notes: "",
        ocr,
        receipt,
      });
      setStep("REVIEW");
    } catch (err) {
      console.error("analyzeReceiptAction threw:", err);
      fallbackToManualReview();
    }
  };

  const fallbackToManualReview = () => {
    setReviewData({
      vendor: "", amountMYR: "", originalAmount: "", currency: "MYR",
      exchangeRate: 1, date: new Date().toISOString().split("T")[0],
      category: "Other", notes: "",
    });
    setStep("REVIEW");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Manual entry ───────────────────────────────────────────────────────────
  const handleManualEntry = () => {
    setMode("manual");
    setReviewData({
      vendor: "", amountMYR: "", originalAmount: "", currency: "MYR",
      exchangeRate: 1, date: new Date().toISOString().split("T")[0],
      category: "Food & Drink", notes: "",
    });
    setStep("REVIEW");
  };

  // ── Currency change → re-fetch rate ───────────────────────────────────────
  const handleCurrencyChange = async (newCurrency: string) => {
    updateField("currency", newCurrency);

    if (!reviewData.originalAmount || newCurrency === "MYR") {
      updateField("exchangeRate", "1" as any);
      if (newCurrency === "MYR") updateField("amountMYR", reviewData.originalAmount);
      return;
    }

    setFetchingRate(true);
    try {
      const { convertToMYR } = await import("@/lib/utils/exchange-rate");
      const orig = parseReceiptAmount(reviewData.originalAmount);
      const { amountMYR, rate } = await convertToMYR(orig, newCurrency);
      setReviewData(prev => ({
        ...prev,
        currency: newCurrency,
        exchangeRate: rate,
        amountMYR: amountMYR.toFixed(2),
      }));
    } catch {
      updateField("currency", newCurrency);
    } finally {
      setFetchingRate(false);
    }
  };

  // ── Original amount change → recalculate MYR ──────────────────────────────
  const handleOriginalAmountChange = async (val: string) => {
    updateField("originalAmount", val);
    if (reviewData.currency === "MYR") {
      updateField("amountMYR", val);
      return;
    }
    const orig = parseReceiptAmount(val);
    if (orig > 0 && reviewData.exchangeRate > 0) {
      const myr = (orig * reviewData.exchangeRate).toFixed(2);
      updateField("amountMYR", myr);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!reviewData.vendor) { alert("Please enter the vendor name."); return; }
    if (!reviewData.amountMYR || parseReceiptAmount(reviewData.amountMYR) <= 0) {
      alert("Please enter a valid amount."); return;
    }

    setSaving(true);
    try {
      const result = await saveTransactionAction({
        userId: user?.uid || "",
        vendor: reviewData.vendor,
        amountMYR: parseReceiptAmount(reviewData.amountMYR),
        originalAmount: parseReceiptAmount(reviewData.originalAmount) || parseReceiptAmount(reviewData.amountMYR),
        currency: reviewData.currency || "MYR",
        exchangeRate: reviewData.exchangeRate || 1,
        date: reviewData.date,
        category: reviewData.category,
        notes: reviewData.notes,
        receipt: reviewData.receipt || { storagePath: "", downloadUrl: "" },
        rawText: reviewData.ocr?.rawText || "",
        confidence: reviewData.ocr?.confidence || 0,
      });

      if (!result.success) { alert("Failed to save: " + result.error); return; }
      onClose();
    } catch (err) {
      alert("Unexpected error. Please try again.");
      console.error("saveTransactionAction threw:", err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ReviewData, value: any) =>
    setReviewData(prev => ({ ...prev, [field]: value }));

  const isForeign = reviewData.currency && reviewData.currency !== "MYR";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-50">
          <h2 className="text-lg font-bold text-zinc-900">
            {step === "CHOOSE" && "Add Transaction"}
            {step === "SCANNING" && "AI is analysing…"}
            {step === "REVIEW" && (mode === "scan" ? "Confirm Details" : "Manual Entry")}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">

          {/* ── CHOOSE ───────────────────────────────────────────────────── */}
          {step === "CHOOSE" && (
            <div className="grid grid-cols-1 gap-4">

              {/* Take Photo */}
              <label className="relative flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 cursor-pointer active:scale-[0.98] transition-all group">
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-lg">Take Photo</p>
                    <p className="text-emerald-700/70 text-sm">Open camera &amp; scan receipt</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </label>

              {/* Upload from Gallery */}
              <label className="relative flex items-center justify-between p-6 bg-sky-50 rounded-[2rem] border-2 border-sky-100 cursor-pointer active:scale-[0.98] transition-all group">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
                    <ImageUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sky-900 text-lg">Upload Photo</p>
                    <p className="text-sky-700/70 text-sm">Choose from gallery or files</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-sky-400 group-hover:translate-x-1 transition-transform" />
              </label>

              {/* Manual Entry */}
              <button onClick={handleManualEntry} className="flex items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border-2 border-transparent cursor-pointer active:scale-[0.98] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-zinc-200">
                    <PenLine className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-zinc-900 text-lg">Manual Entry</p>
                    <p className="text-zinc-500 text-sm">Type it in yourself</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-zinc-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* ── SCANNING ─────────────────────────────────────────────────── */}
          {step === "SCANNING" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-emerald-500" />
              </div>
              <p className="mt-6 font-bold text-zinc-900 text-xl tracking-tight">Processing Receipt</p>
              <p className="text-zinc-500 mt-2 max-w-[220px] text-sm">
                Detecting vendor, amount, currency and converting to MYR…
              </p>
            </div>
          )}

          {/* ── REVIEW ───────────────────────────────────────────────────── */}
          {step === "REVIEW" && (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

              {/* Confidence banner */}
              {reviewData.ocr && (() => {
                const pct = Math.round(reviewData.ocr.confidence * 100);
                const isLow = reviewData.ocr.confidence < 0.5;
                return (
                  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isLow ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}>
                    <AlertCircle className={`h-4 w-4 shrink-0 ${isLow ? "text-amber-500" : "text-emerald-600"}`} />
                    <p className={`text-xs font-medium ${isLow ? "text-amber-800" : "text-emerald-800"}`}>
                      {isLow
                        ? `Low confidence (${pct}%) — please fill in missing fields.`
                        : `AI confidence: ${pct}% — verify before saving.`}
                    </p>
                  </div>
                );
              })()}

              {/* Currency conversion banner (foreign receipts) */}
              {isForeign && reviewData.exchangeRate > 0 && parseReceiptAmount(reviewData.originalAmount) > 0 && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <span>{currencySymbol(reviewData.currency)}{parseReceiptAmount(reviewData.originalAmount).toFixed(2)} {reviewData.currency}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-emerald-700">RM {parseReceiptAmount(reviewData.amountMYR).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-indigo-500 ml-auto">
                    1 {reviewData.currency} = RM {reviewData.exchangeRate.toFixed(4)}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Vendor */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Vendor</label>
                  <Input
                    value={reviewData.vendor}
                    onChange={e => updateField("vendor", e.target.value)}
                    placeholder="e.g. Village Grocer"
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                {/* Currency + Original Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Currency</label>
                    <select
                      value={reviewData.currency}
                      onChange={e => handleCurrencyChange(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-zinc-50 border-transparent px-3 font-semibold text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c} — {currencySymbol(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                      {isForeign ? `Amount (${reviewData.currency})` : "Amount (MYR)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                        {currencySymbol(reviewData.currency)}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={isForeign ? reviewData.originalAmount : reviewData.amountMYR}
                        onChange={e => isForeign ? handleOriginalAmountChange(e.target.value) : updateField("amountMYR", e.target.value)}
                        placeholder="0.00"
                        className="h-14 pl-9 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* MYR Amount (editable, shown separately for foreign receipts) */}
                {isForeign && (
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                      Amount in MYR {fetchingRate && <span className="text-indigo-400 normal-case font-normal">(fetching rate…)</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">RM</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={reviewData.amountMYR}
                        onChange={e => updateField("amountMYR", e.target.value)}
                        placeholder="0.00"
                        className="h-14 pl-10 rounded-2xl bg-emerald-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg text-emerald-700"
                      />
                    </div>
                  </div>
                )}

                {/* Date + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </label>
                    <Input
                      type="date"
                      value={reviewData.date}
                      onChange={e => updateField("date", e.target.value)}
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                      value={reviewData.category}
                      onChange={e => updateField("category", e.target.value)}
                      className="w-full h-14 rounded-2xl bg-zinc-50 border-transparent px-3 font-semibold text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Notes (Optional)</label>
                  <Input
                    value={reviewData.notes}
                    onChange={e => updateField("notes", e.target.value)}
                    placeholder="What was this for?"
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || fetchingRate}
                  className="w-full h-16 rounded-[2rem] bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-xl shadow-zinc-200"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <><Check className="mr-2 h-5 w-5" /> Save Transaction</>
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setStep("CHOOSE")} disabled={saving}
                  className="w-full h-12 rounded-2xl text-zinc-400 font-medium hover:text-zinc-600">
                  Cancel &amp; Restart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
