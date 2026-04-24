import { useNavigate } from 'react-router-dom'
import { LogOut, RotateCcw, Sparkles, Moon, Sun, User2 } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import { DEFAULT_COLORS, GLASS_VARIANTS, useTheme } from '@/contexts/ThemeContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'

const ACCENT_PRESETS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#64748b']
const BG_LIGHT_PRESETS = ['#f5f5f7', '#fff7ed', '#f0f9ff', '#f0fdf4', '#fdf4ff']
const BG_DARK_PRESETS = ['#0a0a0e', '#0f172a', '#1a1625', '#1b1a0f', '#0b1415']
const AVATAR_EMOJIS = ['🌙', '✨', '🌊', '🍃', '🌸', '🔥', '⚡', '🌈', '🪐', '☕', '🍀', '🐱', '🦊', '🌺']
const AVATAR_COLORS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#64748b', '#0ea5e9']

export default function SettingsPage() {
  const { theme, toggleTheme, colors, setColors, resetColors, glassVariant, setGlassVariant } = useTheme()
  const { profile, setProfile } = useProfile()
  const { signOut } = useAuth()
  const nav = useNavigate()

  const onSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
        <p className="text-sm text-fg/60">个性化你的 LightGlass</p>
      </div>

      {/* 个人资料 */}
      <GlassCard rounded="3xl" className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <User2 size={16} className="text-fg/60" />
          <h2 className="text-sm font-semibold">个人资料</h2>
        </div>

        {/* 头像预览 + 昵称输入 */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-md"
            style={{ background: profile.avatarColor }}
          >
            {profile.avatarEmoji}
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-fg/60">昵称</label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => setProfile({ nickname: e.target.value })}
              placeholder="写一个称呼"
              maxLength={16}
              className="liquid-glass-subtle w-full rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {/* 头像 emoji */}
        <div className="space-y-2">
          <label className="text-xs text-fg/60">头像图标</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setProfile({ avatarEmoji: e })}
                className={`btn-press flex h-9 w-9 items-center justify-center rounded-xl text-xl ring-2 transition ${
                  profile.avatarEmoji === e ? 'ring-fg/60 scale-110' : 'ring-white/30 hover:ring-white/60'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 头像颜色 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-fg/60">头像底色</label>
            <input
              type="color"
              value={profile.avatarColor}
              onChange={(e) => setProfile({ avatarColor: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded-md border border-white/30 bg-transparent"
              aria-label="头像颜色"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setProfile({ avatarColor: c })}
                aria-label={`头像颜色 ${c}`}
                className={`btn-press h-8 w-8 rounded-full ring-2 transition ${
                  profile.avatarColor.toLowerCase() === c.toLowerCase()
                    ? 'ring-fg/60 scale-110'
                    : 'ring-white/30'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 外观 - 主题模式 */}
      <GlassCard rounded="3xl" className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-fg/60" />
          <h2 className="text-sm font-semibold">外观</h2>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">主题模式</span>
          <button
            onClick={toggleTheme}
            className="btn-press liquid-glass-subtle flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'dark' ? '深色' : '浅色'}
          </button>
        </div>

        {/* 玻璃风格 */}
        <div className="space-y-2">
          <label className="text-xs text-fg/60">玻璃风格 · 一键切换</label>
          <div className="grid grid-cols-2 gap-2">
            {GLASS_VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setGlassVariant(v.id)}
                className={`btn-press liquid-glass-subtle rounded-2xl p-3 text-left transition ${
                  glassVariant === v.id ? 'ring-2 ring-accent/70' : ''
                }`}
              >
                <div className="text-sm font-medium">{v.label}</div>
                <div className="mt-0.5 text-xs text-fg/60">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 强调色 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-fg/60">强调色</label>
            <input
              type="color"
              value={colors.accent}
              onChange={(e) => setColors({ accent: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded-md border border-white/30 bg-transparent"
              aria-label="强调色"
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
        </div>

        {/* 背景色 */}
        <div className="space-y-2">
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
              aria-label="背景色"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(theme === 'dark' ? BG_DARK_PRESETS : BG_LIGHT_PRESETS).map((c) => {
              const cur = theme === 'dark' ? colors.bgDark : colors.bgLight
              return (
                <button
                  key={c}
                  onClick={() => setColors(theme === 'dark' ? { bgDark: c } : { bgLight: c })}
                  aria-label={`背景 ${c}`}
                  className={`btn-press h-8 w-14 rounded-lg ring-2 transition ${
                    cur.toLowerCase() === c.toLowerCase() ? 'ring-fg/60 scale-105' : 'ring-white/30'
                  }`}
                  style={{ background: c }}
                />
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={resetColors}
            disabled={
              colors.accent === DEFAULT_COLORS.accent &&
              colors.bgLight === DEFAULT_COLORS.bgLight &&
              colors.bgDark === DEFAULT_COLORS.bgDark
            }
          >
            <RotateCcw size={14} /> 恢复默认配色
          </GlassButton>
        </div>
      </GlassCard>

      {/* 账户 */}
      <GlassCard rounded="3xl" className="space-y-4 p-5">
        <h2 className="text-sm font-semibold">账户</h2>
        <GlassButton variant="ghost" onClick={onSignOut} className="w-full justify-start">
          <LogOut size={14} /> 退出登录
        </GlassButton>
      </GlassCard>
    </div>
  )
}
