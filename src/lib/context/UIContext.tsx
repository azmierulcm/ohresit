"use client";

import React, { createContext, useContext, useState } from 'react';

interface UIContextType {
  isEntryModalOpen: boolean;
  openEntryModal: () => void;
  closeEntryModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  const openEntryModal = () => setIsEntryModalOpen(true);
  const closeEntryModal = () => setIsEntryModalOpen(false);

  return (
    <UIContext.Provider value={{ isEntryModalOpen, openEntryModal, closeEntryModal }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
