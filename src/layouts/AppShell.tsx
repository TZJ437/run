import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, StickyNote, CalendarDays, Clock, Timer, LogOut, Image as ImageIcon, Palette } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import SettingsPanel from '@/components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/', label: '首页', icon: Home, end: true, match: (p: string) => p === '/' },
  { to: '/notes', label: '随手记', icon: StickyNote, match: (p: string) => p.startsWith('/notes') },
  { to: '/solar-terms', label: '节气', icon: CalendarDays, match: (p: string) => p.startsWith('/solar-terms') },
  { to: '/clock', label: '时钟', icon: Clock, match: (p: string) => p.startsWith('/clock') },
  { to: '/pomodoro', label: '番茄钟', icon: Timer, match: (p: string) => p.startsWith('/pomodoro') },
  { to: '/wallpaper', label: '墙纸', icon: ImageIcon, match: (p: string) => p.startsWith('/wallpaper') },
]

export default function AppShell() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const location = useLocation()

  // 滑动 pill 指示器：监听当前激活项位置
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const [showSettings, setShowSettings] = useState(false)

  const activeIndex = navItems.findIndex(it => it.match(location.pathname))

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex]
    const wrap = containerRef.current
    if (!el || !wrap) return
    const er = el.getBoundingClientRect()
    const wr = wrap.getBoundingClientRect()
    setIndicator({ left: er.left - wr.left, width: er.width, ready: true })
  }, [activeIndex, location.pathname])

  useEffect(() => {
    const onResize = () => {
      const el = itemRefs.current[activeIndex]
      const wrap = containerRef.current
      if (!el || !wrap) return
      const er = el.getBoundingClientRect()
      const wr = wrap.getBoundingClientRect()
      setIndicator({ left: er.left - wr.left, width: er.width, ready: true })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex])

  const handleSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* 顶部栏 */}
      <header
        className="sticky top-0 z-30 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 shadow-md" />
            <span className="text-sm font-semibold tracking-wide">LightGlass</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-fg/60 sm:inline">
              {user?.email ?? user?.user_metadata?.name ?? '访客'}
            </span>
            <ThemeToggle />
            <button
              onClick={() => setShowSettings(true)}
              className="btn-press liquid-glass-subtle flex h-10 w-10 items-center justify-center rounded-full"
              aria-label="配色设置"
              title="配色设置"
            >
              <Palette size={16} />
            </button>
            <button
              onClick={handleSignOut}
              className="btn-press liquid-glass-subtle flex h-10 w-10 items-center justify-center rounded-full"
              aria-label="退出登录"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 pb-28 sm:p-4 md:pb-24">
        <Outlet />
      </main>

      {/* 底部 Dock 导航：滑动 pill 指示器 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mb-4 flex justify-center px-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          ref={containerRef}
          className="liquid-glass relative flex items-center gap-0.5 rounded-full p-1.5 shadow-2xl"
        >
          {/* 滑动指示器 */}
          <span
            aria-hidden
            className={`absolute top-1.5 bottom-1.5 rounded-full bg-accent/90 shadow-md shadow-accent/30 ${
              indicator.ready ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              left: indicator.left,
              width: indicator.width,
              transition: indicator.ready
                ? 'left 400ms cubic-bezier(0.34, 1.56, 0.64, 1), width 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease'
                : 'none',
            }}
          />
          {navItems.map((item, i) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                ref={el => { itemRefs.current[i] = el }}
                className={({ isActive }) =>
                  `btn-press relative z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-300 sm:px-4 ${
                    isActive ? 'text-white' : 'text-fg/70 hover:text-fg'
                  }`
                }
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
