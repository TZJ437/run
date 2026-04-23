import { useEffect, useMemo, useState } from 'react'
import { Bell, BellOff, ChevronLeft, ChevronRight } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import { useAuth } from '@/contexts/AuthContext'
import { loadData, saveData } from '@/lib/storage'
import {
  getYearSolarTerms,
  getCurrentSolarTerm,
  getNextSolarTerm,
  formatDateCN,
  daysUntil,
} from '@/lib/solarTerms'

const SEASON_COLORS = [
  'from-pink-300 to-rose-300',   // 春
  'from-emerald-300 to-teal-300', // 夏
  'from-amber-300 to-orange-300', // 秋
  'from-sky-300 to-indigo-300',   // 冬
]

function seasonOf(termIndex: number): number {
  // 0-5: 春前, 6-11: 春夏, 12-17: 夏秋, 18-23: 秋冬
  if (termIndex >= 2 && termIndex <= 7) return 0 // 立春 - 谷雨
  if (termIndex >= 8 && termIndex <= 13) return 1 // 立夏 - 大暑
  if (termIndex >= 14 && termIndex <= 19) return 2 // 立秋 - 霜降
  return 3 // 立冬 - 大寒
}

const KEY = 'solarReminders'

export default function SolarTermsPage() {
  const { user } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [reminders, setReminders] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData<Record<string, boolean>>(user?.id ?? null, KEY, {}).then(setReminders)
  }, [user?.id])

  const persist = (next: Record<string, boolean>) => {
    setReminders(next)
    saveData(user?.id ?? null, KEY, next).catch(console.error)
  }

  const toggleReminder = async (name: string) => {
    const nextVal = !reminders[name]
    if (nextVal && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    persist({ ...reminders, [name]: nextVal })
  }

  const terms = useMemo(() => getYearSolarTerms(year), [year])
  const current = useMemo(() => getCurrentSolarTerm(), [])
  const next = useMemo(() => getNextSolarTerm(), [])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">二十四节气</h1>
          <p className="text-sm text-fg/60">古人留给时间的坐标</p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" size="sm" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft size={14} />
          </GlassButton>
          <span className="min-w-[4ch] text-center font-mono text-sm">{year}</span>
          <GlassButton variant="ghost" size="sm" onClick={() => setYear(y => y + 1)}>
            <ChevronRight size={14} />
          </GlassButton>
        </div>
      </div>

      {/* 当前 + 下一个 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GlassCard rounded="2xl" className="p-5">
          <p className="text-xs text-fg/50">当前节气</p>
          <p className="mt-1 text-2xl font-semibold">{current.name}</p>
          <p className="text-xs text-fg/60">{formatDateCN(current.date)}</p>
        </GlassCard>
        <GlassCard rounded="2xl" className="p-5">
          <p className="text-xs text-fg/50">下一个节气</p>
          <p className="mt-1 text-2xl font-semibold">{next.name}</p>
          <p className="text-xs text-fg/60">
            {formatDateCN(next.date)} · 还有 {daysUntil(next.date)} 天
          </p>
        </GlassCard>
      </div>

      {/* 节气网格 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {terms.map(t => {
          const isPast = t.date.getTime() < Date.now() - 86400000
          const isToday = daysUntil(t.date) === 0
          const on = !!reminders[t.name]
          const seasonColor = SEASON_COLORS[seasonOf(t.index)]
          return (
            <GlassCard
              key={t.name}
              rounded="2xl"
              className={`relative p-4 ${isPast ? 'opacity-50' : ''}`}
            >
              <div className={`mb-3 h-1.5 w-10 rounded-full bg-gradient-to-r ${seasonColor}`} />
              <p className="text-lg font-semibold">{t.name}</p>
              <p className="mt-0.5 text-xs text-fg/60">
                {t.date.getMonth() + 1}月{t.date.getDate()}日
              </p>
              {isToday && (
                <span className="mt-2 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                  今日
                </span>
              )}
              <button
                onClick={() => toggleReminder(t.name)}
                aria-label={on ? '关闭提醒' : '开启提醒'}
                className={`absolute right-2 top-2 rounded-full p-1.5 transition-colors ${
                  on ? 'bg-accent/20 text-accent' : 'text-fg/40 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                {on ? <Bell size={14} /> : <BellOff size={14} />}
              </button>
            </GlassCard>
          )
        })}
      </div>

      <p className="text-center text-xs text-fg/40">
        * 节气日期基于太阳黄经近似计算，误差不超过 1 日
      </p>
    </div>
  )
}
