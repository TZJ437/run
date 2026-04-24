import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Settings2, Bell, BellOff } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import { usePomodoro } from '@/contexts/PomodoroContext'

const HISTORY_FLAG = 'pomodoro-settings-open'

export default function PomodoroPage() {
  const {
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
  } = usePomodoro()

  const [showSettings, setShowSettings] = useState(false)

  // 打开设置面板时 pushState，手机返回键 → popstate 关闭
  useEffect(() => {
    if (!showSettings) return
    window.history.pushState({ flag: HISTORY_FLAG }, '')
    const onPop = () => setShowSettings(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [showSettings])

  const closeSettings = () => {
    // 若当前历史栈顶是我们的 flag，退一格会触发 popstate（回调里 setShowSettings(false)）
    if (window.history.state?.flag === HISTORY_FLAG) {
      window.history.back()
    } else {
      setShowSettings(false)
    }
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const circumference = 2 * Math.PI * 120
  const offset = useMemo(() => circumference * (1 - progress), [circumference, progress])

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
              const ok = await enableNotifications()
              if (!ok) alert('未获得通知权限，请在系统设置里开启')
            }}
            aria-label="通知权限"
            title={notifyOn ? '通知已开启' : '启用通知'}
          >
            {notifyOn ? <Bell size={16} /> : <BellOff size={16} />}
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setShowSettings(true)}
            aria-label="设置"
            title="设置时长"
          >
            <Settings2 size={16} />
          </GlassButton>
        </div>
      </div>

      {/* 设置面板 - 支持返回键关闭 */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:items-center sm:pb-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSettings()
          }}
        >
          <GlassCard
            rounded="3xl"
            className="mx-3 w-full max-w-md space-y-4 rounded-3xl p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">番茄钟设置</h2>
              <button
                onClick={closeSettings}
                className="btn-press liquid-glass-subtle rounded-full px-3 py-1 text-xs"
              >
                完成
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-fg/60">专注时长（分钟）</label>
              <input
                type="number"
                min={1}
                max={180}
                value={settings.focusMin}
                onChange={(e) =>
                  saveSettings({ ...settings, focusMin: Number(e.target.value) || 1 })
                }
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
                onChange={(e) =>
                  saveSettings({ ...settings, breakMin: Number(e.target.value) || 1 })
                }
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
        </div>
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
            {running && (
              <span className="mt-1 text-[10px] text-fg/40">
                已挂在后台，切页或锁屏也会计时
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          {running ? (
            <GlassButton variant="primary" size="lg" onClick={pause}>
              <Pause size={16} /> 暂停
            </GlassButton>
          ) : (
            <GlassButton variant="primary" size="lg" onClick={start}>
              <Play size={16} /> 开始
            </GlassButton>
          )}
          <GlassButton variant="default" size="lg" onClick={reset}>
            <RotateCcw size={16} /> 重置
          </GlassButton>
        </div>

        <div className="mt-3 text-center text-xs text-fg/50">
          总时长 {Math.round(total / 60)} 分钟
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
