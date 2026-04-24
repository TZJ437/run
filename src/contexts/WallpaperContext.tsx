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

  // 陀螺仪监听
  useEffect(() => {
    if (gyroState !== 'on') return
    const handler = (e: DeviceOrientationEvent) => {
      const gx = Math.max(-10, Math.min(10, (e.gamma ?? 0) / 4.5))
      const gy = Math.max(-10, Math.min(10, ((e.beta ?? 0) - 40) / 5))
      setTilt({ x: gx, y: gy })
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
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
