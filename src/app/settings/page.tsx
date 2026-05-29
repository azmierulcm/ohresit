"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/lib/context/AuthContext';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { saveUserSettingsAction, saveLhdnCredentialsAction, unlinkLhdnAction } from '@/actions/save-settings';
import {
  User,
  ShieldCheck,
  Bell,
  CreditCard,
  ChevronRight,
  Globe,
  Check,
  Unlink,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();
  const router = useRouter();

  // Profile form state
  const [currency, setCurrency] = useState('MYR');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // LHDN form state
  const [tin, setTin] = useState('');
  const [brn, setBrn] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [lhdnSaving, setLhdnSaving] = useState(false);
  const [lhdnSaved, setLhdnSaved] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  // Populate fields from Firestore profile
  useEffect(() => {
    if (!profile) return;
    setCurrency(profile.settings?.currency || 'MYR');
    setTin(profile.settings?.taxId || '');
    setBrn(profile.settings?.businessRegNo || '');
    if (profile.lhdnCredentials?.clientId) {
      setClientId(profile.lhdnCredentials.clientId);
      // Don't pre-fill secret for security
    }
  }, [profile]);

  const isLinked = !!profile?.lhdnCredentials?.isLinked;

  // ── Save profile settings ─────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    await saveUserSettingsAction(user.uid, { currency });
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // ── Save LHDN credentials ─────────────────────────────────────────────────
  const handleSaveLhdn = async () => {
    if (!user) return;
    if (!tin || !clientId || !clientSecret) {
      alert('Please fill in TIN, Client ID and Client Secret.');
      return;
    }
    setLhdnSaving(true);
    const result = await saveLhdnCredentialsAction(user.uid, { taxId: tin, businessRegNo: brn, clientId, clientSecret });
    setLhdnSaving(false);
    if (!result.success) {
      alert('Failed to save: ' + result.error);
      return;
    }
    setLhdnSaved(true);
    setClientSecret('');
    setTimeout(() => setLhdnSaved(false), 2500);
  };

  // ── Unlink LHDN ───────────────────────────────────────────────────────────
  const handleUnlink = async () => {
    if (!user || !confirm('Unlink your LHDN MyInvois account?')) return;
    setUnlinking(true);
    await unlinkLhdnAction(user.uid);
    setClientId('');
    setClientSecret('');
    setUnlinking(false);
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="max-w-2xl mx-auto p-5 pb-24 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your profile and LHDN compliance</p>
      </div>

      {/* ── Profile ────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Personal Profile</h3>
        <Card className="p-6 rounded-[2rem] border-zinc-100 shadow-sm bg-white overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 overflow-hidden">
              {user?.photoURL
                ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                : <User className="h-8 w-8" />}
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-lg">{user?.displayName || 'Your Name'}</h4>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
              <Input
                defaultValue={user?.displayName || ''}
                disabled
                className="h-12 rounded-xl bg-zinc-50 border-transparent text-zinc-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-400 ml-1 mt-1">Name is managed via your Google account.</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-12 rounded-xl bg-zinc-50 border-transparent px-3 font-semibold text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="MYR">MYR - Malaysian Ringgit</option>
                <option value="USD">USD - US Dollar</option>
                <option value="SGD">SGD - Singapore Dollar</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={profileSaving || loading}
            className="mt-6 w-full h-12 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all"
          >
            {profileSaved ? <><Check className="mr-2 h-4 w-4" /> Saved!</> : profileSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </Card>
      </section>

      {/* ── LHDN MyInvois ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">LHDN Compliance (Malaysia)</h3>
        <Card className="p-6 rounded-[2.5rem] border-none bg-emerald-600 text-white shadow-xl shadow-emerald-100">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6" />
              <h4 className="font-bold text-lg">MyInvois Integration</h4>
            </div>
            {isLinked && (
              <span className="text-[10px] font-bold bg-white/20 text-white px-3 py-1 rounded-full tracking-widest uppercase">
                Linked ✓
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest ml-1">TIN (Tax Identification Number)</label>
              <Input
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="CXXXXXXXXXX"
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20 focus:border-white transition-all mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest ml-1">BRN (Business Registration No.)</label>
              <Input
                value={brn}
                onChange={(e) => setBrn(e.target.value)}
                placeholder="202401XXXXXX"
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20 focus:border-white transition-all mt-1"
              />
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest ml-1 mb-3 flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> MyInvois API Credentials
              </p>
              <div className="space-y-3">
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID"
                  className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20 focus:border-white transition-all"
                />
                <div className="relative">
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={isLinked ? 'Enter new secret to update' : 'Client Secret'}
                    className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:bg-white/20 focus:border-white transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-200 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-emerald-100/70 mt-2 ml-1 italic">
                Get these from{' '}
                <a
                  href="https://mytax.hasil.gov.my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  mytax.hasil.gov.my
                </a>
                {' '}→ MyInvois → API Access
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleSaveLhdn}
              disabled={lhdnSaving || loading}
              className="w-full rounded-2xl bg-white text-emerald-600 font-bold hover:bg-emerald-50 transition-colors h-14"
            >
              {lhdnSaved
                ? <><Check className="mr-2 h-4 w-4" /> Linked!</>
                : lhdnSaving
                ? 'Saving…'
                : isLinked ? 'Update LHDN Account' : 'Link MyInvois Account'}
            </Button>

            {isLinked && (
              <Button
                variant="ghost"
                onClick={handleUnlink}
                disabled={unlinking}
                className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm font-medium"
              >
                <Unlink className="mr-2 h-4 w-4" />
                {unlinking ? 'Unlinking…' : 'Unlink Account'}
              </Button>
            )}
          </div>
        </Card>
      </section>

      {/* ── Other Settings ────────────────────────────────────────────────── */}
      <section className="space-y-2">
        {[
          { icon: Bell, label: 'Notifications', value: 'On' },
          { icon: CreditCard, label: 'Subscription', value: 'Free' },
          { icon: Globe, label: 'Language', value: 'English (MY)' },
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
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full h-14 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
