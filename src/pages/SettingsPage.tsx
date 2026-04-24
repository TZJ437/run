import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import { LogOut, RotateCcw, Sparkles, Moon, Sun, User2, LogIn, Upload, X, Lock, ArrowLeft } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import Avatar from '@/components/Avatar'
import { DEFAULT_COLORS, GLASS_VARIANTS, useTheme } from '@/contexts/ThemeContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'

const ACCENT_PRESETS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#64748b']
const BG_LIGHT_PRESETS = ['#f5f5f7', '#fff7ed', '#f0f9ff', '#f0fdf4', '#fdf4ff']
const BG_DARK_PRESETS = ['#0a0a0e', '#0f172a', '#1a1625', '#1b1a0f', '#0b1415']
const AVATAR_COLORS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#64748b', '#0ea5e9']

export default function SettingsPage() {
  const { theme, toggleTheme, colors, setColors, resetColors, glassVariant, setGlassVariant } = useTheme()
  const { profile, setProfile, uploadAvatar, clearAvatar } = useProfile()
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const locked = !user // 未登录：禁用个性化
  const onSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  const onPickFile = async (f: File | null) => {
    if (!f) return
    setUploadErr(null)
    setUploading(true)
    try {
      await uploadAvatar(f)
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onBack = () => {
    if (window.history.length > 1) nav(-1)
    else nav('/', { replace: true })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="btn-press liquid-glass-subtle flex h-10 w-10 items-center justify-center rounded-full"
          aria-label="返回"
          title="返回"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">设置</h1>
          <p className="text-sm text-fg/60">个性化你的 LightGlass</p>
        </div>
      </div>

      {/* 未登录：顶部醒目登录提示 */}
      {locked && (
        <GlassCard rounded="3xl" className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Lock size={16} />
            <h2 className="text-sm font-semibold">请登录以使用完整功能</h2>
          </div>
          <p className="text-xs text-fg/70">
            登录后可自定义头像昵称、使用随手记、多设备同步。当前访客模式下，个性化项已锁定。
          </p>
          <GlassButton variant="primary" onClick={() => nav('/login')} className="w-full">
            <LogIn size={14} /> 登录或注册
          </GlassButton>
        </GlassCard>
      )}

      {/* 个人资料 */}
      <GlassCard rounded="3xl" className={`space-y-4 p-5 ${locked ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2">
          <User2 size={16} className="text-fg/60" />
          <h2 className="text-sm font-semibold">个人资料</h2>
          {locked && <Lock size={12} className="text-fg/40" />}
        </div>

        <div className="flex items-center gap-4">
          <Avatar size={72} />
          <div className="flex-1 space-y-1">
            <label className="text-xs text-fg/60">昵称</label>
            <input
              type="text"
              disabled={locked}
              value={profile.nickname}
              onChange={(e) => setProfile({ nickname: e.target.value })}
              placeholder={locked ? '请先登录' : '写一个称呼'}
              maxLength={16}
              className="liquid-glass-subtle w-full rounded-xl px-3 py-2 text-sm outline-none disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 上传头像 */}
        <div className="space-y-2">
          <label className="text-xs text-fg/60">头像图片</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2">
            <GlassButton
              size="sm"
              disabled={locked || uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} /> {uploading ? '上传中…' : profile.avatarImage ? '更换头像' : '上传头像'}
            </GlassButton>
            {profile.avatarImage && !locked && (
              <GlassButton size="sm" variant="ghost" onClick={clearAvatar}>
                <X size={14} /> 移除
              </GlassButton>
            )}
          </div>
          {uploadErr && <p className="text-xs text-rose-500">{uploadErr}</p>}
          <p className="text-xs text-fg/50">支持 JPG/PNG，自动裁剪为正方形并压缩</p>
        </div>

        {/* 无图时的头像底色 */}
        {!profile.avatarImage && (
          <div className="space-y-2">
            <label className="text-xs text-fg/60">
              底色（无头像时显示首字母用）
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  disabled={locked}
                  onClick={() => setProfile({ avatarColor: c })}
                  aria-label={`底色 ${c}`}
                  className={`btn-press h-8 w-8 rounded-full ring-2 transition disabled:cursor-not-allowed ${
                    profile.avatarColor.toLowerCase() === c.toLowerCase()
                      ? 'ring-fg/60 scale-110'
                      : 'ring-white/30'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* 外观（全员可用：主题属于基础浏览体验） */}
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

        {/* 颜色（锁定态） */}
        <div className={`space-y-4 ${locked ? 'opacity-60' : ''}`}>
          {locked && (
            <p className="text-xs text-fg/60">
              <Lock size={10} className="-mt-0.5 mr-1 inline" />
              颜色自定义需要登录
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fg/60">强调色</label>
              <input
                type="color"
                disabled={locked}
                value={colors.accent}
                onChange={(e) => setColors({ accent: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded-md border border-white/30 bg-transparent disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  disabled={locked}
                  onClick={() => setColors({ accent: c })}
                  className={`btn-press h-8 w-8 rounded-full ring-2 transition disabled:cursor-not-allowed ${
                    colors.accent.toLowerCase() === c.toLowerCase()
                      ? 'ring-fg/60 scale-110'
                      : 'ring-white/30'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-fg/60">
                背景色 · {theme === 'dark' ? '深色' : '浅色'}模式
              </label>
              <input
                type="color"
                disabled={locked}
                value={theme === 'dark' ? colors.bgDark : colors.bgLight}
                onChange={(e) =>
                  setColors(theme === 'dark' ? { bgDark: e.target.value } : { bgLight: e.target.value })
                }
                className="h-7 w-10 cursor-pointer rounded-md border border-white/30 bg-transparent disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(theme === 'dark' ? BG_DARK_PRESETS : BG_LIGHT_PRESETS).map((c) => {
                const cur = theme === 'dark' ? colors.bgDark : colors.bgLight
                return (
                  <button
                    key={c}
                    disabled={locked}
                    onClick={() => setColors(theme === 'dark' ? { bgDark: c } : { bgLight: c })}
                    className={`btn-press h-8 w-14 rounded-lg ring-2 transition disabled:cursor-not-allowed ${
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
              disabled={
                locked ||
                (colors.accent === DEFAULT_COLORS.accent &&
                  colors.bgLight === DEFAULT_COLORS.bgLight &&
                  colors.bgDark === DEFAULT_COLORS.bgDark)
              }
              onClick={resetColors}
            >
              <RotateCcw size={14} /> 恢复默认配色
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* 账户（仅已登录可见） */}
      {user && (
        <GlassCard rounded="3xl" className="space-y-3 p-5">
          <h2 className="text-sm font-semibold">账户</h2>
          <p className="text-xs text-fg/60">{user.email ?? '已登录'}</p>
          <GlassButton variant="ghost" onClick={onSignOut} className="w-full justify-start">
            <LogOut size={14} /> 退出登录
          </GlassButton>
        </GlassCard>
      )}
    </div>
  )
}
