import { useEffect } from 'react'
import { useWallpaper } from '@/contexts/WallpaperContext'

/**
 * 全局墙纸背景：fixed 铺满视口作为整个 App 的底层背景
 * - 模糊 + 放大遮挡边缘
 * - 上下柔光 / 渐暗增加层次
 * - 墙纸存在时在 body 上加 .has-wallpaper，让 aurora 让位
 */
export default function GlobalWallpaper() {
  const { src } = useWallpaper()

  useEffect(() => {
    if (src) document.body.classList.add('has-wallpaper')
    else document.body.classList.remove('has-wallpaper')
    return () => document.body.classList.remove('has-wallpaper')
  }, [src])

  if (!src) return null

  return (
    <div className="wallpaper-layer pointer-events-none fixed inset-0" aria-hidden>
      <img src={src} alt="" className="wallpaper-img absolute inset-0 h-full w-full object-cover" />
      <div className="wallpaper-top-glow absolute inset-0" />
      <div className="wallpaper-bottom-shade absolute inset-0" />
    </div>
  )
}
