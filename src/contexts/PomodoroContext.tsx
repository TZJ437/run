import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { loadData, saveData } from '@/lib/storage'
import {
  hapticPulse,
  scheduleNotification,
  cancelNotifications,
  requestNotifyPermission,
} from '@/lib/device'

export type Phase = 'focus' | 'break'

export interface PomodoroSettings {
  focusMin: number
  breakMin: number
}

export interface PomodoroStats {
  completedFocus: number
  totalFocusMinutes: number
  lastDate: string
}

interface PersistState {
  phase: Phase
  running: boolean
  endAt: number | null // 运行中：计时结束时间戳
  pausedRemaining: number | null // 暂停/未启动：剩余秒
}

interface Ctx {
  settings: PomodoroSettings
  stats: PomodoroStats
  phase: Phase
  running: boolean
  remaining: number
  total: number
  progress: number
  notifyOn: boolean
  start: () => Promise<void>
  pause: () => void
  reset: () => void
  switchPhase: (p: Phase, force?: boolean) => boolean
  saveSettings: (s: PomodoroSettings) => void
  enableNotifications: () => Promise<boolean>
}

const PomodoroContext = createContext<Ctx | null>(null)

const SETTINGS_KEY = 'pomodoroSettings'
const STATS_KEY = 'pomodoroStats'
const STATE_KEY = 'lightglass:pomodoroState'
const NOTIF_ID_END = 9901
const NOTIF_ID_ONGOING = 9902
const DEFAULT_SETTINGS: PomodoroSettings = { focusMin: 25, breakMin: 5 }

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function loadPersist(): PersistState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistState
  } catch {
    return null
  }
}

