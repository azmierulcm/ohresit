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
  MoreHorizontal 
} from "lucide-react";

interface TransactionCardProps {
  type: 'expense' | 'income';
  vendor: string;
  category: string;
  amount: number;
  date: string;
  status?: 'verified' | 'pending';
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case 'food': return <Utensils className="h-5 w-5" />;
    case 'transport': return <Car className="h-5 w-5" />;
    case 'utilities': return <Zap className="h-5 w-5" />;
    default: return <ShoppingBag className="h-5 w-5" />;
  }
};

export const TransactionItem = ({ type, vendor, category, amount, date, status }: TransactionCardProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white active:bg-zinc-50 transition-colors cursor-pointer border-b border-zinc-100 last:border-0 md:border md:rounded-2xl md:mb-3 md:shadow-sm md:hover:shadow-md">
      <div className="flex items-center gap-4">
        {/* Mobile: Larger touch target for the icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          type === 'expense' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          <CategoryIcon category={category} />
        </div>
        
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-zinc-900 leading-tight">{vendor}</span>
          <span className="text-[12px] text-zinc-500 mt-0.5">{category} • {date}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`text-[16px] font-bold ${
          type === 'expense' ? 'text-zinc-900' : 'text-emerald-600'
        }`}>
          {type === 'expense' ? '-' : '+'} RM {amount.toFixed(2)}
        </span>
        {status === 'verified' && (
          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
            Verified
          </span>
        )}
      </div>
    </div>
  );
};

export default function MobileLedger() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white md:bg-zinc-50/50 md:pt-10 pb-24">
      {/* Mobile Header: Sticky and Minimal */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-5 py-4 border-b border-zinc-100 md:hidden">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Ledger</h1>
          <button className="p-2 bg-zinc-900 text-white rounded-full shadow-lg active:scale-95 transition-transform">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header: More context */}
      <div className="hidden md:flex justify-between items-end mb-8 px-5">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Transaction Ledger</h1>
          <p className="text-zinc-500">Manage your daily expenses and income</p>
        </div>
        <button className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-zinc-800 transition-all shadow-md">
          <Plus className="h-5 w-5" /> Add New
        </button>
      </div>

      {/* Summary Cards: Horizontally scrollable on mobile, Grid on desktop */}
      <div className="flex overflow-x-auto gap-4 px-5 py-6 no-scrollbar md:grid md:grid-cols-2 md:overflow-visible">
        <Card className="min-w-[280px] p-6 rounded-[2rem] bg-zinc-900 text-white border-none shadow-xl shrink-0 md:min-w-0">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-[0.1em]">Total Balance</p>
          <h2 className="text-3xl font-bold mt-2">RM 12,450.00</h2>
          <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-medium">
            <ArrowUpRight className="h-4 w-4" />
            <span>+12% from last month</span>
          </div>
        </Card>

        <Card className="min-w-[280px] p-6 rounded-[2rem] bg-white border border-zinc-100 shadow-sm shrink-0 md:min-w-0">
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-[0.1em]">Monthly Spend</p>
          <h2 className="text-3xl font-bold mt-2 text-zinc-900">RM 3,120.50</h2>
          <div className="flex items-center gap-2 mt-4 text-zinc-400 text-sm font-medium">
            <ArrowDownLeft className="h-4 w-4" />
            <span>85% of budget used</span>
          </div>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="px-5 mt-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Transactions</h3>
        <div className="space-y-0 md:space-y-2">
          <TransactionItem 
            type="expense" 
            vendor="Village Grocer" 
            category="Food" 
            amount={145.20} 
            date="Today, 2:30 PM" 
            status="verified"
          />
          <TransactionItem 
            type="expense" 
            vendor="Shell Petrol" 
            category="Transport" 
            amount={80.00} 
            date="Yesterday" 
          />
          <TransactionItem 
            type="income" 
            vendor="Monthly Salary" 
            category="Salary" 
            amount={8500.00} 
            date="25 May 2026" 
          />
          <TransactionItem 
            type="expense" 
            vendor="TNB - Utilities" 
            category="Utilities" 
            amount={312.40} 
            date="24 May 2026" 
            status="verified"
          />
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-100 px-8 py-3 flex justify-between items-center md:hidden">
        <button className="flex flex-col items-center gap-1 text-zinc-900">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 mb-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-400">
          <ShoppingBag className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Vault</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-400">
          <MoreHorizontal className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
        </button>
      </div>
    </div>
  );
}
