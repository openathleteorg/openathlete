import { ReactNode } from 'react';

import { Footer } from './footer';
import { Navbar } from './navbar';

interface P {
  children: ReactNode;
}

export function AppLayout({ children }: P) {
  return (
    <div className="min-h-svh flex flex-col bg-[var(--oa-bg)] text-[var(--oa-fg)] font-sans">
      <Navbar />
      <main
        id="main"
        className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-10"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
