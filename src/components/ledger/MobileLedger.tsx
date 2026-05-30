"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useUI } from '@/lib/context/UIContext';
import { Transaction } from '@/types';

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case 'food': case 'food & drink': case 'groceries': return <Utensils className="h-5 w-5" />;
    case 'transport': return <Car className="h-5 w-5" />;
    case 'utilities': return <Zap className="h-5 w-5" />;
    default: return <ShoppingBag className="h-5 w-5" />;
  }
};

function formatTxDate(val: any): string {
  const d = val instanceof Timestamp ? val.toDate() : val?.seconds ? new Date(val.seconds * 1000) : new Date(val);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
}

const TransactionItem = ({ tx }: { tx: Transaction }) => (
  <div className="flex items-center justify-between p-4 bg-white active:bg-zinc-50 transition-colors cursor-pointer border-b border-zinc-100 last:border-0 md:border md:rounded-2xl md:mb-3 md:shadow-sm md:hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
        tx.type === 'expense' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-50 text-emerald-600'
      }`}>
        <CategoryIcon category={tx.category} />
      </div>
      <div className="flex flex-col">
        <span className="text-[15px] font-semibold text-zinc-900 leading-tight">{tx.vendor}</span>
        <span className="text-[12px] text-zinc-500 mt-0.5">{tx.category} • {formatTxDate(tx.date)}</span>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className={`text-[16px] font-bold ${tx.type === 'expense' ? 'text-zinc-900' : 'text-emerald-600'}`}>
        {tx.type === 'expense' ? '-' : '+'} RM {tx.amount.toFixed(2)}
      </span>
      {tx.currency && tx.currency !== 'MYR' && tx.originalAmount && (
        <span className="text-[10px] text-zinc-400 font-medium">
          {tx.currency} {tx.originalAmount.toFixed(2)}
        </span>
      )}
      {tx.compliance?.isVerified && (
        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
          Verified
        </span>
      )}
    </div>
  </div>
);

export default function MobileLedger() {
  const { transactions, loading } = useTransactions(100);
  const { openEntryModal } = useUI();

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white md:bg-zinc-50/50 md:pt-10 pb-24">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-5 py-4 border-b border-zinc-100 md:hidden">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Ledger</h1>
          <button
            onClick={openEntryModal}
            className="p-2 bg-zinc-900 text-white rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-end mb-8 px-5">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Transaction Ledger</h1>
          <p className="text-zinc-500">Manage your daily expenses and income</p>
        </div>
        <button
          onClick={openEntryModal}
          className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-zinc-800 transition-all shadow-md"
        >
          <Plus className="h-5 w-5" /> Add New
        </button>
      </div>

      {/* Summary Cards */}
      <div className="flex overflow-x-auto gap-4 px-5 py-6 no-scrollbar md:grid md:grid-cols-2 md:overflow-visible">
        <Card className="min-w-[280px] p-6 rounded-[2rem] bg-zinc-900 text-white border-none shadow-xl shrink-0 md:min-w-0">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-[0.1em]">Net Balance</p>
          <h2 className="text-3xl font-bold mt-2">RM {balance.toFixed(2)}</h2>
          <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-medium">
            <ArrowUpRight className="h-4 w-4" />
            <span>Income: RM {totalIncome.toFixed(2)}</span>
          </div>
        </Card>

        <Card className="min-w-[280px] p-6 rounded-[2rem] bg-white border border-zinc-100 shadow-sm shrink-0 md:min-w-0">
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.1em]">Total Spent</p>
          <h2 className="text-3xl font-bold mt-2 text-zinc-900">RM {totalExpense.toFixed(2)}</h2>
          <div className="flex items-center gap-2 mt-4 text-zinc-400 text-sm font-medium">
            <ArrowDownLeft className="h-4 w-4" />
            <span>{transactions.filter(t => t.type === 'expense').length} transactions</span>
          </div>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="px-5 mt-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Transactions</h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-[2rem] flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="font-bold text-zinc-900">No transactions yet</p>
            <p className="text-zinc-500 text-sm mt-1">Tap the + button to add your first one</p>
          </div>
        ) : (
          <div className="space-y-0 md:space-y-2">
            {transactions.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
