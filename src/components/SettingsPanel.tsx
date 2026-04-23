import { useEffect, useRef } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { DEFAULT_COLORS, useTheme } from '@/contexts/ThemeContext'
import GlassButton from './GlassButton'

interface Props {
  open: boolean
  onClose: () => void
}

const ACCENT_PRESETS = [
  '#a78bfa', // 紫
  '#38bdf8', // 蓝
  '#34d399', // 绿
  '#fbbf24', // 黄
  '#fb7185', // 粉红
  '#f97316', // 橙
  '#64748b', // 石板灰
]

const BG_LIGHT_PRESETS = ['#f5f5f7', '#fff7ed', '#f0f9ff', '#f0fdf4', '#fdf4ff']
const BG_DARK_PRESETS = ['#0a0a0e', '#0f172a', '#1a1625', '#1b1a0f', '#0b1415']

export default function SettingsPanel({ open, onClose }: Props) {
  const { colors, setColors, resetColors, theme } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="liquid-glass w-full max-w-md space-y-5 rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">个性化</h2>
          <button
            onClick={onClose}
            className="btn-press liquid-glass-subtle flex h-8 w-8 items-center justify-center rounded-full"
            aria-label="关闭"
          >
            <X size={14} />
          </button>
        </div>

        {/* 强调色 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-fg/60">强调色（按钮、链接）</label>
            <input
              type="color"
              value={colors.accent}
              onChange={(e) => setColors({ accent: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded-md border border-white/30 bg-transparent"
              aria-label="强调色自定义"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColors({ accent: c })}
                aria-label={`强调色 ${c}`}
                className={`btn-press h-8 w-8 rounded-full ring-2 transition ${
                  colors.accent.toLowerCase() === c.toLowerCase()
                    ? 'ring-fg/60 scale-110'
                    : 'ring-white/30'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </section>

        {/* 背景色 */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-fg/60">
              背景色 · {theme === 'dark' ? '深色模式' : '浅色模式'}
            </label>
            <input
              type="color"
              value={theme === 'dark' ? colors.bgDark : colors.bgLight}
              onChange={(e) =>
                setColors(theme === 'dark' ? { bgDark: e.target.value } : { bgLight: e.target.value })
              }
              className="h-7 w-10 cursor-pointer rounded-md border border-white/30 bg-transparent"
              aria-label="背景色自定义"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(theme === 'dark' ? BG_DARK_PRESETS : BG_LIGHT_PRESETS).map((c) => {
              const active = (theme === 'dark' ? colors.bgDark : colors.bgLight).toLowerCase() === c.toLowerCase()
              return (
                <button
                  key={c}
                  onClick={() =>
                    setColors(theme === 'dark' ? { bgDark: c } : { bgLight: c })
                  }
                  aria-label={`背景 ${c}`}
                  className={`btn-press h-8 w-14 rounded-lg ring-2 transition ${
                    active ? 'ring-fg/60 scale-105' : 'ring-white/30'
                  }`}
                  style={{ background: c }}
                />
              )
            })}
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-fg/50">配色会保存在本机</p>
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => resetColors()}
            disabled={
              colors.accent === DEFAULT_COLORS.accent &&
              colors.bgLight === DEFAULT_COLORS.bgLight &&
              colors.bgDark === DEFAULT_COLORS.bgDark
            }
          >
            <RotateCcw size={14} /> 恢复默认
          </GlassButton>
        </div>
      </div>
    </div>
  )
}
