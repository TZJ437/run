import { useRef, useState } from 'react'
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import GlassButton from '@/components/GlassButton'
import GlassCard from '@/components/GlassCard'
import { useWallpaper } from '@/contexts/WallpaperContext'

export default function WallpaperPage() {
  const { src, uploading, uploadWallpaper, clearWallpaper } = useWallpaper()
  const fileRef = useRef<HTMLInputElement>(null)
  const [aspect, setAspect] = useState<number | null>(null)

  const onPickFile = async (f: File | null) => {
    if (!f) return
    try {
      await uploadWallpaper(f)
    } catch {
      alert('图片读取失败，请换一张试试')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">墙纸</h1>
          <p className="text-xs text-fg/60">设置后作用于整个 App 背景 · 删除自动恢复</p>
        </div>
        <div className="flex gap-2">
          <GlassButton onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={14} />
            {uploading ? '处理中…' : src ? '更换' : '上传'}
          </GlassButton>
          {src && (
            <GlassButton variant="ghost" onClick={clearWallpaper} aria-label="删除墙纸">
              <Trash2 size={14} />
              删除
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
          const f = e.target.files?.[0] ?? null
          onPickFile(f)
          e.target.value = ''
        }}
      />

      {/* 当前墙纸预览：按图片原始宽高比自适应，大圆角 */}
      {src ? (
        <GlassCard rounded="3xl" className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-fg/60" />
            <span className="text-sm font-medium">当前墙纸</span>
          </div>
          <div
            className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl ring-1 ring-white/20 shadow-xl"
            style={aspect ? { aspectRatio: `${aspect}` } : undefined}
          >
            <img
              src={src}
              alt="当前墙纸"
              className="absolute inset-0 h-full w-full object-cover"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth && img.naturalHeight) {
                  setAspect(img.naturalWidth / img.naturalHeight)
                }
              }}
            />
          </div>
          <p className="text-xs text-fg/60">
            墙纸已应用到全局背景（模糊 + 柔光）。你可以切换到任何页面查看。
          </p>
        </GlassCard>
      ) : (
        <GlassCard rounded="3xl" className="flex h-60 flex-col items-center justify-center gap-2 p-6 text-fg/60">
          <Upload size={36} className="opacity-60" />
          <p className="text-sm">上传一张图片作为全局墙纸</p>
          <p className="text-xs opacity-70">图片压缩后仅保存在本机</p>
        </GlassCard>
      )}
    </div>
  )
}
