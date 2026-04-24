import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, signIn, signUp, supabaseEnabled } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'signin') {
      const { error: err } = await signIn(email, password)
      setLoading(false)
      if (err) { setError(err); return }
      nav('/', { replace: true })
    } else {
      const { error: err, needsEmailConfirm } = await signUp(email, password)
      setLoading(false)
      if (err) { setError(err); return }
      if (needsEmailConfirm) {
        setError('注册成功，请查收邮箱验证链接后再登录')
        setMode('signin')
        return
      }
      nav('/', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <button
        onClick={() => nav('/')}
        className="btn-press liquid-glass-subtle absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full"
        aria-label="返回"
        title="返回"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <GlassCard rounded="3xl" className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'signin' ? '登录' : '注册'}
          </h1>
          <p className="mt-1 text-sm text-fg/60">
            {mode === 'signin' ? '欢迎回来' : '开启你的空间'}
          </p>
        </div>

        {!supabaseEnabled && (
          <div className="mb-4 rounded-xl bg-amber-100/60 p-3 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            当前处于 <strong>本地模式</strong>：未配置 Supabase，
            <strong>任意邮箱 + 6 位密码均可进入</strong>，数据仅保存在本设备。
            生产部署请在环境变量中配置 Supabase。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/50" size={16} />
            <input
              type="email"
              required
              autoComplete="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="liquid-glass-subtle w-full rounded-full py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/60"
            />
          </label>
          <label className="relative block">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg/50" size={16} />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 位密码"
              className="liquid-glass-subtle w-full rounded-full py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/60"
            />
          </label>

          {error && <p className="text-center text-xs text-rose-500">{error}</p>}

          <GlassButton type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
            {loading ? '处理中…' : mode === 'signin' ? '登 录' : '注 册'}
          </GlassButton>
        </form>

        <p className="mt-5 text-center text-xs text-fg/60">
          {mode === 'signin' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
            className="ml-1 font-medium text-accent hover:underline"
          >
            {mode === 'signin' ? '立即注册' : '去登录'}
          </button>
        </p>
      </GlassCard>
    </div>
  )
}
