import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Compass } from 'lucide-react'
import GlassButton from '@/components/GlassButton'

const STORAGE_KEY = 'lightglass:wallpaper'

// 把上传图压到 1280px 以内、JPEG 质量 0.85，避免 localStorage 爆掉
async function fileToCompressedDataURL(file: File, maxSize = 1280, quality = 0.85): Promise<string> {
  const img = document.createElement('img')
  const url = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load failed'))
      img.src = url
    })
    const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * ratio))
    const h = Math.max(1, Math.round(img.naturalHeight * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export default function WallpaperPage() {
  const [src, setSrc] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [gyroState, setGyroState] = useState<'idle' | 'on' | 'denied' | 'unsupported'>('idle')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      if (src) localStorage.setItem(STORAGE_KEY, src)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 配额溢出时静默：图已经在内存里，仅本次有效
    }
  }, [src])

  // 陀螺仪监听
  useEffect(() => {
    if (gyroState !== 'on') return
    const handler = (e: DeviceOrientationEvent) => {
      // gamma: 左右倾斜 -90..90，beta: 前后 -180..180
      const gx = Math.max(-10, Math.min(10, (e.gamma ?? 0) / 4.5))
      const gy = Math.max(-10, Math.min(10, ((e.beta ?? 0) - 40) / 5))
      setTilt({ x: gx, y: gy })
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [gyroState])

  const enableGyro = async () => {
    const Ctor = (window as unknown as { DeviceOrientationEvent?: DeviceOrientationEventStatic })
      .DeviceOrientationEvent
    if (!Ctor) {
      setGyroState('unsupported')
      return
    }
    if (typeof Ctor.requestPermission === 'function') {
      try {
        const res = await Ctor.requestPermission()
        setGyroState(res === 'granted' ? 'on' : 'denied')
      } catch {
        setGyroState('denied')
      }
      return
    }
    setGyroState('on')
  }

  const onFile = async (f: File) => {
    setUploading(true)
    try {
      const dataUrl = await fileToCompressedDataURL(f)
      setSrc(dataUrl)
    } catch {
      alert('图片读取失败，请换一张试试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">光锥墙纸</h1>
          <p className="text-xs text-fg/60">前景清晰 · 背景毛玻璃 · 陀螺仪微动</p>
        </div>
        <div className="flex gap-2">
          <GlassButton onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={14} />
            {uploading ? '处理中…' : '上传'}
          </GlassButton>
          {src && (
            <GlassButton variant="ghost" onClick={() => setSrc(null)} aria-label="删除">
              <Trash2 size={14} />
            </GlassButton>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        aria-label="选择墙纸图片"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />

      {!src ? (
        <div className="liquid-glass flex h-[60vh] flex-col items-center justify-center rounded-3xl text-fg/60">
          <Upload size={36} className="mb-3 opacity-60" />
          <p className="text-sm">上传一张图片，体验光锥效果</p>
          <p className="mt-1 text-xs opacity-70">图片仅保存在本机</p>
        </div>
      ) : (
        <div
          className="relative h-[70vh] overflow-hidden rounded-3xl shadow-2xl"
          style={{ perspective: '1200px' }}
        >
          {/* 后景：模糊放大 */}
          <img
            src={src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{
              filter: 'blur(36px) saturate(1.5) brightness(0.95)',
              transform: `scale(1.35) translate(${tilt.x * 0.6}px, ${tilt.y * 0.6}px)`,
              transition: 'transform 180ms ease-out',
            }}
          />

          {/* 光锥光束：从顶部向下发散的柔光 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 90% 65% at 50% 18%, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 45%, transparent 70%)',
              mixBlendMode: 'screen',
            }}
          />
          {/* 下方渐暗，增强深度 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.35) 100%)',
            }}
          />

          {/* 前景：清晰图 + 陀螺仪微倾 */}
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <img
              src={src}
              alt="wallpaper"
              className="max-h-full max-w-full rounded-2xl ring-1 ring-white/20 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.45)] will-change-transform"
              style={{
                transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg) translate3d(${tilt.x * 0.8}px, ${tilt.y * 0.8}px, 0)`,
                transition: 'transform 120ms ease-out',
              }}
            />
          </div>
        </div>
      )}

      {src && gyroState !== 'on' && (
        <div className="flex flex-col items-center gap-2">
          {gyroState === 'idle' && (
            <GlassButton onClick={enableGyro}>
              <Compass size={14} />
              启用陀螺仪倾斜
            </GlassButton>
          )}
          {gyroState === 'denied' && (
            <p className="text-xs text-fg/60">已拒绝陀螺仪权限，可在系统设置里重新授权</p>
          )}
          {gyroState === 'unsupported' && (
            <p className="text-xs text-fg/60">当前设备不支持陀螺仪</p>
          )}
        </div>
      )}
    </div>
  )
}
