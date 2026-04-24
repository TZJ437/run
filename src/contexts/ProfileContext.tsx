import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface ProfileData {
  nickname: string
  avatarEmoji: string
  avatarColor: string // hex
}

const DEFAULT: ProfileData = {
  nickname: '',
  avatarEmoji: '🌙',
  avatarColor: '#a78bfa',
}

interface Ctx {
  profile: ProfileData
  displayName: string
  setProfile: (p: Partial<ProfileData>) => void
}

const ProfileContext = createContext<Ctx | null>(null)

function storageKey(userId: string | null | undefined) {
  return `lightglass:profile:${userId ?? 'guest'}`
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfileState] = useState<ProfileData>(DEFAULT)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(user?.id))
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileData>
        setProfileState({ ...DEFAULT, ...parsed })
        return
      }
    } catch {
      /* ignore */
    }
    setProfileState(DEFAULT)
  }, [user?.id])

  const setProfile = useCallback(
    (p: Partial<ProfileData>) => {
      setProfileState((prev) => {
        const next = { ...prev, ...p }
        try {
          localStorage.setItem(storageKey(user?.id), JSON.stringify(next))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [user?.id],
  )

  const displayName =
    profile.nickname.trim() ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '朋友'

  return (
    <ProfileContext.Provider value={{ profile, setProfile, displayName }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
