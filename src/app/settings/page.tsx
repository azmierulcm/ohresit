import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Bell, 
  CreditCard,
  ChevronRight,
  Globe
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-5 pb-24 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your profile and LHDN compliance</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Personal Profile</h3>
        <Card className="p-6 rounded-[2rem] border-zinc-100 shadow-sm bg-white overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-lg">Alex Johnson</h4>
              <p className="text-sm text-zinc-500">alex.j@example.com</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
              <Input defaultValue="Alex Johnson" className="h-12 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Currency</label>
              <select className="w-full h-12 rounded-xl bg-zinc-50 border-transparent px-3 font-semibold text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none">
                <option>MYR - Malaysian Ringgit</option>
                <option>USD - US Dollar</option>
              </select>
            </div>
          </div>
        </Card>
      </section>

      {/* LHDN Configuration */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">LHDN Compliance (Malaysia)</h3>
        <Card className="p-6 rounded-[2.5rem] border-none bg-emerald-600 text-white shadow-xl shadow-emerald-100">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-6 w-6" />
            <h4 className="font-bold text-lg">MyInvois Integration</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest ml-1">TIN (Tax Identification Number)</label>
              <Input 
                placeholder="CXXXXXXXXXX" 
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20 focus:border-white transition-all mt-1" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest ml-1">BRN (Business Registration No)</label>
              <Input 
                placeholder="2024XXXXXXXX" 
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20 focus:border-white transition-all mt-1" 
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <Button className="w-full rounded-2xl bg-white text-emerald-600 font-bold hover:bg-emerald-50 transition-colors h-14">
               Link MyInvois Account
            </Button>
            <p className="text-[10px] text-emerald-100 mt-3 text-center opacity-80 italic">
               Securely connected to LHDN Malaysia Sandbox/Production API
            </p>
          </div>
        </Card>
      </section>

      {/* Other Settings */}
      <section className="space-y-2">
        {[
          { icon: Bell, label: 'Notifications', value: 'On' },
          { icon: CreditCard, label: 'Subscription', value: 'Premium' },
          { icon: Globe, label: 'Language', value: 'English (UK)' },
        ].map((item, i) => (
          <button key={i} className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-zinc-100 active:scale-[0.98] transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
                <item.icon className="h-5 w-5 text-zinc-500" />
              </div>
              <span className="font-bold text-zinc-900">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400 font-medium">{item.value}</span>
              <ChevronRight className="h-4 w-4 text-zinc-300" />
            </div>
          </button>
        ))}
      </section>

      <div className="pt-8">
        <Button variant="ghost" className="w-full h-14 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors">
           Sign Out
        </Button>
      </div>
    </div>
  );
}
