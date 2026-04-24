import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, Loader2, Trash2, Settings as SettingsIcon, Key } from 'lucide-react'
import { chatCompletion, hasApiKey, MissingApiKeyError, SYSTEM_PROMPT } from '@/lib/deepseek'
import type { ChatMessage } from '@/lib/deepseek'

/**
 * 聊天 FAB（灵动岛式）：
 * - 作为底部导航栏的并排兄弟元素渲染，固定在导航右侧
 * - 点击后从按钮位置平滑放大为聊天面板；关闭反向缩回
 * - 面板 Portal 到 body 保证不受祖先 transform 影响
 */
export default function ChatFab() {
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [keyReady, setKeyReady] = useState(() => hasApiKey())
  const btnRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [origin, setOrigin] = useState<string>('bottom right')
  const nav = useNavigate()

  // 开/关动画生命周期：关闭时延迟卸载面板
  useEffect(() => {
    if (open) {
      // 每次打开都重新读取 key 状态（用户可能刚在设置里填完返回）
      setKeyReady(hasApiKey())
      // 读取按钮此刻的视口位置作为放大原点
      const r = btnRef.current?.getBoundingClientRect()
      if (r) setOrigin(`${r.left + r.width / 2}px ${r.top + r.height / 2}px`)
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

  // Escape / Android 返回键 关闭
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
      if (err instanceof MissingApiKeyError) {
        setKeyReady(false)
      } else if ((err as Error).name !== 'AbortError') {
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

  const panel = rendered ? (
    <div
      className={`chat-overlay fixed inset-0 z-[120] flex items-end justify-center sm:items-center ${
        open ? 'chat-overlay-open' : ''
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        className={`chat-panel liquid-glass relative flex h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:h-[70vh] sm:rounded-3xl ${
          open ? 'chat-panel-open' : ''
        }`}
        style={{ transformOrigin: origin }}
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
              onClick={() => setOpen(false)}
              aria-label="关闭"
              className="btn-press rounded-full p-2 hover:bg-white/30 dark:hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {!keyReady ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-fg/70">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                <Key size={22} />
              </div>
              <p className="text-sm font-medium">需要先设置 API Key</p>
              <p className="max-w-xs text-xs text-fg/60">
                使用 AI 对话前，请先在"设置 → AI 对话"中填入你自己的 DeepSeek API Key。
                <br />
                key 只会保存在你本机浏览器里。
              </p>
              <button
                onClick={() => {
                  setOpen(false)
                  nav('/settings')
                }}
                className="liquid-glass-subtle btn-press mt-1 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
              >
                <SettingsIcon size={12} />
                去设置填 Key
              </button>
              <p className="text-[11px] text-fg/40">
                获取：platform.deepseek.com → API keys
              </p>
            </div>
          ) : messages.length === 0 ? (
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
              disabled={!keyReady}
              placeholder={keyReady ? '发送消息… (Enter 发送，Shift+Enter 换行)' : '请先设置 API Key'}
              className="liquid-glass-subtle max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!keyReady || !input.trim() || loading}
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

  return (
    <>
      {/* FAB 本体：作为 AppShell 底部导航的兄弟元素，位于导航右侧 */}
      <button
        ref={btnRef}
        onClick={() => setOpen(true)}
        aria-label="AI 对话"
        title="AI 对话"
        className={`chat-pill liquid-glass btn-press pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-2xl text-fg transition-opacity ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <MessageCircle size={20} />
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  )
}
