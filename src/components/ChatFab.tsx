import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react'
import { chatCompletion, SYSTEM_PROMPT } from '@/lib/deepseek'
import type { ChatMessage } from '@/lib/deepseek'

/**
 * 悬浮聊天 FAB：底部导航右侧小圆按钮 → 点开为聊天面板
 * - 关闭态：56px 圆形玻璃按钮
 * - 打开态：全屏遮罩 + 底部上滑面板（桌面端居中）
 * - 使用 CSS transform scale 实现开关动画
 */
export default function ChatFab() {
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false) // 控制是否挂载面板（动画结束后卸载）
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 开/关动画生命周期
  useEffect(() => {
    if (open) {
      setRendered(true)
    } else if (rendered) {
      const t = setTimeout(() => setRendered(false), 260)
      return () => clearTimeout(t)
    }
  }, [open, rendered])

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 280)
  }, [open])

  // 消息滚到底
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // 手机返回键关闭聊天
  useEffect(() => {
    if (!open) return
    window.history.pushState({ chatFab: true }, '')
    const onPop = () => setOpen(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [open])

  const closeWithBack = () => {
    if (window.history.state?.chatFab) window.history.back()
    else setOpen(false)
  }

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

  const fab = (
    <button
      onClick={() => setOpen(true)}
      aria-label="打开 AI 对话"
      title="AI 对话"
      className="chat-fab liquid-glass btn-press fixed z-[90] flex h-12 w-12 items-center justify-center rounded-full text-fg shadow-lg"
    >
      <MessageCircle size={20} />
    </button>
  )

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

  // Portal 挂到 body 避免被路由 transform 影响
  return (
    <>
      {createPortal(fab, document.body)}
      {panel && createPortal(panel, document.body)}
    </>
  )
}
