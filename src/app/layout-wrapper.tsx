"use client";

import React from 'react';
import Navigation from '@/components/shared/Navigation';
import HybridEntryFlow from '@/components/ledger/HybridEntryFlow';
import { UIProvider, useUI } from '@/lib/context/UIContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isEntryModalOpen, closeEntryModal } = useUI();

  return (
    <div className="min-h-screen bg-zinc-50/30">
      <Navigation />
      
      <main className="md:ml-72 min-h-screen">
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

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <AppLayout>{children}</AppLayout>
    </UIProvider>
  );
}
