import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react'
import { chatCompletion, SYSTEM_PROMPT } from '@/lib/deepseek'
import type { ChatMessage } from '@/lib/deepseek'

/**
 * 悬浮聊天 FAB：
 * - 可拖拽，抬手时自动贴向最近的屏幕边缘（左/右）
 * - 拖动位移 < 6px 视为点击，打开聊天面板
 * - 点开后平滑从 FAB 位置放大为面板；关闭反向缩回
 * - 面板完全打开时 FAB 隐藏，避免重叠
 */

const FAB_SIZE = 48
const MARGIN = 12
/** 顶部预留（可视header高度） */
const TOP_RESERVE = 72
/** 底部预留：底部导航栏宽度 + 安全距 ≈ 120px */
const BOTTOM_RESERVE = 120
const DRAG_THRESHOLD = 4
// v2: 旧版本保存的位置可能被导航遮住，换键名让用户回到默认位
const POS_KEY = 'lightglass:chatfab:pos:v2'

type Pos = { x: number; y: number; side: 'left' | 'right' }

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function loadPos(): Pos | null {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (typeof p?.x === 'number' && typeof p?.y === 'number') return p
  } catch {
    /* ignore */
  }
  return null
}

function savePos(p: Pos) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export default function ChatFab() {
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // --- 可拖拽位置 ---
  const [pos, setPos] = useState<Pos | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef<{
    pointerX: number
    pointerY: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  // 初始位置（屏幕右下，避开底部导航）
  useLayoutEffect(() => {
    const saved = loadPos()
    const W = window.innerWidth
    const H = window.innerHeight
    const yMin = TOP_RESERVE
    const yMax = Math.max(yMin + 1, H - FAB_SIZE - BOTTOM_RESERVE)
    if (saved) {
      const x = saved.side === 'left' ? MARGIN : W - FAB_SIZE - MARGIN
      const y = clamp(saved.y, yMin, yMax)
      setPos({ x, y, side: saved.side })
    } else {
      setPos({
        x: W - FAB_SIZE - MARGIN,
        // 默认位置：屏幕右中偏下，已避开导航
        y: Math.max(yMin, H - FAB_SIZE - BOTTOM_RESERVE - 40),
        side: 'right',
      })
    }
  }, [])

  // 视口变化时重新贴边 / 限高
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        if (!p) return p
        const W = window.innerWidth
        const H = window.innerHeight
        const yMin = TOP_RESERVE
        const yMax = Math.max(yMin + 1, H - FAB_SIZE - BOTTOM_RESERVE)
        return {
          side: p.side,
          x: p.side === 'left' ? MARGIN : W - FAB_SIZE - MARGIN,
          y: clamp(p.y, yMin, yMax),
        }
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!pos) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: pos.x,
      startY: pos.y,
      moved: false,
    }
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = dragStartRef.current
    if (!s || !pos) return
    const dx = e.clientX - s.pointerX
    const dy = e.clientY - s.pointerY
    if (!s.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) s.moved = true
    if (!s.moved) return
    const W = window.innerWidth
    const H = window.innerHeight
    const yMin = TOP_RESERVE
    const yMax = Math.max(yMin + 1, H - FAB_SIZE - BOTTOM_RESERVE)
    setPos({
      x: clamp(s.startX + dx, MARGIN, W - FAB_SIZE - MARGIN),
      y: clamp(s.startY + dy, yMin, yMax),
      side: pos.side,
    })
  }

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = dragStartRef.current
    if (!s) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    dragStartRef.current = null
    setDragging(false)

    if (!s.moved) {
      // 作为点击处理
      setOpen(true)
      return
    }

    // 贴边
    setPos((p) => {
      if (!p) return p
      const W = window.innerWidth
      const centerX = p.x + FAB_SIZE / 2
      const side: 'left' | 'right' = centerX < W / 2 ? 'left' : 'right'
      const snappedX = side === 'left' ? MARGIN : W - FAB_SIZE - MARGIN
      const next = { x: snappedX, y: p.y, side }
      savePos(next)
      return next
    })
  }

  // 开/关动画生命周期
  useEffect(() => {
    if (open) {
      setRendered(true)
    } else if (rendered) {
      const t = setTimeout(() => setRendered(false), 280)
      return () => clearTimeout(t)
    }
  }, [open, rendered])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // 打开时监听 Escape / 硬件返回键（Android WebView 的 backbutton 事件）关闭
  // 不用 pushState，避免和 React Router 内部历史状态边埌
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onBack = (e: Event) => {
      e.preventDefault()
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('backbutton', onBack)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('backbutton', onBack)
    }
  }, [open])

  const closeWithBack = () => setOpen(false)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const history: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...next]
      const reply = await chatCompletion(history, { signal: ac.signal })
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: `⚠️ 出错了：${(err as Error).message}` },
        ])
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const clearAll = () => {
    abortRef.current?.abort()
    setMessages([])
  }

  // FAB 本体
  const fabStyle: CSSProperties | undefined = pos
    ? {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${FAB_SIZE}px`,
        height: `${FAB_SIZE}px`,
        transition: dragging
          ? 'none'
          : 'left 300ms cubic-bezier(.34,1.56,.64,1), top 300ms cubic-bezier(.34,1.56,.64,1), opacity 200ms ease, transform 200ms ease',
        touchAction: 'none',
        opacity: open ? 0 : 1,
        pointerEvents: open ? 'none' : 'auto',
      }
    : undefined

  const fab = (
    <button
      aria-label="打开 AI 对话（可拖拽）"
      title="AI 对话"
      className="chat-fab-draggable liquid-glass fixed z-[90] flex items-center justify-center rounded-full text-fg shadow-lg"
      style={fabStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <MessageCircle size={20} />
    </button>
  )

  // 面板（从 FAB 位置放大）
  const panelOrigin = pos
    ? `${pos.x + FAB_SIZE / 2}px ${pos.y + FAB_SIZE / 2}px`
    : 'bottom right'

  const panel = rendered ? (
    <div
      className={`chat-overlay fixed inset-0 z-[120] flex items-end justify-center sm:items-center ${
        open ? 'chat-overlay-open' : ''
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWithBack()
      }}
    >
      <div
        className={`chat-panel liquid-glass relative flex h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:h-[70vh] sm:rounded-3xl ${
          open ? 'chat-panel-open' : ''
        }`}
        style={{ transformOrigin: panelOrigin }}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-accent" />
            <span className="text-sm font-semibold">AI 对话</span>
            <span className="rounded-full bg-white/30 px-2 py-0.5 text-[10px] text-fg/70 dark:bg-white/10">
              DeepSeek
            </span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearAll}
                aria-label="清空对话"
                title="清空"
                className="btn-press rounded-full p-2 hover:bg-white/30 dark:hover:bg-white/10"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={closeWithBack}
              aria-label="关闭"
              className="btn-press rounded-full p-2 hover:bg-white/30 dark:hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-fg/60">
              <MessageCircle size={36} className="opacity-40" />
              <p className="text-sm">你好，有什么我可以帮你？</p>
              <p className="text-xs opacity-70">日常问题、写作、编程都行</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-accent/90 text-white'
                      : 'liquid-glass-subtle text-fg'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="liquid-glass-subtle flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm text-fg/70">
                <Loader2 size={14} className="animate-spin" />
                思考中…
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <div className="border-t border-white/20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="发送消息… (Enter 发送，Shift+Enter 换行)"
              className="liquid-glass-subtle max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="发送"
              className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-md disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null

  if (!pos) return null
  return (
    <>
      {createPortal(fab, document.body)}
      {panel && createPortal(panel, document.body)}
    </>
  )
}
