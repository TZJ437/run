import { useWallpaper } from '@/contexts/WallpaperContext'

/**
 * 全局墙纸背景：fixed 铺满视口作为整个 App 的底层背景
 * - 模糊 + 轻微放大，配合陀螺仪微动
 * - 底部渐暗增加层次
 * - 墙纸存在时完全覆盖 aurora；删除后自动移除
 */
export default function GlobalWallpaper() {
  const { src, tilt } = useWallpaper()
  if (!src) return null

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{
          filter: 'blur(36px) saturate(1.4) brightness(0.92)',
          transform: `scale(1.25) translate(${tilt.x * 0.6}px, ${tilt.y * 0.6}px)`,
          transition: 'transform 180ms ease-out',
        }}
      />
      {/* 顶部柔光 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 65% at 50% 18%, rgba(255,255,255,0.18), transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* 底部渐暗 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  )
}
