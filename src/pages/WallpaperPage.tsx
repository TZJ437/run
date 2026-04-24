import { useRef, useState } from 'react'
import { Upload, Trash2, Image as ImageIcon, Sliders, RotateCcw } from 'lucide-react'
import GlassButton from '@/components/GlassButton'
import GlassCard from '@/components/GlassCard'
import {
  DEFAULT_BLUR,
  DEFAULT_OVERLAY,
  useWallpaper,
} from '@/contexts/WallpaperContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function WallpaperPage() {
  const {
    src,
    uploading,
    overlay,
    blur,
    setOverlay,
    setBlur,
    uploadWallpaper,
    clearWallpaper,
  } = useWallpaper()
  const { theme } = useTheme()
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
            墙纸已应用到全局背景。你可以切换到任何页面查看。
          </p>
        </GlassCard>
      ) : null}

      {/* 调节：主题蒙层 + 模糊（仅在有墙纸时显示） */}
      {src && (
        <GlassCard rounded="3xl" className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-fg/60" />
              <span className="text-sm font-medium">调节</span>
            </div>
            <GlassButton
              size="sm"
              variant="ghost"
              onClick={() => {
                setOverlay(DEFAULT_OVERLAY)
                setBlur(DEFAULT_BLUR)
              }}
              disabled={overlay === DEFAULT_OVERLAY && blur === DEFAULT_BLUR}
            >
              <RotateCcw size={12} /> 恢复默认
            </GlassButton>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-fg/60">
              <label htmlFor="wp-overlay">
                主题蒙层（{theme === 'dark' ? '深色' : '浅色'}）
              </label>
              <span className="font-mono">{Math.round(overlay * 100)}%</span>
            </div>
            <input
              id="wp-overlay"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(overlay * 100)}
              onChange={(e) => setOverlay(Number(e.target.value) / 100)}
              aria-label="蒙层强度"
              className="w-full accent-accent"
            />
            <p className="text-[11px] text-fg/50">
              强度越大，图片越朦胧；设为 0 则完全展示原图
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-fg/60">
              <label htmlFor="wp-blur">图片模糊</label>
              <span className="font-mono">{blur}px</span>
            </div>
            <input
              id="wp-blur"
              type="range"
              min={0}
              max={40}
              step={1}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              aria-label="模糊强度"
              className="w-full accent-accent"
            />
          </div>
        </GlassCard>
      )}

      {!src && (
        <GlassCard rounded="3xl" className="flex h-60 flex-col items-center justify-center gap-2 p-6 text-fg/60">
          <Upload size={36} className="opacity-60" />
          <p className="text-sm">上传一张图片作为全局墙纸</p>
          <p className="text-xs opacity-70">图片压缩后仅保存在本机</p>
        </GlassCard>
      )}
    </div>
  )
}
