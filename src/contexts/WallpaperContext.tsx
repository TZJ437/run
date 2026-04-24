import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'lightglass:wallpaper'
const GYRO_KEY = 'lightglass:wallpaper:gyro'

interface Ctx {
  src: string | null
  tilt: { x: number; y: number }
  gyroState: 'idle' | 'on' | 'denied' | 'unsupported'
  uploading: boolean
  uploadWallpaper: (file: File) => Promise<void>
  clearWallpaper: () => void
  enableGyro: () => Promise<void>
  disableGyro: () => void
}

const WallpaperContext = createContext<Ctx | null>(null)

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

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

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [gyroState, setGyroState] = useState<'idle' | 'on' | 'denied' | 'unsupported'>(() => {
    try {
      return localStorage.getItem(GYRO_KEY) === 'on' ? 'on' : 'idle'
    } catch {
      return 'idle'
    }
  })
  const [uploading, setUploading] = useState(false)

  // 持久化 src
  useEffect(() => {
    try {
      if (src) localStorage.setItem(STORAGE_KEY, src)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 配额溢出静默 */
    }
  }, [src])

  // 持久化 gyro 开关
  useEffect(() => {
    try {
      if (gyroState === 'on') localStorage.setItem(GYRO_KEY, 'on')
      else localStorage.removeItem(GYRO_KEY)
    } catch {
      /* ignore */
    }
  }, [gyroState])

  // 陀螺仪监听：同时尝试 deviceorientation / deviceorientationabsolute / devicemotion
  // Android WebView 下只有 devicemotion 稳定，所以三个都挂
  useEffect(() => {
    if (gyroState !== 'on') return

    let lastUpdate = 0
    const THROTTLE_MS = 32 // ~30fps

    const applyTilt = (beta: number | null, gamma: number | null) => {
      const now = Date.now()
      if (now - lastUpdate < THROTTLE_MS) return
      lastUpdate = now
      const gx = Math.max(-10, Math.min(10, (gamma ?? 0) / 4.5))
      const gy = Math.max(-10, Math.min(10, ((beta ?? 0) - 40) / 5))
      setTilt({ x: gx, y: gy })
    }

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null && e.gamma == null) return
      applyTilt(e.beta, e.gamma)
    }

    const onMotion = (e: DeviceMotionEvent) => {
      // 若 deviceorientation 已经提供数据则跳过（不互相干扰）
      const rot = e.rotationRate
      if (!rot) return
      // 用加速度方向近似作为倾斜角
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      // 将 X/Y 重力分量（-9.8..9.8）映射为 beta/gamma 伪值
      const pseudoGamma = Math.atan2(acc.x ?? 0, acc.z ?? 9.8) * (180 / Math.PI)
      const pseudoBeta = Math.atan2(acc.y ?? 0, acc.z ?? 9.8) * (180 / Math.PI)
      applyTilt(pseudoBeta, pseudoGamma)
    }

    window.addEventListener('deviceorientation', onOrientation)
    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener)
    window.addEventListener('devicemotion', onMotion)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      window.removeEventListener('deviceorientationabsolute', onOrientation as EventListener)
      window.removeEventListener('devicemotion', onMotion)
    }
  }, [gyroState])

  const uploadWallpaper = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const dataUrl = await fileToCompressedDataURL(file)
      setSrc(dataUrl)
    } finally {
      setUploading(false)
    }
  }, [])

  const clearWallpaper = useCallback(() => {
    setSrc(null)
    setTilt({ x: 0, y: 0 })
  }, [])

  const enableGyro = useCallback(async () => {
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
  }, [])

  const disableGyro = useCallback(() => {
    setGyroState('idle')
    setTilt({ x: 0, y: 0 })
  }, [])

  return (
    <WallpaperContext.Provider
      value={{ src, tilt, gyroState, uploading, uploadWallpaper, clearWallpaper, enableGyro, disableGyro }}
    >
      {children}
    </WallpaperContext.Provider>
  )
}

export function useWallpaper() {
  const ctx = useContext(WallpaperContext)
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider')
  return ctx
}
