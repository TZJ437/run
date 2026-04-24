import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Trash2,
  Settings as SettingsIcon,
  Key,
  Square,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  chatCompletionStream,
  hasApiKey,
  MissingApiKeyError,
  SYSTEM_PROMPT,
  CHAT_OPEN_EVENT,
} from '@/lib/deepseek'
import type { ChatMessage } from '@/lib/deepseek'

const HISTORY_KEY = 'lightglass:chat:history'
const MAX_HISTORY = 50

interface QuickPrompt {
  label: string
  prompt: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: '今天做什么', prompt: '帮我列 3-5 条今天可以尝试的高性价比小事，简短条目。' },
  { label: '帮我翻译', prompt: '请把接下来我发的内容翻译成英文，只返回译文。\n\n' },
  { label: '润色一下', prompt: '请润色下面这段文字，让表达更自然流畅，保持原意：\n\n' },
  { label: '写一封邮件', prompt: '请帮我起草一封正式但友好的邮件，主题是：' },
]

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    const trimmed = messages.slice(-MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch {
    /* ignore */
  }
}

/**
 * 聊天 FAB（灵动岛式）：
 * - 作为底部导航栏的并排兄弟元素渲染，固定在导航右侧
 * - 流式输出、对话持久化、快捷提示词、Markdown 渲染
 * - 监听 CHAT_OPEN_EVENT 事件，允许其它页面预填/自动发送
 */
export default function ChatFab() {
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [keyReady, setKeyReady] = useState(() => hasApiKey())
  const btnRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [origin, setOrigin] = useState<string>('bottom right')
  const nav = useNavigate()

  // 持久化
  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  // 开/关动画生命周期
  useEffect(() => {
    if (open) {
      setKeyReady(hasApiKey())
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

  // 键盘/返回键关闭
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

  // 跨页触发：其它页面 dispatch CHAT_OPEN_EVENT 即可打开并预填
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { prompt?: string; autoSend?: boolean }
        | undefined
      setOpen(true)
      if (detail?.prompt) {
        const text = detail.prompt
        setInput(text)
        if (detail.autoSend) {
          // 等面板打开 + key 状态刷新
          setTimeout(() => sendText(text), 200)
        }
      }
    }
    window.addEventListener(CHAT_OPEN_EVENT, handler)
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    if (!hasApiKey()) {
      setKeyReady(false)
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    // 先把 user 消息 + 一个占位 assistant 消息加进去，流式填充后者
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    const ac = new AbortController()
    abortRef.current = ac

    try {
      // 发出时拼接最新历史（排除末尾占位）
      const history: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        userMsg,
      ]
      await chatCompletionStream(history, {
        signal: ac.signal,
        onToken: (chunk) => {
          setMessages((prev) => {
            const copy = prev.slice()
            const last = copy[copy.length - 1]
            if (last && last.role === 'assistant') {
              copy[copy.length - 1] = { ...last, content: last.content + chunk }
            }
            return copy
          })
        },
      })
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        setKeyReady(false)
        // 删掉刚加的占位+用户消息
        setMessages((prev) => prev.slice(0, -2))
      } else if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => {
          const copy = prev.slice()
          const last = copy[copy.length - 1]
          const errText = `⚠️ 出错了：${(err as Error).message}`
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = {
              ...last,
              content: last.content ? last.content + '\n\n' + errText : errText,
            }
          }
          return copy
        })
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const send = () => sendText(input)

  const stop = () => {
    abortRef.current?.abort()
  }

  const clearAll = () => {
    abortRef.current?.abort()
    setMessages([])
  }

  const pickQuickPrompt = (q: QuickPrompt) => {
    setInput(q.prompt)
    setTimeout(() => {
      const el = inputRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(q.prompt.length, q.prompt.length)
      }
    }, 0)
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
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-fg/60">
              <MessageCircle size={36} className="opacity-40" />
              <div className="space-y-1">
                <p className="text-sm">你好，有什么我可以帮你？</p>
                <p className="text-xs opacity-70">或者试试下面这些快捷问题</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => pickQuickPrompt(q)}
                    className="liquid-glass-subtle btn-press rounded-full px-3 py-1.5 text-xs text-fg hover:text-accent"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => {
              const isUser = m.role === 'user'
              const isLastAssistant =
                !isUser && i === messages.length - 1 && loading && m.content === ''
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'whitespace-pre-wrap break-words bg-accent/90 text-white'
                        : 'liquid-glass-subtle text-fg'
                    }`}
                  >
                    {isUser ? (
                      m.content
                    ) : isLastAssistant ? (
                      <span className="flex items-center gap-2 text-fg/70">
                        <Loader2 size={14} className="animate-spin" />
                        思考中…
                      </span>
                    ) : (
                      <MarkdownBubble text={m.content} />
                    )}
                  </div>
                </div>
              )
            })
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
              placeholder={
                keyReady
                  ? '发送消息… (Enter 发送，Shift+Enter 换行)'
                  : '请先设置 API Key'
              }
              className="liquid-glass-subtle max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            {loading ? (
              <button
                onClick={stop}
                aria-label="停止生成"
                title="停止"
                className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-md"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!keyReady || !input.trim()}
                aria-label="发送"
                className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-md disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
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

function MarkdownBubble({ text }: { text: string }) {
  return (
    <div className="chat-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}
