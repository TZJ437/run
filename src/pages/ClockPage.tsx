import { useEffect, useState } from 'react'
import GlassCard from '@/components/GlassCard'
import { useTheme } from '@/contexts/ThemeContext'
import { formatDateCN } from '@/lib/solarTerms'

/**
 * 经典指针时钟
 * - SVG 绘制表盘、刻度、时/分/秒针
 * - 秒针连续扫动（而非跳动）
 * - 中央数字时间与日期
 * - 表盘本身是液态玻璃
 */
export default function ClockPage() {
  const { theme } = useTheme()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let raf = 0
    const loop = () => {
      setNow(new Date())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const ms = now.getMilliseconds()
  const s = now.getSeconds() + ms / 1000
  const m = now.getMinutes() + s / 60
  const h = (now.getHours() % 12) + m / 60

  const secAngle = (s / 60) * 360
  const minAngle = (m / 60) * 360
  const hourAngle = (h / 12) * 360

  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })

  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
  const tickMajorColor = theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
  const handColor = theme === 'dark' ? '#f5f5f7' : '#1c1c1e'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">时钟</h1>
        <p className="text-sm text-fg/60">滴答，慢慢的</p>
      </div>

      <GlassCard rounded="3xl" className="p-6 sm:p-10">
        <div className="relative mx-auto aspect-square w-full max-w-sm sm:max-w-md">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <radialGradient id="dial-bg" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor={theme === 'dark' ? '#2a2a35' : '#ffffff'} stopOpacity="0.6" />
                <stop offset="100%" stopColor={theme === 'dark' ? '#0a0a0e' : '#e5e5ea'} stopOpacity="0.3" />
              </radialGradient>
              <filter id="hand-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 表盘内圈 */}
            <circle cx="100" cy="100" r="92" fill="url(#dial-bg)" />

            {/* 刻度 */}
            {Array.from({ length: 60 }).map((_, i) => {
              const major = i % 5 === 0
              const ang = (i / 60) * Math.PI * 2 - Math.PI / 2
              const r1 = major ? 78 : 83
              const r2 = 88
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(ang) * r1}
                  y1={100 + Math.sin(ang) * r1}
                  x2={100 + Math.cos(ang) * r2}
                  y2={100 + Math.sin(ang) * r2}
                  stroke={major ? tickMajorColor : tickColor}
                  strokeWidth={major ? 2 : 1}
                  strokeLinecap="round"
                />
              )
            })}

            {/* 时间数字 12 3 6 9 */}
            {[
              { n: 12, x: 100, y: 28 },
              { n: 3, x: 172, y: 105 },
              { n: 6, x: 100, y: 180 },
              { n: 9, x: 28, y: 105 },
            ].map(({ n, x, y }) => (
              <text
                key={n}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={handColor}
                fontSize="14"
                fontWeight="500"
                fontFamily="ui-sans-serif, -apple-system"
              >
                {n}
              </text>
            ))}

            {/* 时针 */}
            <g transform={`rotate(${hourAngle} 100 100)`} filter="url(#hand-shadow)">
              <rect x="97.5" y="50" width="5" height="55" rx="2.5" fill={handColor} />
            </g>
            {/* 分针 */}
            <g transform={`rotate(${minAngle} 100 100)`} filter="url(#hand-shadow)">
              <rect x="98.5" y="28" width="3" height="77" rx="1.5" fill={handColor} />
            </g>
            {/* 秒针（橙红） */}
            <g transform={`rotate(${secAngle} 100 100)`}>
              <line x1="100" y1="115" x2="100" y2="22" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill="#ef4444" />
              <circle cx="100" cy="100" r="2" fill={theme === 'dark' ? '#0a0a0e' : '#ffffff'} />
            </g>

            {/* 中心装饰 */}
            <circle cx="100" cy="100" r="3" fill={handColor} />
          </svg>
        </div>
      </GlassCard>

      {/* 数字时间 + 日期 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GlassCard rounded="2xl" className="p-5 text-center">
          <p className="text-xs text-fg/50">此刻</p>
          <p className="mt-1 font-mono text-3xl font-light tabular-nums sm:text-4xl">{timeStr}</p>
        </GlassCard>
        <GlassCard rounded="2xl" className="p-5 text-center">
          <p className="text-xs text-fg/50">今天</p>
          <p className="mt-1 text-xl font-medium sm:text-2xl">
            {formatDateCN(now)} <span className="text-fg/60">星期{weekday}</span>
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
