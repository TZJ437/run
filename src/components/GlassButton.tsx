import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function GlassButton({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...rest
}: Props) {
  const base =
    variant === 'primary'
      ? 'bg-accent/90 text-white border border-white/20 shadow-lg shadow-accent/25 hover:bg-accent'
      : variant === 'ghost'
      ? 'bg-transparent hover:bg-white/30 dark:hover:bg-white/10 border border-transparent'
      : 'liquid-glass-subtle text-fg hover:bg-white/50 dark:hover:bg-white/10'
  return (
    <button
      {...rest}
      className={`btn-press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ${sizeMap[size]} ${base} ${className}`}
    >
      {children}
    </button>
  )
}
