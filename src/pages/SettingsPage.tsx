import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import {
  LogOut,
  RotateCcw,
  Sparkles,
  Moon,
  Sun,
  User2,
  LogIn,
  Upload,
  X,
  Lock,
  ArrowLeft,
  Key,
  MessageCircle,
  Eye,
  EyeOff,
  Info,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Github,
  Heart,
} from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import Avatar from '@/components/Avatar'
import { DEFAULT_COLORS, GLASS_VARIANTS, useTheme } from '@/contexts/ThemeContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { getApiKey, setApiKey } from '@/lib/deepseek'
import {
  APP_VERSION,
  LATEST_APK_URL,
  LATEST_RELEASE_PAGE,
  checkForUpdate,
  type UpdateCheckResult,
} from '@/lib/update'
import { isNativeApp, platformLabel } from '@/lib/platform'

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
  const [apiKeyDraft, setApiKeyDraft] = useState(() => getApiKey())
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null)
  const [checkErr, setCheckErr] = useState<string | null>(null)

  const runCheckUpdate = async () => {
    setChecking(true)
    setCheckErr(null)
    setCheckResult(null)
    try {
      const r = await checkForUpdate()
      setCheckResult(r)
    } catch (e) {
      setCheckErr(e instanceof Error ? e.message : '检查失败')
    } finally {
      setChecking(false)
    }
  }

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

      {/* AI 对话：DeepSeek API Key */}
      <GlassCard rounded="3xl" className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-fg/60" />
          <h2 className="text-sm font-semibold">AI 对话（DeepSeek）</h2>
        </div>
        <p className="text-xs text-fg/60">
          填入你自己的 API key 才能使用 AI 对话，key 仅保存在本机浏览器里，不会上传服务器。留空则 AI 对话不可用。
        </p>
        <label className="text-xs text-fg/60">
          <span className="inline-flex items-center gap-1">
            <Key size={12} /> API Key
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKeyDraft}
            onChange={(e) => {
              setApiKeyDraft(e.target.value)
              setKeySaved(false)
            }}
            placeholder="sk-..."
            aria-label="DeepSeek API Key"
            className="liquid-glass-subtle flex-1 rounded-xl px-3 py-2 font-mono text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? '隐藏' : '显示'}
            title={showKey ? '隐藏 key' : '显示 key'}
            className="btn-press liquid-glass-subtle flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <GlassButton
            size="sm"
            variant="primary"
            onClick={() => {
              setApiKey(apiKeyDraft)
              setKeySaved(true)
              setTimeout(() => setKeySaved(false), 1600)
            }}
          >
            保存
          </GlassButton>
          <GlassButton
            size="sm"
            variant="ghost"
            onClick={() => {
              setApiKey('')
              setApiKeyDraft('')
              setKeySaved(false)
            }}
          >
            清空
          </GlassButton>
          {keySaved && <span className="self-center text-xs text-emerald-500">已保存 ✓</span>}
        </div>
        <p className="text-xs text-fg/50">
          获取 key：前往 <span className="underline">platform.deepseek.com</span> → API keys
        </p>
      </GlassCard>

      {/* Android 下载（非原生壳 + Android 系统才显示，iOS/桌面也显示一个较低调的版本） */}
      {!isNativeApp() && (
        <GlassCard rounded="3xl" className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-fg/60" />
            <h2 className="text-sm font-semibold">安装到手机</h2>
          </div>
          <p className="text-xs text-fg/60">
            想要更顺滑的离线体验？下载 Android 版 APK，或直接把网页"添加到主屏幕"。
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={LATEST_APK_URL}
              rel="noopener noreferrer"
              className="no-underline"
            >
              <GlassButton variant="primary" size="sm">
                <Download size={14} /> 下载最新 APK
              </GlassButton>
            </a>
            <a
              href={LATEST_RELEASE_PAGE}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              <GlassButton variant="ghost" size="sm">
                <Github size={14} /> 历史版本
              </GlassButton>
            </a>
          </div>
          <p className="text-[11px] text-fg/40">
            Android 安装时可能需要"允许未知来源"；iOS 可用 PWA（Safari → 共享 → 添加到主屏幕）
          </p>
        </GlassCard>
      )}

      {/* 检查更新 */}
      <GlassCard rounded="3xl" className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-fg/60" />
          <h2 className="text-sm font-semibold">检查更新</h2>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-fg/60">
              当前版本 <span className="font-mono">v{APP_VERSION}</span> · {platformLabel()}
            </p>
            {checkResult && !checkErr && (
              checkResult.hasUpdate ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle size={12} />
                  发现新版本 <span className="font-mono">v{checkResult.latest.version}</span>
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  已是最新版本
                </p>
              )
            )}
            {checkErr && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                <AlertCircle size={12} />
                {checkErr}
              </p>
            )}
          </div>
          <GlassButton size="sm" onClick={runCheckUpdate} disabled={checking}>
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {checking ? '检查中…' : '检查更新'}
          </GlassButton>
        </div>
        {checkResult?.hasUpdate && (
          <div className="space-y-2 rounded-2xl bg-amber-500/10 p-3">
            <p className="text-xs font-medium">{checkResult.latest.name || checkResult.latest.tag}</p>
            {checkResult.latest.notes && (
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-fg/70">
{checkResult.latest.notes}
              </pre>
            )}
            <div className="flex flex-wrap gap-2">
              {checkResult.latest.apkUrl && !isNativeApp() && (
                <a href={checkResult.latest.apkUrl} rel="noopener noreferrer" className="no-underline">
                  <GlassButton size="sm" variant="primary">
                    <Download size={12} /> 下载 APK
                  </GlassButton>
                </a>
              )}
              <a
                href={checkResult.latest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <GlassButton size="sm" variant="ghost">
                  <Github size={12} /> 查看发布说明
                </GlassButton>
              </a>
            </div>
          </div>
        )}
      </GlassCard>

      {/* 关于 */}
      <GlassCard rounded="3xl" className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-fg/60" />
          <h2 className="text-sm font-semibold">关于 LightGlass</h2>
        </div>
        <p className="text-xs leading-relaxed text-fg/70">
          <strong>LightGlass · 轻玻璃</strong> 是一款以 iOS 26 「液态玻璃」美学打造的极简生活应用，
          集随手记、二十四节气、光锥时钟、番茄时钟、全局墙纸与内置 AI 助手（DeepSeek）于一身。
          单一代码库同时支持 Web、PWA 与 Android。
        </p>
        <ul className="space-y-1 text-[11px] text-fg/60">
          <li>· 免费、开源（MIT）</li>
          <li>· 所有数据默认保存在你本机；登录后可选云同步</li>
          <li>· 不收集任何个人信息，AI API Key 仅在本地存储</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={LATEST_RELEASE_PAGE.replace('/releases', '')}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <GlassButton size="sm" variant="ghost">
              <Github size={14} /> 源码
            </GlassButton>
          </a>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] text-rose-500">
            <Heart size={11} /> Made with care
          </span>
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
