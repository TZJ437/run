import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** 玻璃强度，subtle 较弱, default 默认 */
  variant?: 'default' | 'subtle'
  /** 圆角 */
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  /** 是否开启高光悬浮动画 */
  interactive?: boolean
}

const roundedMap = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
}

export default function GlassCard({
  children,
  variant = 'default',
  rounded = '2xl',
  interactive = false,
  className = '',
  ...rest
}: GlassCardProps) {
  const base = variant === 'subtle' ? 'liquid-glass-subtle' : 'liquid-glass'
  const interactiveCls = interactive
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl'
    : ''
  return (
    <div
      {...rest}
      className={`relative overflow-hidden ${base} ${roundedMap[rounded]} ${interactiveCls} ${className}`}
    >
      {/* 顶部高光 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30"
      />
      {children}
    </div>
  )
}
