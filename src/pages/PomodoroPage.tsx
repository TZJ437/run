import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2, Bell, BellOff } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import { useAuth } from '@/contexts/AuthContext'
import { loadData, saveData } from '@/lib/storage'
import { hapticPulse, notify, requestNotifyPermission } from '@/lib/device'

type Phase = 'focus' | 'break'

interface Stats {
  completedFocus: number
  totalFocusMinutes: number
  lastDate: string
}

interface Settings {
  focusMin: number
  breakMin: number
}

const STATS_KEY = 'pomodoroStats'
const SETTINGS_KEY = 'pomodoroSettings'
const DEFAULT_SETTINGS: Settings = { focusMin: 25, breakMin: 5 }

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

export default function PomodoroPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [phase, setPhase] = useState<Phase>('focus')
  const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.focusMin * 60)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState<Stats>({ completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() })
  const [showSettings, setShowSettings] = useState(false)
  const [notifyOn, setNotifyOn] = useState(false)
  const tickRef = useRef<number | null>(null)

  // 读取设置和统计
  useEffect(() => {
    loadData<Settings>(user?.id ?? null, SETTINGS_KEY, DEFAULT_SETTINGS).then((s) => {
      const safe: Settings = {
        focusMin: clamp(s.focusMin || 25, 1, 180),
        breakMin: clamp(s.breakMin || 5, 1, 60),
      }
      setSettings(safe)
      // 初始化剩余时间（仅在未启动时）
      setRemaining((r) => (running ? r : safe.focusMin * 60))
    })
    loadData<Stats>(user?.id ?? null, STATS_KEY, { completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() })
      .then((s) => {
        if (s.lastDate !== todayKey()) s = { completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() }
        setStats(s)
      })
    // 仅运行一次（依赖 user?.id 切账号时重读）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // 计时循环
  useEffect(() => {
    if (!running) {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null }
      return
    }
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1
        // 一轮结束
        if (phase === 'focus') {
          const next: Stats = {
            completedFocus: stats.completedFocus + 1,
            totalFocusMinutes: stats.totalFocusMinutes + settings.focusMin,
            lastDate: todayKey(),
          }
          setStats(next)
          saveData(user?.id ?? null, STATS_KEY, next).catch(console.error)
          void hapticPulse()
          void notify('番茄钟', `专注 ${settings.focusMin} 分钟完成，休息一下 ☕`)
          setPhase('break')
          setRunning(false)
          return settings.breakMin * 60
        }
        void hapticPulse()
        void notify('番茄钟', `休息结束，开始下一个 ${settings.focusMin} 分钟专注 🍅`)
        setPhase('focus')
        setRunning(false)
        return settings.focusMin * 60
      })
    }, 1000)
    return () => {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null }
    }
    // 依赖 running/phase/settings，stats 用闭包值足矣
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, settings.focusMin, settings.breakMin])

  const total = phase === 'focus' ? settings.focusMin * 60 : settings.breakMin * 60
  const progress = total > 0 ? 1 - remaining / total : 0
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  const circumference = 2 * Math.PI * 120
  const offset = useMemo(() => circumference * (1 - progress), [circumference, progress])

  const toggle = async () => {
    if (!running) {
      const ok = await requestNotifyPermission()
      setNotifyOn(ok)
    }
    setRunning((r) => !r)
  }

  const reset = () => {
    setRunning(false)
    setRemaining(phase === 'focus' ? settings.focusMin * 60 : settings.breakMin * 60)
  }

  const switchPhase = (p: Phase) => {
    if (p === phase) return
    if (running) {
      const ok = window.confirm(
        `正在${phase === 'focus' ? '专注' : '休息'}中，切换到${p === 'focus' ? '专注' : '休息'}会放弃当前计时，确定吗？`,
      )
      if (!ok) return
    }
    setRunning(false)
    setPhase(p)
    setRemaining(p === 'focus' ? settings.focusMin * 60 : settings.breakMin * 60)
  }

  const saveSettings = (next: Settings) => {
    const safe: Settings = {
      focusMin: clamp(Math.round(next.focusMin), 1, 180),
      breakMin: clamp(Math.round(next.breakMin), 1, 60),
    }
    setSettings(safe)
    saveData(user?.id ?? null, SETTINGS_KEY, safe).catch(console.error)
    if (!running) {
      setRemaining(phase === 'focus' ? safe.focusMin * 60 : safe.breakMin * 60)
    }
  }

  const ringColor = phase === 'focus' ? 'stroke-rose-400' : 'stroke-emerald-400'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">番茄时钟</h1>
          <p className="text-sm text-fg/60">
            {settings.focusMin} 分钟专注 · {settings.breakMin} 分钟休息
          </p>
        </div>
        <div className="flex gap-2">
          <GlassButton
            variant="ghost"
            onClick={async () => {
              const ok = await requestNotifyPermission()
              setNotifyOn(ok)
              if (!ok) alert('未获得通知权限，请在系统设置里开启')
            }}
            aria-label="通知权限"
            title={notifyOn ? '通知已开启' : '启用通知'}
          >
            {notifyOn ? <Bell size={16} /> : <BellOff size={16} />}
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setShowSettings((s) => !s)}
            aria-label="设置"
            title="设置时长"
          >
            <Settings2 size={16} />
          </GlassButton>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <GlassCard rounded="2xl" className="space-y-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-fg/60">专注时长（分钟）</label>
            <input
              type="number"
              min={1}
              max={180}
              value={settings.focusMin}
              onChange={(e) => saveSettings({ ...settings, focusMin: Number(e.target.value) })}
              className="liquid-glass-subtle rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-fg/60">休息时长（分钟）</label>
            <input
              type="number"
              min={1}
              max={60}
              value={settings.breakMin}
              onChange={(e) => saveSettings({ ...settings, breakMin: Number(e.target.value) })}
              className="liquid-glass-subtle rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { f: 15, b: 3, label: '短番茄 15/3' },
              { f: 25, b: 5, label: '标准 25/5' },
              { f: 45, b: 10, label: '长番茄 45/10' },
              { f: 90, b: 20, label: '深度 90/20' },
            ].map((preset) => (
              <GlassButton
                key={preset.label}
                size="sm"
                onClick={() => saveSettings({ focusMin: preset.f, breakMin: preset.b })}
              >
                {preset.label}
              </GlassButton>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 阶段切换 */}
      <div className="liquid-glass-subtle mx-auto flex w-max gap-1 rounded-full p-1">
        {(['focus', 'break'] as const).map((p) => (
          <button
            key={p}
            onClick={() => switchPhase(p)}
            className={`btn-press flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
              phase === p ? 'bg-accent/90 text-white' : 'text-fg/70'
            }`}
          >
            {p === 'focus' ? <Brain size={14} /> : <Coffee size={14} />}
            {p === 'focus' ? '专注' : '休息'}
          </button>
        ))}
      </div>

      {/* 主计时器 */}
      <GlassCard rounded="3xl" className="p-8">
        <div className="relative mx-auto aspect-square w-full max-w-xs">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" className="fill-none stroke-fg/10" strokeWidth="6" />
            <circle
              cx="130"
              cy="130"
              r="120"
              className={`fill-none ${ringColor} transition-[stroke-dashoffset] duration-500`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-6xl font-light tabular-nums">
              {mm}:{ss}
            </span>
            <span className="mt-2 text-xs text-fg/60">
              {phase === 'focus' ? '保持专注' : '放松一下'}
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <GlassButton variant="primary" size="lg" onClick={toggle}>
            {running ? (
              <>
                <Pause size={16} /> 暂停
              </>
            ) : (
              <>
                <Play size={16} /> 开始
              </>
            )}
          </GlassButton>
          <GlassButton variant="default" size="lg" onClick={reset}>
            <RotateCcw size={16} /> 重置
          </GlassButton>
        </div>
      </GlassCard>

      {/* 今日统计 */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard rounded="2xl" className="p-4 text-center">
          <p className="text-xs text-fg/60">今日完成</p>
          <p className="mt-1 text-3xl font-semibold">
            {stats.completedFocus} <span className="text-sm font-normal text-fg/50">个</span>
          </p>
        </GlassCard>
        <GlassCard rounded="2xl" className="p-4 text-center">
          <p className="text-xs text-fg/60">专注时长</p>
          <p className="mt-1 text-3xl font-semibold">
            {stats.totalFocusMinutes} <span className="text-sm font-normal text-fg/50">分钟</span>
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
