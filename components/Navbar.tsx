'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUnits } from '@/lib/units';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/training', label: 'Training' },
  { href: '/recovery', label: 'Recovery' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/coach', label: 'Coach' },
  { href: '/profile', label: 'Profile' },
];

export function Navbar() {
  const pathname = usePathname();
  const { unit, toggle } = useUnits();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-12"
      style={{
        background: 'rgba(8,8,8,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="shrink-0"
            style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: 3 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--text-2)',
              fontWeight: 600,
            }}
          >
            GAUGE
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-0.5">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-md transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    fontWeight: 500,
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                  }}
                >
                  {label.toUpperCase()}
                </Link>
              );
            })}
          </nav>

          <div
            className="mx-2"
            style={{ width: 1, height: 16, background: 'var(--border-up)' }}
          />

          <button
            onClick={toggle}
            className="px-2.5 py-1.5 rounded-md transition-colors duration-150 hover:border-[var(--accent-border)]"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              fontWeight: 600,
              color: 'var(--text-1)',
              border: '1px solid var(--border-up)',
              background: 'var(--surface-up)',
            }}
          >
            {unit.toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}
