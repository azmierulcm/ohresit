"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '@/components/shared/Navigation';
import HybridEntryFlow from '@/components/ledger/HybridEntryFlow';
import { UIProvider, useUI } from '@/lib/context/UIContext';
import { AuthProvider } from '@/lib/context/AuthContext';
import AuthGuard from '@/components/shared/AuthGuard';

const HIDE_NAV_ROUTES = ['/login'];

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isEntryModalOpen, closeEntryModal } = useUI();
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen bg-zinc-50/30">
      {!hideNav && <Navigation />}

      <main className={hideNav ? '' : 'md:ml-72 min-h-screen'}>
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>

      {isEntryModalOpen && (
        <HybridEntryFlow onClose={closeEntryModal} />
      )}
    </div>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <AuthGuard>
          <AppLayout>{children}</AppLayout>
        </AuthGuard>
      </UIProvider>
    </AuthProvider>
  );
}