function savePersist(s: PersistState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [stats, setStats] = useState<PomodoroStats>({
    completedFocus: 0,
    totalFocusMinutes: 0,
    lastDate: todayKey(),
  })
  const [phase, setPhase] = useState<Phase>('focus')
  const [running, setRunning] = useState(false)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null)
  const [tick, setTick] = useState(0) // 驱动重渲染
  const [notifyOn, setNotifyOn] = useState(false)
  const settingsRef = useRef(settings)
  const statsRef = useRef(stats)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])
  useEffect(() => {
    statsRef.current = stats
  }, [stats])

  // 读取持久化状态
  useEffect(() => {
    const persisted = loadPersist()
    if (persisted) {
      setPhase(persisted.phase)
      setRunning(persisted.running)
      setEndAt(persisted.endAt)
      setPausedRemaining(persisted.pausedRemaining)
    }
  }, [])

  // 读取用户配置
  useEffect(() => {
    loadData<PomodoroSettings>(user?.id ?? null, SETTINGS_KEY, DEFAULT_SETTINGS).then((s) => {
      const safe: PomodoroSettings = {
        focusMin: clamp(s.focusMin || 25, 1, 180),
        breakMin: clamp(s.breakMin || 5, 1, 60),
      }
      setSettings(safe)
      // 仅当未运行且没有暂停状态时，初始化 pausedRemaining 到新设置
      setPausedRemaining((prev) => {
        if (prev !== null) return prev
        return safe.focusMin * 60
      })
    })
    loadData<PomodoroStats>(user?.id ?? null, STATS_KEY, {
      completedFocus: 0,
      totalFocusMinutes: 0,
      lastDate: todayKey(),
    }).then((s) => {
      if (s.lastDate !== todayKey()) {
        s = { completedFocus: 0, totalFocusMinutes: 0, lastDate: todayKey() }
      }
      setStats(s)
    })
  }, [user?.id])

  // tick 每秒驱动，运行中从 endAt 推算 remaining
  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(t)
  }, [running])

  // 持久化
  useEffect(() => {
    savePersist({ phase, running, endAt, pausedRemaining })
  }, [phase, running, endAt, pausedRemaining])

  // 计算剩余秒数
  const remaining = (() => {
    if (running && endAt !== null) {
      return Math.max(0, Math.round((endAt - Date.now()) / 1000))
    }
    if (pausedRemaining !== null) return pausedRemaining
    return settings.focusMin * 60
  })()

  const total = phase === 'focus' ? settings.focusMin * 60 : settings.breakMin * 60
  const progress = total > 0 ? 1 - remaining / total : 0

  // 计时结束处理（tick 驱动后判断）
  useEffect(() => {
    if (!running || endAt === null) return
    if (Date.now() < endAt) return
    // 结束
    const wasFocus = phase === 'focus'
    if (wasFocus) {
      const next: PomodoroStats = {
        completedFocus: statsRef.current.completedFocus + 1,
        totalFocusMinutes: statsRef.current.totalFocusMinutes + settingsRef.current.focusMin,
        lastDate: todayKey(),
      }
      setStats(next)
      saveData(user?.id ?? null, STATS_KEY, next).catch(console.error)
    }
    void hapticPulse()
    // 定时通知已由 schedule 自动发出，这里只清 ongoing
    void cancelNotifications([NOTIF_ID_ONGOING])
    setRunning(false)
    setEndAt(null)
    const nextPhase: Phase = wasFocus ? 'break' : 'focus'
    setPhase(nextPhase)
    setPausedRemaining(
      nextPhase === 'focus'
        ? settingsRef.current.focusMin * 60
        : settingsRef.current.breakMin * 60,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, running, endAt, phase])

  const enableNotifications = useCallback(async () => {
    const ok = await requestNotifyPermission()
    setNotifyOn(ok)
    return ok
  }, [])

  const start = useCallback(async () => {
    // 立刻切换到运行态（不等通知权限，避免点击无响应）
    const totalSec =
      pausedRemaining !== null
        ? pausedRemaining
        : phase === 'focus'
          ? settings.focusMin * 60
          : settings.breakMin * 60
    if (totalSec <= 0) return
    const end = Date.now() + totalSec * 1000
    setEndAt(end)
    setPausedRemaining(null)
    setRunning(true)

    // 权限和通知异步调度，不阻塞 UI
    void (async () => {
      try {
        const ok = await requestNotifyPermission()
        setNotifyOn(ok)
        if (!ok) return
        const title = phase === 'focus' ? '番茄钟 · 专注' : '番茄钟 · 休息'
        const endTime = new Date(end)
        const hh = String(endTime.getHours()).padStart(2, '0')
        const mm = String(endTime.getMinutes()).padStart(2, '0')
        await scheduleNotification({
          id: NOTIF_ID_ONGOING,
          title,
          body: `${phase === 'focus' ? '专注中' : '休息中'}，预计 ${hh}:${mm} 结束`,
          ongoing: true,
        })
        await scheduleNotification({
          id: NOTIF_ID_END,
          title: phase === 'focus' ? '专注结束' : '休息结束',
          body:
            phase === 'focus'
              ? `完成 ${settings.focusMin} 分钟专注，去喝口水吧 ☕`
              : `休息结束，开始下一个 ${settings.focusMin} 分钟专注 🍅`,
          at: endTime,
        })
      } catch (e) {
        console.error('pomodoro notification failed', e)
      }
    })()
  }, [pausedRemaining, phase, settings.focusMin, settings.breakMin])

  const pause = useCallback(() => {
    if (!running || endAt === null) return
    const rem = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    setPausedRemaining(rem)
    setEndAt(null)
    setRunning(false)
    void cancelNotifications([NOTIF_ID_END, NOTIF_ID_ONGOING])
  }, [running, endAt])

  const reset = useCallback(() => {
    setRunning(false)
    setEndAt(null)
    setPausedRemaining(
      phase === 'focus' ? settings.focusMin * 60 : settings.breakMin * 60,
    )
    void cancelNotifications([NOTIF_ID_END, NOTIF_ID_ONGOING])
  }, [phase, settings.focusMin, settings.breakMin])

  const switchPhase = useCallback(
    (p: Phase, force = false) => {
      if (p === phase) return true
      if (running && !force) {
        const ok = window.confirm(
          `正在${phase === 'focus' ? '专注' : '休息'}中，切换到${p === 'focus' ? '专注' : '休息'}会放弃当前计时，确定吗？`,
        )
        if (!ok) return false
      }
      setRunning(false)
      setEndAt(null)
      setPhase(p)
      setPausedRemaining(p === 'focus' ? settings.focusMin * 60 : settings.breakMin * 60)
      void cancelNotifications([NOTIF_ID_END, NOTIF_ID_ONGOING])
      return true
    },
    [phase, running, settings.focusMin, settings.breakMin],
  )

  const saveSettings = useCallback(
    (next: PomodoroSettings) => {
      const safe: PomodoroSettings = {
        focusMin: clamp(Math.round(next.focusMin), 1, 180),
        breakMin: clamp(Math.round(next.breakMin), 1, 60),
      }
      setSettings(safe)
      saveData(user?.id ?? null, SETTINGS_KEY, safe).catch(console.error)
      if (!running) {
        setPausedRemaining(phase === 'focus' ? safe.focusMin * 60 : safe.breakMin * 60)
      }
    },
    [user?.id, running, phase],
  )

  const value: Ctx = {
    settings,
    stats,
    phase,
    running,
    remaining,
    total,
    progress,
    notifyOn,
    start,
    pause,
    reset,
    switchPhase,
    saveSettings,
    enableNotifications,
  }

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider')
  return ctx
}
