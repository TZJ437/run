import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'lightglass:wallpaper'

interface Ctx {
  src: string | null
  uploading: boolean
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

  useEffect(() => {
    try {
      if (src) localStorage.setItem(STORAGE_KEY, src)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 配额溢出静默 */
    }
  }, [src])

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
    <WallpaperContext.Provider value={{ src, uploading, uploadWallpaper, clearWallpaper }}>
      {children}
    </WallpaperContext.Provider>
  )
}

export function useWallpaper() {
  const ctx = useContext(WallpaperContext)
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider')
  return ctx
}
