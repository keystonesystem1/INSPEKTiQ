'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavTab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '8px 14px',
        borderRadius: 'var(--radius-md)',
        color: active ? 'var(--sage)' : 'var(--muted)',
        position: 'relative',
      }}
    >
      {label}
      {active ? (
        <span
          style={{
            position: 'absolute',
            left: '14px',
            right: '14px',
            bottom: '-12px',
            height: '2px',
            background: 'linear-gradient(90deg, var(--sage), var(--sage-light))',
            borderRadius: '2px 2px 0 0',
          }}
        />
      ) : null}
    </Link>
  );
}
