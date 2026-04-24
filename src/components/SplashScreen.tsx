import { useEffect, useMemo, useState } from 'react'

const SESSION_KEY = 'lightglass:splashed'

// 生成对数螺旋（黄金螺旋）路径点
// r = a * e^(b*θ)，b = ln(φ)/(π/2) ≈ 0.3063，每转 1/4 圈半径放大 φ 倍
function buildSpiralPath(cx: number, cy: number, a: number, maxTheta: number): string {
  const b = 0.30635
  const pts: string[] = []
  for (let t = 0; t <= maxTheta; t += 0.04) {
    const r = a * Math.exp(b * t)
    const x = cx + r * Math.cos(t)
    const y = cy + r * Math.sin(t)
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return 'M' + pts.join(' L')
}

// 斐波那契数列前 N 项（用于绘制斐波那契方格）
function fib(n: number): number[] {
  const a = [1, 1]
  while (a.length < n) a.push(a[a.length - 1] + a[a.length - 2])
  return a
}

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem(SESSION_KEY)
  })
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (!visible) return
    const t1 = window.setTimeout(() => setHiding(true), 2000)
    const t2 = window.setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, 2600)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [visible])

  // viewBox 居中画布
  const spiralPath = useMemo(() => buildSpiralPath(100, 100, 0.8, 4.5 * Math.PI), [])
  const fibs = useMemo(() => fib(8), []) // 1,1,2,3,5,8,13,21

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-opacity duration-500 ${
        hiding ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden
    >
      {/* 背景柔光 */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-400/40 via-sky-400/25 to-fuchsia-400/30 blur-3xl" />
      </div>

      <svg
        viewBox="0 0 200 200"
        className="h-[60vmin] w-[60vmin]"
        style={{ filter: 'drop-shadow(0 10px 40px rgba(124, 58, 237, 0.35))' }}
      >
        <defs>
          <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>

        {/* 斐波那契方格（淡显） */}
        <g className="splash-squares" fill="none" stroke="url(#spiralGrad)" strokeOpacity="0.35" strokeWidth="0.4">
          {fibs.map((f, i) => {
            // 简化：每个方格按对数螺旋位置摆放（仅视觉装饰）
            const angle = (i * Math.PI) / 2
            const r = 3 * Math.exp(0.3063 * angle * 1.5)
            const x = 100 + r * Math.cos(angle) - f / 2
            const y = 100 + r * Math.sin(angle) - f / 2
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={f}
                height={f}
                rx="1"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            )
          })}
        </g>

        {/* 主螺旋路径：strokeDasharray/offset 动画绘出 */}
        <path
          d={spiralPath}
          fill="none"
          stroke="url(#spiralGrad)"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="splash-spiral"
        />

        {/* 中心亮点 */}
        <circle cx="100" cy="100" r="1.6" fill="url(#spiralGrad)" className="splash-dot" />
      </svg>

      <div className="mt-4 flex flex-col items-center gap-1">
        <span
          className="bg-gradient-to-r from-violet-500 via-sky-500 to-pink-500 bg-clip-text text-2xl font-semibold tracking-wider text-transparent splash-title"
        >
          LightGlass
        </span>
        <span className="text-xs text-fg/50 splash-subtitle">让生活慢下来</span>
      </div>
    </div>
  )
}
