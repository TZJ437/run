import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import { useAuth } from '@/contexts/AuthContext'
import { loadData, saveData } from '@/lib/storage'

type Phase = 'focus' | 'break'

interface Stats {
  completedFocus: number
  totalFocusMinutes: number
  lastDate: string
}

const FOCUS_MINUTES = 25
const BREAK_MINUTES = 5
const KEY = 'pomodoroStats'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export default function PomodoroPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('focus')
  const [remaining, setRemaining] = useState(FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState<Stats>({ completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() })
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    loadData<Stats>(user?.id ?? null, KEY, { completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() })
      .then(s => {
        // 跨天重置今日统计
        if (s.lastDate !== todayKey()) {
          s = { completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() }
        }
        setStats(s)
      })
  }, [user?.id])

  const persistStats = (s: Stats) => {
    setStats(s)
    saveData(user?.id ?? null, KEY, s).catch(console.error)
  }

  // 计时主循环
  useEffect(() => {
    if (!running) {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null }
      return
    }
    tickRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          // 一轮结束
          if (phase === 'focus') {
            const next: Stats = {
              completedFocus: stats.completedFocus + 1,
              totalFocusMinutes: stats.totalFocusMinutes + FOCUS_MINUTES,
              lastDate: todayKey(),
            }
            persistStats(next)
            notify('番茄钟', '专注结束，去喝口水吧 ☕')
            setPhase('break')
            setRunning(false)
            return BREAK_MINUTES * 60
          } else {
            notify('番茄钟', '休息完毕，开始下一个专注 🍅')
            setPhase('focus')
            setRunning(false)
            return FOCUS_MINUTES * 60
          }
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null }
    }
     
  }, [running, phase, stats])

  const total = phase === 'focus' ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60
  const progress = 1 - remaining / total
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  const circumference = 2 * Math.PI * 120
  const offset = useMemo(() => circumference * (1 - progress), [circumference, progress])

  const toggle = () => {
    if (!running && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setRunning(r => !r)
  }
  const reset = () => {
    setRunning(false)
    setRemaining(phase === 'focus' ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60)
  }
  const switchPhase = (p: Phase) => {
    setRunning(false)
    setPhase(p)
    setRemaining(p === 'focus' ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60)
  }

  const ringColor = phase === 'focus' ? 'stroke-rose-400' : 'stroke-emerald-400'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">番茄时钟</h1>
        <p className="text-sm text-fg/60">25 分钟专注 · 5 分钟休息</p>
      </div>

      {/* 阶段切换 */}
      <div className="liquid-glass-subtle mx-auto flex w-max gap-1 rounded-full p-1">
        {(['focus', 'break'] as const).map(p => (
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
            <span className="font-mono text-6xl font-light tabular-nums">{mm}:{ss}</span>
            <span className="mt-2 text-xs text-fg/60">{phase === 'focus' ? '保持专注' : '放松一下'}</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <GlassButton variant="primary" size="lg" onClick={toggle}>
            {running ? <><Pause size={16}/> 暂停</> : <><Play size={16}/> 开始</>}
          </GlassButton>
          <GlassButton variant="default" size="lg" onClick={reset}>
            <RotateCcw size={16}/> 重置
          </GlassButton>
        </div>
      </GlassCard>

      {/* 今日统计 */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard rounded="2xl" className="p-4 text-center">
          <p className="text-xs text-fg/60">今日完成</p>
          <p className="mt-1 text-3xl font-semibold">{stats.completedFocus} <span className="text-sm font-normal text-fg/50">个</span></p>
        </GlassCard>
        <GlassCard rounded="2xl" className="p-4 text-center">
          <p className="text-xs text-fg/60">专注时长</p>
          <p className="mt-1 text-3xl font-semibold">{stats.totalFocusMinutes} <span className="text-sm font-normal text-fg/50">分钟</span></p>
        </GlassCard>
      </div>
    </div>
  )
}

function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
    // 蜂鸣反馈（浏览器默认频率可能不支持；使用 AudioContext 生成简单提示音）
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch { /* noop */ }
}
