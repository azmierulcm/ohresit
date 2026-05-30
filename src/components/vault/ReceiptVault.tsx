"use client";

import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar as CalendarIcon, ExternalLink, ImageOff } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from 'firebase/firestore';
import { useTransactions } from '@/lib/hooks/useTransactions';

function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

export default function ReceiptVault() {
  const { transactions, loading } = useTransactions(200);
  const [search, setSearch] = useState('');

  // Only show transactions that have a receipt (scanned ones)
  const receipts = useMemo(() => {
    return transactions
      .filter((t) => t.receipt?.downloadUrl)
      .filter((t) =>
        search
          ? t.vendor.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [transactions, search]);

  const thisMonth = receipts.filter((t) => {
    const d = toDate(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const unverified = receipts.filter((t) => !t.compliance?.isVerified);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Receipt Vault</h2>
          <p className="text-zinc-500">Your secure archive of all scanned receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search vendor or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full border-zinc-200 bg-white"
            />
          </div>
          <button className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors">
            <Filter className="h-4 w-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vaulted', value: receipts.length.toString() },
          { label: 'This Month', value: thisMonth.length.toString() },
          { label: 'Unverified', value: unverified.length.toString() },
          { label: 'Format', value: 'AVIF' },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{stat.label}</p>
            <p className="text-lg font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && receipts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-zinc-100 rounded-[2rem] flex items-center justify-center mb-4">
            <ImageOff className="h-10 w-10 text-zinc-400" />
          </div>
          <p className="font-bold text-zinc-900 text-lg">No receipts yet</p>
          <p className="text-zinc-500 text-sm mt-1 max-w-xs">
            {search ? 'No results match your search.' : 'Scan a receipt using the + button to populate your vault.'}
          </p>
        </div>
      )}

      {/* Receipt Grid */}
      {!loading && receipts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {receipts.map((receipt) => (
            <Card
              key={receipt.id}
              className="group overflow-hidden rounded-3xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                {receipt.receipt?.downloadUrl ? (
                  <img
                    src={receipt.receipt.downloadUrl}
                    alt={receipt.vendor}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center${receipt.receipt?.downloadUrl ? " hidden" : ""}`}>
                  <ImageOff className="h-10 w-10 text-zinc-300" />
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                    receipt.compliance?.isVerified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {receipt.compliance?.isVerified ? 'LHDN VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={receipt.receipt?.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"
                  >
                    <ExternalLink className="h-5 w-5 text-zinc-900" />
                  </a>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-zinc-900 line-clamp-1">{receipt.vendor}</h3>
                    <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5">
                      <CalendarIcon className="h-3 w-3" />
                      <span className="text-xs">{format(toDate(receipt.date), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                  <p className="font-black text-zinc-900">RM {receipt.amount.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-medium text-zinc-400 px-2 py-0.5 bg-zinc-50 rounded-md">
                    {receipt.category}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">AVIF</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
