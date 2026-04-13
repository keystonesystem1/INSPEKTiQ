'use client';

import type { CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'sm';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  style,
  disabled,
  type = 'button',
}: ButtonProps) {
  const background =
    variant === 'primary' ? 'var(--sage)' : variant === 'danger' ? 'var(--orange)' : 'transparent';
  const color =
    variant === 'primary' ? 'var(--on-accent)' : variant === 'danger' ? 'var(--on-accent)' : 'var(--muted)';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: '12px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: size === 'sm' ? '8px 16px' : '13px 28px',
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
        opacity: disabled ? 0.5 : 1,
        background,
        color,
        boxShadow:
          variant === 'primary' ? '0 2px 8px rgba(91, 194, 115, 0.25)' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
