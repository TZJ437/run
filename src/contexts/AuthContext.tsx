import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  supabaseEnabled: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirm?: boolean }>
  signInWithGithub: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LOCAL_USER_KEY = 'lightglass:localUser'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      // 本地模式：从 localStorage 恢复伪用户
      const local = localStorage.getItem(LOCAL_USER_KEY)
      if (local) {
        try { setUser(JSON.parse(local)) } catch { /* noop */ }
      }
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseEnabled || !supabase) {
      const fake = { id: `local-${email}`, email, user_metadata: { name: email.split('@')[0] } } as unknown as User
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fake))
      setUser(fake)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseEnabled || !supabase) {
      return signIn(email, password)
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    // 若项目关闭了邮箱验证，signUp 不会自动返回 session
    // 尝试立即登录；失败则说明仍需邮箱验证
    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        return { error: null, needsEmailConfirm: true } as { error: string | null; needsEmailConfirm?: boolean }
      }
    }
    return { error: null }
  }, [signIn])

  const signInWithGithub = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      return { error: '需要配置 Supabase 才能使用 GitHub 登录' }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      localStorage.removeItem(LOCAL_USER_KEY)
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, session, loading, supabaseEnabled: isSupabaseEnabled, signIn, signUp, signInWithGithub, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
