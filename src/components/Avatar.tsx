import { useProfile } from '@/contexts/ProfileContext'

interface Props {
  size?: number // px
  className?: string
}

export default function Avatar({ size = 36, className = '' }: Props) {
  const { profile, avatarFallback } = useProfile()
  const style: React.CSSProperties = {
    width: size,
    height: size,
    background: profile.avatarImage ? undefined : profile.avatarColor,
    fontSize: Math.round(size * 0.45),
  }
  if (profile.avatarImage) {
    return (
      <img
        src={profile.avatarImage}
        alt="头像"
        style={style}
        className={`shrink-0 rounded-full object-cover shadow-md ${className}`}
      />
    )
  }
  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-md ${className}`}
    >
      {avatarFallback}
    </div>
  )
}
