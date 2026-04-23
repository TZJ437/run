import { Link } from 'react-router-dom'
import { StickyNote, CalendarDays, Clock, Timer, ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import GlassCard from '@/components/GlassCard'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentSolarTerm, getNextSolarTerm, daysUntil, formatDateCN } from '@/lib/solarTerms'

const features = [
  { to: '/notes', title: '随手记', desc: '一挥手，留下此刻', icon: StickyNote, color: 'from-amber-300 to-rose-300' },
  { to: '/solar-terms', title: '节气日历', desc: '顺应时序的提醒', icon: CalendarDays, color: 'from-emerald-300 to-teal-300' },
  { to: '/clock', title: '时钟', desc: '滴答声里的此刻', icon: Clock, color: 'from-sky-300 to-indigo-300' },
  { to: '/pomodoro', title: '番茄钟', desc: '25 分钟的专注仪式', icon: Timer, color: 'from-fuchsia-300 to-pink-300' },
] as const

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export default function HomePage() {
  const { user } = useAuth()
  const now = useNow(1000)
  const greeting = useMemo(() => {
    const h = now.getHours()
    if (h < 6) return '夜深了'
    if (h < 11) return '早安'
    if (h < 14) return '午安'
    if (h < 18) return '下午好'
    return '晚上好'
  }, [now])

  const current = useMemo(() => getCurrentSolarTerm(now), [now])
  const next = useMemo(() => getNextSolarTerm(now), [now])
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const name = user?.user_metadata?.name ?? (user?.email?.split('@')[0] ?? '朋友')

  return (
    <div className="space-y-6">
      {/* 问候 + 大时钟 */}
      <GlassCard rounded="3xl" className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
          <div>
            <p className="text-xs text-fg/60 sm:text-sm">{greeting}，{name}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl md:text-5xl">
              {formatDateCN(now)}
            </h1>
            <p className="mt-1 text-xs text-fg/60 sm:text-sm">今日节气 · <span className="font-medium text-fg">{current.name}</span></p>
          </div>
          <div className="font-mono text-4xl font-light tabular-nums tracking-tighter sm:text-5xl md:text-7xl">
            {timeStr}
          </div>
        </div>
      </GlassCard>

      {/* 下一个节气卡片 */}
      <GlassCard rounded="2xl" className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs text-fg/50">下一个节气</p>
          <p className="mt-1 text-lg font-semibold sm:text-xl">{next.name}</p>
          <p className="truncate text-xs text-fg/60">{formatDateCN(next.date)} · 还有 {daysUntil(next.date, now)} 天</p>
        </div>
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-400 opacity-80 sm:h-14 sm:w-14" />
      </GlassCard>

      {/* 功能网格 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(f => (
          <Link key={f.to} to={f.to} className="block">
            <GlassCard rounded="2xl" interactive className="h-full p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${f.color} shadow-md sm:h-12 sm:w-12`}>
                  <f.icon className="text-white" size={20} />
                </div>
                <ArrowUpRight className="text-fg/40" size={16} />
              </div>
              <h3 className="mt-3 text-base font-semibold sm:mt-4 sm:text-lg">{f.title}</h3>
              <p className="text-xs text-fg/60 sm:text-sm">{f.desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
