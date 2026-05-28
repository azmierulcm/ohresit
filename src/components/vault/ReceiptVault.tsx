import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar as CalendarIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";

// Mock data for the vault
const mockReceipts = [
  {
    id: '1',
    vendor: 'Starbucks',
    amount: 18.50,
    date: new Date('2026-05-20'),
    category: 'Food & Drink',
    imageUrl: 'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?auto=format&fit=crop&q=80&w=400',
    verified: true,
  },
  {
    id: '2',
    vendor: 'Shell Petrol',
    amount: 80.00,
    date: new Date('2026-05-21'),
    category: 'Transport',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400',
    verified: true,
  },
  {
    id: '3',
    vendor: 'Apple Store',
    amount: 599.00,
    date: new Date('2026-05-22'),
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba3f21?auto=format&fit=crop&q=80&w=400',
    verified: false,
  },
  {
    id: '4',
    vendor: 'Grab Food',
    amount: 32.40,
    date: new Date('2026-05-23'),
    category: 'Food & Drink',
    imageUrl: 'https://images.unsplash.com/photo-1526367790999-0150786486a9?auto=format&fit=crop&q=80&w=400',
    verified: true,
  },
];

export default function ReceiptVault() {
  return (
    <div className="space-y-8">
      {/* Vault Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Receipt Vault</h2>
          <p className="text-zinc-500">Your secure archive of all scanned expenses.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search vendor or category..." 
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
          { label: 'Total Vaulted', value: '142' },
          { label: 'This Month', value: '28' },
          { label: 'Unverified', value: '3' },
          { label: 'Storage Used', value: '42 MB' },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{stat.label}</p>
            <p className="text-lg font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Receipt Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockReceipts.map((receipt) => (
          <Card 
            key={receipt.id} 
            className="group overflow-hidden rounded-3xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
              <img 
                src={receipt.imageUrl} 
                alt={receipt.vendor}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                  receipt.verified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {receipt.verified ? 'LHDN VERIFIED' : 'PENDING'}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <ExternalLink className="h-5 w-5 text-zinc-900" />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-zinc-900 line-clamp-1">{receipt.vendor}</h3>
                  <div className="flex items-center gap-1.5 text-zinc-500 mt-0.5">
                    <CalendarIcon className="h-3 w-3" />
                    <span className="text-xs">{format(receipt.date, 'dd MMM yyyy')}</span>
                  </div>
                </div>
                <p className="font-black text-zinc-900">RM {receipt.amount.toFixed(2)}</p>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-medium text-zinc-400 px-2 py-0.5 bg-zinc-50 rounded-md">
                  {receipt.category}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">AVIF COMPRESSED</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
