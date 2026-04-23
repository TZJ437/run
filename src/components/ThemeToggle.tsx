import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? '切换到浅色' : '切换到深色'}
      className="btn-press liquid-glass-subtle relative flex h-10 w-10 items-center justify-center rounded-full text-fg"
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
          isDark ? 'rotate-[-180deg] scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      >
        <Sun size={18} />
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-180 scale-50 opacity-0'
        }`}
      >
        <Moon size={18} />
      </span>
    </button>
  )
}
