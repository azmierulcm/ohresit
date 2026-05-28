"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Download, 
  FileText, 
  AlertCircle,
  ExternalLink,
  History
} from "lucide-react";
import { generateEInvoicePDF, EInvoiceData } from "@/lib/utils/pdf-generator";

const mockComplianceData = [
  {
    id: 'INV-2026-001',
    vendor: 'Cloud Services Ltd',
    amount: 1250.00,
    status: 'Validated',
    lhdnRef: 'LHDN-8823-9910-22',
    date: new Date(),
  },
  {
    id: 'INV-2026-002',
    vendor: 'Office Supplies Co',
    amount: 450.20,
    status: 'Pending',
    lhdnRef: null,
    date: new Date(),
  }
];

export default function ComplianceTracker() {
  
  const handleDownload = (invoice: any) => {
    const pdfData: EInvoiceData = {
      invoiceNumber: invoice.id,
      date: invoice.date,
      issuer: {
        name: invoice.vendor,
        tin: "C210928370",
        brn: "202401029384",
        address: "123 Business Street, Bangsar, 59100 Kuala Lumpur"
      },
      receiver: {
        name: "My Awesome Company",
        tin: "C9928374610",
        address: "456 Corporate Towers, 50450 Kuala Lumpur"
      },
      items: [
        {
          description: "Professional Services - May 2026",
          quantity: 1,
          unitPrice: invoice.amount / 1.08,
          taxAmount: invoice.amount - (invoice.amount / 1.08),
          total: invoice.amount
        }
      ],
      totalExcludingTax: invoice.amount / 1.08,
      totalTax: invoice.amount - (invoice.amount / 1.08),
      totalAmount: invoice.amount,
      lhdnValidationRef: invoice.lhdnRef
    };

    generateEInvoicePDF(pdfData);
  };

  return (
    <div className="max-w-2xl mx-auto p-5 pb-24 space-y-8">
      {/* Compliance Hero */}
      <div className="relative overflow-hidden bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase">LHDN Compliance</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">Your Tax Vault is Secure</h1>
          <p className="text-emerald-50/80 mt-2 text-sm leading-relaxed max-w-[240px]">
            We've automatically validated 85% of your receipts for this quarter.
          </p>
          <Button variant="secondary" className="mt-6 rounded-full font-bold px-6 shadow-lg shadow-emerald-900/20">
            Link LHDN Account
          </Button>
        </div>
        {/* Decorative Background Element */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* Compliance Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 rounded-[2rem] border-zinc-100 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Validated</p>
          <h3 className="text-2xl font-bold text-zinc-900 mt-1">12</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
             Ready for Tax Filing
          </p>
        </Card>
        <Card className="p-5 rounded-[2rem] border-zinc-100 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Action Needed</p>
          <h3 className="text-2xl font-bold text-rose-500 mt-1">03</h3>
          <p className="text-[10px] text-rose-400 font-medium mt-2">
            Missing Reference No.
          </p>
        </Card>
      </div>

      {/* Recent e-Invoices */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-lg font-bold text-zinc-900">E-Invois History</h2>
          <History className="h-4 w-4 text-zinc-400" />
        </div>

        {mockComplianceData.map((inv) => (
          <div key={inv.id} className="p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">{inv.vendor}</h4>
                  <p className="text-[11px] text-zinc-500">{inv.id}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                inv.status === 'Validated' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400'
              }`}>
                {inv.status.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
               <div>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</p>
                 <p className="font-bold text-zinc-900">RM {inv.amount.toFixed(2)}</p>
               </div>
               {inv.lhdnRef ? (
                 <div className="text-right">
                   <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">LHDN Ref</p>
                   <p className="text-[11px] font-medium text-zinc-600">{inv.lhdnRef}</p>
                 </div>
               ) : (
                 <Button variant="outline" size="sm" className="rounded-full text-[11px] h-8 border-rose-100 text-rose-500 bg-rose-50/50">
                    Fix Missing Ref
                 </Button>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                onClick={() => handleDownload(inv)}
                className="w-full rounded-2xl bg-zinc-900 text-white font-bold text-xs h-12"
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" className="w-full rounded-2xl border-zinc-200 font-bold text-xs h-12">
                <ExternalLink className="mr-2 h-4 w-4" /> LHDN Portal
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex gap-4">
        <AlertCircle className="h-5 w-5 text-zinc-400 shrink-0" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          The e-invoices listed here are automatically synced with your LHDN MyInvois portal using your TIN. Make sure your profile TIN is up to date in settings.
        </p>
      </div>
    </div>
  );
}
