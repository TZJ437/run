import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { loadData, saveData } from '@/lib/storage'

export interface ProfileData {
  nickname: string
  avatarImage: string // dataURL，为空则显示首字母
  avatarColor: string // hex，无图时作为首字母背景
}

const DEFAULT: ProfileData = {
  nickname: '',
  avatarImage: '',
  avatarColor: '#a78bfa',
}

interface Ctx {
  profile: ProfileData
  displayName: string
  avatarFallback: string // 无图时显示的首字母
  setProfile: (p: Partial<ProfileData>) => void
  uploadAvatar: (file: File) => Promise<void>
  clearAvatar: () => void
}

const ProfileContext = createContext<Ctx | null>(null)
const PROFILE_DATA_KEY = 'profile'

// 将图片文件压缩为正方形 base64（最大 256px，减小存储体积）
function resizeImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        const canvas = document.createElement('canvas')
        const dest = Math.min(max, size)
        canvas.width = dest
        canvas.height = dest
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas not supported'))
        ctx.drawImage(img, sx, sy, size, size, 0, 0, dest, dest)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('image decode failed'))
      img.src = String(ev.target?.result ?? '')
    }
    reader.onerror = () => reject(new Error('file read failed'))
    reader.readAsDataURL(file)
  })
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfileState] = useState<ProfileData>(DEFAULT)

  useEffect(() => {
    let cancelled = false
    loadData<Partial<ProfileData>>(user?.id ?? null, PROFILE_DATA_KEY, DEFAULT).then((data) => {
      if (!cancelled) setProfileState({ ...DEFAULT, ...data })
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const setProfile = useCallback(
    (p: Partial<ProfileData>) => {
      setProfileState((prev) => {
        const next = { ...prev, ...p }
        void saveData(user?.id ?? null, PROFILE_DATA_KEY, next)
        return next
      })
    },
    [user?.id],
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('仅支持图片文件')
      }
      const dataUrl = await resizeImage(file, 256)
      setProfile({ avatarImage: dataUrl })
    },
    [setProfile],
  )

  const clearAvatar = useCallback(() => {
    setProfile({ avatarImage: '' })
  }, [setProfile])

  const displayName =
    profile.nickname.trim() ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    (user ? '朋友' : '访客')

  const avatarFallback = displayName.trim().charAt(0).toUpperCase() || '·'

  return (
    <ProfileContext.Provider
      value={{ profile, setProfile, displayName, avatarFallback, uploadAvatar, clearAvatar }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
