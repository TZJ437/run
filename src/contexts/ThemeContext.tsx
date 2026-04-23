import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

export interface ThemeColors {
  accent: string // hex, eg "#a78bfa"
  bgLight: string
  bgDark: string
}

export const DEFAULT_COLORS: ThemeColors = {
  accent: '#a78bfa',
  bgLight: '#f5f5f7',
  bgDark: '#0a0a0e',
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: (event?: React.MouseEvent) => void
  setTheme: (theme: Theme) => void
  colors: ThemeColors
  setColors: (c: Partial<ThemeColors>) => void
  resetColors: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'lightglass:theme'
const COLORS_KEY = 'lightglass:colors'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialColors(): ThemeColors {
  if (typeof window === 'undefined') return DEFAULT_COLORS
  try {
    const raw = localStorage.getItem(COLORS_KEY)
    if (!raw) return DEFAULT_COLORS
    const parsed = JSON.parse(raw) as Partial<ThemeColors>
    return { ...DEFAULT_COLORS, ...parsed }
  } catch {
    return DEFAULT_COLORS
  }
}

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '').trim()
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `${r} ${g} ${b}`
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

function applyColors(c: ThemeColors, theme: Theme) {
  const root = document.documentElement
  root.style.setProperty('--accent', hexToRgbTriplet(c.accent))
  root.style.setProperty('--bg', hexToRgbTriplet(theme === 'dark' ? c.bgDark : c.bgLight))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [colors, setColorsState] = useState<ThemeColors>(getInitialColors)

  useEffect(() => {
    applyTheme(theme)
    applyColors(colors, theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, colors])

  useEffect(() => {
    localStorage.setItem(COLORS_KEY, JSON.stringify(colors))
  }, [colors])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const setColors = useCallback((c: Partial<ThemeColors>) => {
    setColorsState((prev) => ({ ...prev, ...c }))
  }, [])
  const resetColors = useCallback(() => setColorsState(DEFAULT_COLORS), [])

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> }
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // 移动端（窄屏）有大量 backdrop-filter 叠加，圆形过渡会卡，直接切换更流畅
    const isNarrow = window.innerWidth < 640
    if (!doc.startViewTransition || prefersReducedMotion || isNarrow) {
      setThemeState(next)
      return
    }

    let x: number
    let y: number
    const target = event?.currentTarget as HTMLElement | undefined
    if (target && typeof target.getBoundingClientRect === 'function') {
      const rect = target.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    } else if (event) {
      x = event.clientX
      y = event.clientY
    } else {
      x = window.innerWidth - 40
      y = 40
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = doc.startViewTransition(() => setThemeState(next))
    transition.ready.then(() => {
      const isGoingDark = next === 'dark'
      const clipPath = isGoingDark
        ? [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
        : [`circle(${endRadius}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`]

      document.documentElement.animate(
        { clipPath },
        {
          duration: 380,
          easing: isGoingDark
            ? 'cubic-bezier(0.16, 1, 0.3, 1)'
            : 'cubic-bezier(0.7, 0, 0.84, 0)',
          pseudoElement: isGoingDark
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
        },
      )
    })
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme, colors, setColors, resetColors }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
