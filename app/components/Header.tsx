'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              BOL Seller Messenger
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
