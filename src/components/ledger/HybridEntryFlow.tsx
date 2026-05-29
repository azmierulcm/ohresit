"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  PenLine,
  Check,
  ChevronRight,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeReceiptAction, saveTransactionAction, OcrResult } from "@/actions/upload-receipt";
import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";

type Step = "CHOOSE" | "SCANNING" | "REVIEW";
type Mode = "scan" | "manual";

interface ReviewData {
  vendor: string;
  amount: string;
  date: string;
  category: string;
  notes: string;
  ocr?: OcrResult;
  receipt?: { storagePath: string; downloadUrl: string };
}

const CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Utilities",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Software",
  "Other",
];

export default function HybridEntryFlow({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("CHOOSE");
  const [mode, setMode] = useState<Mode>("scan");
  const [saving, setSaving] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
    vendor: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "Other",
    notes: "",
  });

  // ── Scan flow ──────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMode("scan");
    setStep("SCANNING");

    const formData = new FormData();
    formData.append("receipt", file);

    const result = await analyzeReceiptAction(formData, user?.uid || "");

    if (!result.success) {
      alert("Scanning failed: " + result.error);
      setStep("CHOOSE");
      return;
    }

    const { ocr, receipt } = result;

    // Pre-fill review form with OCR data
    setReviewData({
      vendor: ocr.vendor,
      amount: ocr.amount.toString(),
      date: ocr.date.split("T")[0],
      category: ocr.category,
      notes: "",
      ocr,
      receipt,
    });

    setStep("REVIEW");
  };

  // ── Manual flow ───────────────────────────────────────────────────────────

  const handleManualEntry = () => {
    setMode("manual");
    setReviewData({
      vendor: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "Food & Drink",
      notes: "",
    });
    setStep("REVIEW");
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!reviewData.vendor || !reviewData.amount) {
      alert("Please fill in vendor and amount.");
      return;
    }

    setSaving(true);

    const result = await saveTransactionAction({
      userId: user?.uid || "",
      vendor: reviewData.vendor,
      amount: parseFloat(reviewData.amount),
      date: reviewData.date,
      category: reviewData.category,
      notes: reviewData.notes,
      receipt: reviewData.receipt || { storagePath: "", downloadUrl: "" },
      rawText: reviewData.ocr?.rawText || "",
      confidence: reviewData.ocr?.confidence || 0,
    });

    setSaving(false);

    if (!result.success) {
      alert("Failed to save: " + result.error);
      return;
    }

    onClose();
  };

  const updateField = (field: keyof ReviewData, value: string) =>
    setReviewData((prev) => ({ ...prev, [field]: value }));

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
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">

          {/* ── STEP 1: CHOOSE ──────────────────────────────────────────── */}
          {step === "CHOOSE" && (
            <div className="grid grid-cols-1 gap-4">
              {/* Smart Scan */}
              <label className="relative flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 cursor-pointer active:scale-[0.98] transition-all group">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-lg">Smart Scan</p>
                    <p className="text-emerald-700/70 text-sm">AI reads your receipt</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </label>

              {/* Manual Entry */}
              <button
                onClick={handleManualEntry}
                className="flex items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border-2 border-transparent cursor-pointer active:scale-[0.98] transition-all group"
              >
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

          {/* ── STEP 2: SCANNING ─────────────────────────────────────────── */}
          {step === "SCANNING" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-emerald-500" />
              </div>
              <p className="mt-6 font-bold text-zinc-900 text-xl tracking-tight">
                Processing Receipt
              </p>
              <p className="text-zinc-500 mt-2 max-w-[220px] text-sm">
                Gemini AI is extracting vendor, amount and date…
              </p>
            </div>
          )}

          {/* ── STEP 3: REVIEW & CONFIRM ─────────────────────────────────── */}
          {step === "REVIEW" && (
            <div className="space-y-5">
              {/* OCR confidence banner */}
              {reviewData.ocr && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <AlertCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-medium text-emerald-800">
                    AI confidence: {Math.round((reviewData.ocr.confidence) * 100)}% — please verify the details below.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Vendor */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Vendor
                  </label>
                  <Input
                    value={reviewData.vendor}
                    onChange={(e) => updateField("vendor", e.target.value)}
                    placeholder="e.g. Village Grocer"
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                      Amount (RM)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reviewData.amount}
                      onChange={(e) => updateField("amount", e.target.value)}
                      placeholder="0.00"
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </label>
                    <Input
                      type="date"
                      value={reviewData.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Category
                  </label>
                  <select
                    value={reviewData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full h-14 rounded-2xl bg-zinc-50 border-transparent px-3 font-semibold text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Notes (Optional)
                  </label>
                  <Input
                    value={reviewData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="What was this for?"
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-16 rounded-[2rem] bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-xl shadow-zinc-200"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" /> Save Transaction
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("CHOOSE")}
                  disabled={saving}
                  className="w-full h-12 rounded-2xl text-zinc-400 font-medium hover:text-zinc-600"
                >
                  Cancel & Restart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
