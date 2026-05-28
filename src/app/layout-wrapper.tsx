import React from 'react';
import Navigation from '@/components/shared/Navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50/30">
      <Navigation />
      {/* 
          Desktop: Offset the content by sidebar width (w-72)
          Mobile: Ensure content doesn't get hidden behind bottom nav (pb-24)
      */}
      <main className="md:ml-72 min-h-screen">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
