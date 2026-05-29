"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Download,
  FileText,
  AlertCircle,
  ExternalLink,
  History,
  RefreshCw,
  CheckCircle2,
  Link2,
} from "lucide-react";
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { generateEInvoicePDF, EInvoiceData } from "@/lib/utils/pdf-generator";
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/lib/context/AuthContext';
import { syncWithLHDN, validateInvoice } from '@/actions/lhdn-sync';
import { Transaction } from '@/types';
import { useRouter } from 'next/navigation';

function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

export default function ComplianceTracker() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(100);
  const { profile } = useUserProfile();
  const router = useRouter();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [validating, setValidating] = useState<string | null>(null); // transactionId

  const isLinked = !!profile?.lhdnCredentials?.isLinked;
  const lastSynced = profile?.lhdnCredentials?.lastSynced;

  const verified = transactions.filter(t => t.compliance?.isVerified && t.compliance?.eInvoiceRef);
  const pending = transactions.filter(t => !t.compliance?.isVerified || !t.compliance?.eInvoiceRef);
  const verifiedPct = transactions.length > 0 ? Math.round((verified.length / transactions.length) * 100) : 0;

  // ── Sync ─────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMsg('');
    const result = await syncWithLHDN(user.uid);
    setSyncing(false);
    setSyncMsg(result.success ? result.message : `Error: ${result.error}`);
    setTimeout(() => setSyncMsg(''), 5000);
  };

  // ── Validate individual transaction ──────────────────────────────────────
  const handleValidate = async (tx: Transaction) => {
    if (!user) return;
    setValidating(tx.id);
    const result = await validateInvoice(tx.id, user.uid);
    setValidating(null);
    if (!result.success) alert(`Validation failed: ${result.error}`);
  };

  // ── PDF download ──────────────────────────────────────────────────────────
  const handleDownload = (tx: Transaction) => {
    const pdfData: EInvoiceData = {
      invoiceNumber: tx.id,
      date: toDate(tx.date),
      issuer: {
        name: tx.vendor,
        tin: profile?.settings?.taxId || "C000000000",
        brn: profile?.settings?.businessRegNo || "000000000000",
        address: "123 Business Street, Bangsar, 59100 Kuala Lumpur"
      },
      receiver: {
        name: user?.displayName || "My Company",
        tin: "C9928374610",
        address: "456 Corporate Towers, 50450 Kuala Lumpur"
      },
      items: [
        {
          description: tx.description || tx.category,
          quantity: 1,
          unitPrice: tx.amount / 1.08,
          taxAmount: tx.amount - (tx.amount / 1.08),
          total: tx.amount
        }
      ],
      totalExcludingTax: tx.amount / 1.08,
      totalTax: tx.amount - (tx.amount / 1.08),
      totalAmount: tx.amount,
      lhdnValidationRef: tx.compliance?.eInvoiceRef || undefined
    };
    generateEInvoicePDF(pdfData);
  };

  return (
    <div className="max-w-2xl mx-auto p-5 pb-24 space-y-8">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase">LHDN Compliance</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">
            {isLinked ? 'Your Tax Vault is Secure' : 'Link Your LHDN Account'}
          </h1>
          <p className="text-emerald-50/80 mt-2 text-sm leading-relaxed max-w-[260px]">
            {isLinked
              ? `${verifiedPct}% of your receipts are validated. ${lastSynced ? `Last synced ${format(toDate(lastSynced), 'dd MMM')}` : 'Not yet synced.'}`
              : 'Connect to MyInvois to auto-validate receipts and submit e-invoices to LHDN.'}
          </p>

          {isLinked ? (
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="secondary"
              className="mt-6 rounded-full font-bold px-6 shadow-lg shadow-emerald-900/20 gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/settings')}
              variant="secondary"
              className="mt-6 rounded-full font-bold px-6 shadow-lg shadow-emerald-900/20 gap-2"
            >
              <Link2 className="h-4 w-4" /> Link LHDN Account
            </Button>
          )}

          {syncMsg && (
            <p className="mt-3 text-xs font-medium text-emerald-100 bg-white/10 px-3 py-1.5 rounded-xl inline-block">
              {syncMsg}
            </p>
          )}
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/30 rounded-full blur-3xl" />
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 rounded-[2rem] border-zinc-100 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Validated</p>
          <h3 className="text-2xl font-bold text-zinc-900 mt-1">{String(verified.length).padStart(2, '0')}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-2">Ready for Tax Filing</p>
        </Card>
        <Card className="p-5 rounded-[2rem] border-zinc-100 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Action Needed</p>
          <h3 className="text-2xl font-bold text-rose-500 mt-1">{String(pending.length).padStart(2, '0')}</h3>
          <p className="text-[10px] text-rose-400 font-medium mt-2">Missing Reference No.</p>
        </Card>
      </div>

      {/* ── Not linked prompt ─────────────────────────────────────────────── */}
      {!isLinked && (
        <div className="flex gap-3 p-5 bg-amber-50 rounded-[2rem] border border-amber-100">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">LHDN account not linked</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Go to Settings to enter your TIN, BRN and MyInvois API credentials to enable automatic validation.
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction list ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-lg font-bold text-zinc-900">E-Invois History</h2>
          <History className="h-4 w-4 text-zinc-400" />
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="text-center py-10 text-zinc-400 text-sm font-medium">
            No transactions yet. Add some to track compliance.
          </div>
        )}

        {!loading && transactions.map((tx) => (
          <div key={tx.id} className="p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center">
                  {tx.compliance?.isVerified
                    ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    : <FileText className="h-6 w-6 text-zinc-400" />}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">{tx.vendor}</h4>
                  <p className="text-[11px] text-zinc-500">{format(toDate(tx.date), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                tx.compliance?.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400'
              }`}>
                {tx.compliance?.isVerified ? 'VALIDATED' : 'PENDING'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</p>
                <p className="font-bold text-zinc-900">RM {tx.amount.toFixed(2)}</p>
              </div>
              {tx.compliance?.eInvoiceRef ? (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">LHDN Ref</p>
                  <p className="text-[11px] font-medium text-zinc-600 max-w-[160px] truncate">{tx.compliance.eInvoiceRef}</p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isLinked || validating === tx.id}
                  onClick={() => handleValidate(tx)}
                  className="rounded-full text-[11px] h-8 border-rose-100 text-rose-500 bg-rose-50/50 disabled:opacity-40"
                >
                  {validating === tx.id ? 'Validating…' : isLinked ? 'Validate Now' : 'Link LHDN First'}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => handleDownload(tx)}
                className="w-full rounded-2xl bg-zinc-900 text-white font-bold text-xs h-12"
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <a
                href={`https://myinvois.hasil.gov.my`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full rounded-2xl border-zinc-200 font-bold text-xs h-12">
                  <ExternalLink className="mr-2 h-4 w-4" /> LHDN Portal
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── Info footer ───────────────────────────────────────────────────── */}
      <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex gap-4">
        <AlertCircle className="h-5 w-5 text-zinc-400 shrink-0" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          E-invoices are synced from LHDN MyInvois using your TIN. Ensure your TIN is up to date in{' '}
          <button onClick={() => router.push('/settings')} className="underline font-medium text-zinc-700">
            Settings
          </button>.
        </p>
      </div>
    </div>
  );
}
