'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VERSION = 'v2.1.0';
const DEPLOYED = '14 Sep 2026'; // Update with each deployment

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="BOL Messenger" className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">BOL Seller Messenger</span>
                <span className="text-xs text-gray-500">{VERSION} • {DEPLOYED}</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                  pathname === '/' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                  pathname === '/settings' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                Instellingen
              </Link>
              <Link
                href="/history"
                className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                  pathname === '/history' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                Geschiedenis
              </Link>
            </nav>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
