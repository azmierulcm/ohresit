"use client";

import React, { useState } from 'react';
import Navigation from '@/components/shared/Navigation';
import HybridEntryFlow from '@/components/ledger/HybridEntryFlow';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50/30">
      <Navigation onOpenAdd={() => setIsEntryModalOpen(true)} />
      
      <main className="md:ml-72 min-h-screen">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>

      {isEntryModalOpen && (
        <HybridEntryFlow onClose={() => setIsEntryModalOpen(false)} />
      )}
    </div>
  );
}
