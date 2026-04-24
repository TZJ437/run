import { useEffect } from 'react'
import { useWallpaper } from '@/contexts/WallpaperContext'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * 全局墙纸背景：fixed 铺满视口作为整个 App 的底层背景
 * - 图片清晰呈现（可选轻度模糊）
 * - 主题蒙层：浅色模式白雾、深色模式黑雾，强度可调
 * - 墙纸存在时在 body 上加 .has-wallpaper，让 aurora 让位
 */
export default function GlobalWallpaper() {
  const { src, overlay, blur } = useWallpaper()
  const { theme } = useTheme()

  useEffect(() => {
    if (src) document.body.classList.add('has-wallpaper')
    else document.body.classList.remove('has-wallpaper')
    return () => document.body.classList.remove('has-wallpaper')
  }, [src])

  if (!src) return null

  // 依主题挑选蒙层基色。亮色模式用近白，深色模式用近黑。
  const tint = theme === 'dark' ? 'rgb(10, 10, 14)' : 'rgb(245, 245, 247)'

  return (
    <div className="wallpaper-layer pointer-events-none fixed inset-0" aria-hidden>
      <img
        src={src}
        alt=""
        className="wallpaper-img absolute inset-0 h-full w-full object-cover"
        style={{
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          transform: blur > 0 ? 'scale(1.08)' : undefined,
        }}
      />
      {/* 主题蒙层：强度由用户在设置里调 */}
      <div
        className="absolute inset-0 transition-[background-color,opacity] duration-300"
        style={{ backgroundColor: tint, opacity: overlay }}
      />
      {/* 底部轻渐暗，保证底部导航可读 */}
      <div className="wallpaper-bottom-shade absolute inset-0" />
    </div>
  )
}
