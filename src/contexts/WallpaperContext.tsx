import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'lightglass:wallpaper'
const OVERLAY_KEY = 'lightglass:wallpaper:overlay'
const BLUR_KEY = 'lightglass:wallpaper:blur'

/** 默认值：偏柔和，图片可见但不抢眼 */
export const DEFAULT_OVERLAY = 0.4 // 0..1
export const DEFAULT_BLUR = 0 // 0..40 px

interface Ctx {
  src: string | null
  uploading: boolean
  /** 主题蒙层不透明度：0 = 完全看清图，1 = 完全被纯色覆盖 */
  overlay: number
  /** 图片模糊半径 (px)：0 不模糊 */
  blur: number
  setOverlay: (v: number) => void
  setBlur: (v: number) => void
  uploadWallpaper: (file: File) => Promise<void>
  clearWallpaper: () => void
}

const WallpaperContext = createContext<Ctx | null>(null)

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
  const [uploading, setUploading] = useState(false)
  const [overlay, setOverlayState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(OVERLAY_KEY)
      const n = raw == null ? DEFAULT_OVERLAY : Number(raw)
      return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : DEFAULT_OVERLAY
    } catch {
      return DEFAULT_OVERLAY
    }
  })
  const [blur, setBlurState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(BLUR_KEY)
      const n = raw == null ? DEFAULT_BLUR : Number(raw)
      return Number.isFinite(n) ? Math.min(40, Math.max(0, n)) : DEFAULT_BLUR
    } catch {
      return DEFAULT_BLUR
    }
  })

  useEffect(() => {
    try {
      if (src) localStorage.setItem(STORAGE_KEY, src)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 配额溢出静默 */
    }
  }, [src])

  useEffect(() => {
    try {
      localStorage.setItem(OVERLAY_KEY, String(overlay))
    } catch {
      /* ignore */
    }
  }, [overlay])

  useEffect(() => {
    try {
      localStorage.setItem(BLUR_KEY, String(blur))
    } catch {
      /* ignore */
    }
  }, [blur])

  const setOverlay = useCallback((v: number) => {
    setOverlayState(Math.min(1, Math.max(0, v)))
  }, [])
  const setBlur = useCallback((v: number) => {
    setBlurState(Math.min(40, Math.max(0, v)))
  }, [])

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
  }, [])

  return (
    <WallpaperContext.Provider
      value={{ src, uploading, overlay, blur, setOverlay, setBlur, uploadWallpaper, clearWallpaper }}
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
