import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  PenLine, 
  Loader2, 
  Check, 
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { processReceiptAction } from "@/actions/upload-receipt";

type Step = 'CHOOSE' | 'SCANNING' | 'REVIEW';

export default function HybridEntryFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('CHOOSE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  // Handle OCR Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('SCANNING');
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('receipt', file);

    // Mock userId for now
    const result = await processReceiptAction(formData, 'user_123');

    if (result.success) {
      setParsedData(result.data);
      setStep('REVIEW');
    } else {
      alert("Scanning failed: " + result.error);
      setStep('CHOOSE');
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-50">
          <h2 className="text-lg font-bold text-zinc-900">
            {step === 'CHOOSE' && "Add Transaction"}
            {step === 'SCANNING' && "AI is analyzing..."}
            {step === 'REVIEW' && "Confirm Details"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          
          {/* STEP 1: CHOOSE MODE */}
          {step === 'CHOOSE' && (
            <div className="grid grid-cols-1 gap-4">
              <label className="relative flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 cursor-pointer active:scale-[0.98] transition-all group">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-lg">Smart Scan</p>
                    <p className="text-emerald-700/70 text-sm">Upload or take photo</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </label>

              <button 
                onClick={() => setStep('REVIEW')} // In real app, review would be empty for manual
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

          {/* STEP 2: SCANNING STATE */}
          {step === 'SCANNING' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-emerald-500" />
              </div>
              <p className="mt-6 font-bold text-zinc-900 text-xl tracking-tight">Processing Receipt</p>
              <p className="text-zinc-500 mt-2 max-w-[200px]">Extracting amount, vendor and date automatically...</p>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT */}
          {step === 'REVIEW' && (
            <div className="space-y-6">
              {parsedData && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 mb-2">
                  <AlertCircle className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-800">Please verify AI extracted details</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Vendor</label>
                  <Input 
                    defaultValue={parsedData?.vendor || ""} 
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Amount (RM)</label>
                    <Input 
                      defaultValue={parsedData?.amount || ""} 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full h-14 rounded-2xl bg-zinc-50 border-transparent px-3 font-semibold text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>Food & Drink</option>
                      <option>Transport</option>
                      <option>Utilities</option>
                      <option>Shopping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Notes (Optional)</label>
                  <Input 
                    placeholder="What was this for?" 
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button className="w-full h-16 rounded-[2rem] bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-xl shadow-zinc-200">
                  <Check className="mr-2 h-5 w-5" /> Save Transaction
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('CHOOSE')}
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
