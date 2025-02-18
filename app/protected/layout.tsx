import { headers } from 'next/headers';
import { UserProvider } from "@/lib/contexts/user-context";
import AuthButton from '@/components/header-auth';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useState } from 'react';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const displayName = headersList.get('x-user-display-name') || 'Guest';

  return (
    <div className="flex-1 flex flex-col">
      <UserProvider displayName={displayName}>
        <header className="fixed top-0 h-16 border-b border-slate-200 dark:border-slate-700 bg-background z-40 flex items-center px-4 transition-all duration-300 right-0" style={{ left: 'var(--sidebar-width, 4rem)' }}>
          <Link href="/protected" className="text-xl font-bold hover:text-[#EF4444] transition-colors">
            <span className="text-white">Kiku</span><span className="text-[#F87171]">Key</span>
          </Link>
          <div className="flex-1" />
          <AuthButton />
        </header>
        <main className="flex-1 pt-16">
          {children}
        </main>
      </UserProvider>
    </div>
  );
} 