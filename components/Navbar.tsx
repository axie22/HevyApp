'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUnits } from '@/lib/units';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/profile', label: 'Profile' },
];

export function Navbar() {
  const pathname = usePathname();
  const { unit, toggle } = useUnits();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <svg
            className="w-5 h-5 text-indigo-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4v16M18 4v16M2 8h4M18 8h4M2 16h4M18 16h4M6 12h12" />
          </svg>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">
            Training Intelligence
          </span>
        </div>

        {/* Nav links + unit toggle */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggle}
            className="ml-1 px-2.5 py-1 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors tabular-nums"
            title="Toggle weight unit"
          >
            {unit.toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}
