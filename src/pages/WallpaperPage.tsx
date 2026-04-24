import { useRef } from 'react'
import { Upload, Trash2, Compass, Image as ImageIcon } from 'lucide-react'
import GlassButton from '@/components/GlassButton'
import GlassCard from '@/components/GlassCard'
import { useWallpaper } from '@/contexts/WallpaperContext'

export default function WallpaperPage() {
  const { src, tilt, gyroState, uploading, debug, uploadWallpaper, clearWallpaper, enableGyro, disableGyro } = useWallpaper()
  const fileRef = useRef<HTMLInputElement>(null)

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

      {/* 当前墙纸预览 */}
      {src ? (
        <GlassCard rounded="3xl" className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-fg/60" />
            <span className="text-sm font-medium">当前墙纸</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-xl">
            {/* 背景：同一张图放大 + 模糊，模拟全局应用效果 */}
            <img
              src={src}
              alt=""
              aria-hidden
              className="wp-preview-bg absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25 dark:bg-black/40" />
            {/* 前景：清晰完整图 */}
            <img
              src={src}
              alt="当前墙纸"
              className="relative mx-auto max-h-80 w-auto object-contain"
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

      {/* 陀螺仪 */}
      <GlassCard rounded="3xl" className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Compass size={14} className="text-fg/60" />
          <span className="text-sm font-medium">陀螺仪微动</span>
        </div>
        <p className="text-xs text-fg/60">
          启用后，墙纸会根据手机倾斜产生轻微位移。
        </p>
        <div className="flex flex-wrap gap-2">
          {gyroState === 'on' ? (
            <GlassButton variant="ghost" onClick={disableGyro}>
              关闭陀螺仪
            </GlassButton>
          ) : (
            <GlassButton onClick={enableGyro} disabled={gyroState === 'unsupported'}>
              <Compass size={14} />
              {gyroState === 'denied' ? '重新请求授权' : '启用陀螺仪'}
            </GlassButton>
          )}
          <span className="self-center text-xs text-fg/50">
            状态：
            {gyroState === 'on' && '已启用'}
            {gyroState === 'idle' && '未启用'}
            {gyroState === 'denied' && '已拒绝（请在系统设置重新授权）'}
            {gyroState === 'unsupported' && '当前设备不支持'}
          </span>
        </div>
        {gyroState === 'on' && (
          <div className="mt-2 rounded-xl bg-black/15 p-3 font-mono text-[11px] leading-relaxed text-fg/70 dark:bg-white/10">
            <div>事件源: <b>{debug.source}</b></div>
            <div>累计事件: {debug.count}</div>
            <div>β (前后倾): {debug.beta?.toFixed(2) ?? '—'}</div>
            <div>γ (左右倾): {debug.gamma?.toFixed(2) ?? '—'}</div>
            <div>tilt: x={tilt.x.toFixed(2)} y={tilt.y.toFixed(2)}</div>
            {debug.count === 0 && <div className="mt-1 text-amber-600 dark:text-amber-400">⚠ 未收到任何传感器事件，尝试旋转手机</div>}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
