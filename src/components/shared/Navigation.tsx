"use client";

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Receipt, 
  ShieldCheck, 
  Plus, 
  Settings,
  Search
} from 'lucide-react';

const navItems = [
  { name: 'Home', icon: LayoutDashboard, href: '/' },
  { name: 'Ledger', icon: Receipt, href: '/ledger' },
  { name: 'Vault', icon: Search, href: '/vault' },
  { name: 'Tax', icon: ShieldCheck, href: '/compliance' },
];

export default function Navigation({ onOpenAdd }: { onOpenAdd: () => void }) {
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-6 py-3 flex justify-between items-center md:hidden z-50">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className="flex flex-col items-center gap-1 group"
          >
            <item.icon className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-900 uppercase tracking-tight">
              {item.name}
            </span>
          </Link>
        ))}
        {/* Mobile Quick Add Button */}
        <button 
          onClick={onOpenAdd}
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white p-4 rounded-full shadow-xl shadow-zinc-200 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-zinc-100 p-8 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 italic">FinVault.</span>
        </div>

        <div className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-zinc-500 font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
            >
              <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="pt-8 border-t border-zinc-50 space-y-4">
          <button 
            onClick={onOpenAdd}
            className="w-full bg-zinc-900 text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 shadow-lg shadow-zinc-100 hover:bg-zinc-800 transition-all"
          >
            <Plus className="h-4 w-4" /> Quick Add
          </button>
          
          <Link 
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-zinc-400 font-bold hover:text-zinc-900 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
