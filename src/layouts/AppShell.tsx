import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  StickyNote,
  CalendarDays,
  Clock,
  Timer,
  LogOut,
  Image as ImageIcon,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import Avatar from '@/components/Avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'

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
  const { displayName } = useProfile()
  const nav = useNavigate()
  const location = useLocation()

  const indicatorBoxRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const activeIndex = navItems.findIndex((it) => it.match(location.pathname))
  // 设置页视为"子页面"：隐藏底部导航，改为返回按钮由页面自己渲染
  const isSettings = location.pathname === '/settings'

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex]
    const wrap = indicatorBoxRef.current
    if (!el || !wrap) return
    const er = el.getBoundingClientRect()
    const wr = wrap.getBoundingClientRect()
    setIndicator({ left: er.left - wr.left, width: er.width, ready: true })
  }, [activeIndex, location.pathname])

  useEffect(() => {
    const onResize = () => {
      const el = itemRefs.current[activeIndex]
      const wrap = indicatorBoxRef.current
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
    <div className="relative flex min-h-screen flex-col">
      {/* 动态极光背景 */}
      <div className="bg-aurora pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="blob blob-3" />
      </div>

      {/* 顶部栏（设置页也保留，方便看头像） */}
      <header
        className="sticky top-0 z-30 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-3 py-2">
          <button
            onClick={() => nav('/settings')}
            className="btn-press flex min-w-0 items-center gap-2.5 rounded-full pr-2"
            aria-label="打开设置"
          >
            <Avatar size={36} />
            <span className="truncate text-sm font-semibold tracking-wide">{displayName}</span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {!isSettings && (
              <button
                onClick={() => nav('/settings')}
                className="btn-press liquid-glass-subtle flex h-10 w-10 items-center justify-center rounded-full"
                aria-label="设置"
                title="设置"
              >
                <SettingsIcon size={16} />
              </button>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="btn-press liquid-glass-subtle flex h-10 w-10 items-center justify-center rounded-full"
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区：非设置页给底部导航预留空间 */}
      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:p-4 ${
          isSettings ? '' : 'pb-28 md:pb-24'
        }`}
      >
        <Outlet />
      </main>

      {/* 底部玻璃导航：设置页隐藏 */}
      {!isSettings && (
        <div
          className="liquid-glass fixed left-1/2 z-30 w-fit -translate-x-1/2 rounded-full p-1.5"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <div ref={indicatorBoxRef} className="relative flex items-center gap-0.5 whitespace-nowrap">
            {/* 活动指示器：极低不透明度 + 边框，让玻璃折射透出 */}
            <span
              aria-hidden
              className={`nav-indicator absolute top-0 bottom-0 rounded-full ${
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
                  ref={(el) => {
                    itemRefs.current[i] = el
                  }}
                  className={({ isActive }) =>
                    `btn-press relative z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-300 sm:px-4 ${
                      isActive ? 'text-fg font-semibold' : 'text-fg/60 hover:text-fg'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
