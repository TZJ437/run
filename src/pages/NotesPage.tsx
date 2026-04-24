import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Pin, PinOff, Sparkles, X as XIcon } from 'lucide-react'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'
import { useAuth } from '@/contexts/AuthContext'
import { loadData, saveData } from '@/lib/storage'
import { openChatWithPrompt } from '@/lib/deepseek'

interface Note {
  id: string
  content: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}

const KEY = 'notes'

const AI_ACTIONS: { key: string; label: string; build: (text: string) => string }[] = [
  {
    key: 'polish',
    label: '润色',
    build: (t) => `请润色下面这段文字，让表达更自然流畅、保持原意，直接返回润色后的版本：\n\n${t}`,
  },
  {
    key: 'translate',
    label: '翻译',
    build: (t) => `请把下面这段中文翻译成英文，只返回译文：\n\n${t}`,
  },
  {
    key: 'summarize',
    label: '总结',
    build: (t) => `请用一两句话概括下面这段文字的要点：\n\n${t}`,
  },
  {
    key: 'expand',
    label: '展开',
    build: (t) => `请基于下面的要点展开成一段条理清晰的短文：\n\n${t}`,
  },
]

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [aiMenuFor, setAiMenuFor] = useState<string | null>(null)

  useEffect(() => {
    loadData<Note[]>(user?.id ?? null, KEY, []).then(data => {
      setNotes(data)
      setLoading(false)
    })
  }, [user?.id])

  const persist = (next: Note[]) => {
    setNotes(next)
    saveData(user?.id ?? null, KEY, next).catch(console.error)
  }

  const add = () => {
    const content = draft.trim()
    if (!content) return
    const now = Date.now()
    const note: Note = { id: crypto.randomUUID(), content, pinned: false, createdAt: now, updatedAt: now }
    persist([note, ...notes])
    setDraft('')
  }

  const remove = (id: string) => persist(notes.filter(n => n.id !== id))

  const togglePin = (id: string) =>
    persist(notes.map(n => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n)))

  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }, [notes])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">随手记</h1>
        <p className="text-sm text-fg/60">把此刻的念头收进玻璃瓶中</p>
      </div>

      {/* 输入框 */}
      <GlassCard rounded="2xl" className="p-4">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder="今天想记下什么？  ⌘/Ctrl + Enter 保存"
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-fg/40"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-fg/40">{draft.length} 字</span>
          <GlassButton variant="primary" size="sm" onClick={add} disabled={!draft.trim()}>
            <Plus size={14} /> 保存
          </GlassButton>
        </div>
      </GlassCard>

      {/* 列表 */}
      {loading ? (
        <p className="text-center text-sm text-fg/50">加载中…</p>
      ) : sorted.length === 0 ? (
        <div className="py-16 text-center text-sm text-fg/40">
          一片空白 · 就从这里开始吧
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map(n => (
            <GlassCard key={n.id} rounded="xl" className="group p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{n.content}</p>
              {aiMenuFor === n.id && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl bg-accent/10 p-2 text-xs">
                  <Sparkles size={12} className="text-accent" />
                  <span className="text-fg/70">AI：</span>
                  {AI_ACTIONS.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => {
                        openChatWithPrompt(a.build(n.content), true)
                        setAiMenuFor(null)
                      }}
                      className="btn-press liquid-glass-subtle rounded-full px-2.5 py-1 hover:text-accent"
                    >
                      {a.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setAiMenuFor(null)}
                    aria-label="关闭"
                    className="btn-press ml-auto rounded-full p-1 hover:bg-white/30 dark:hover:bg-white/10"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-fg/40">
                <span>{new Date(n.updatedAt).toLocaleString('zh-CN', { hour12: false })}</span>
                <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() =>
                      setAiMenuFor((cur) => (cur === n.id ? null : n.id))
                    }
                    className={`rounded-full p-1.5 hover:bg-accent/15 ${
                      aiMenuFor === n.id ? 'text-accent' : ''
                    }`}
                    aria-label="AI 处理"
                    title="AI 处理"
                  >
                    <Sparkles size={14} />
                  </button>
                  <button
                    onClick={() => togglePin(n.id)}
                    className="rounded-full p-1.5 hover:bg-white/40 dark:hover:bg-white/10"
                    aria-label={n.pinned ? '取消置顶' : '置顶'}
                  >
                    {n.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="rounded-full p-1.5 text-rose-500 hover:bg-rose-100/60 dark:hover:bg-rose-500/20"
                    aria-label="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {n.pinned && <span className="ml-auto text-accent">已置顶</span>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
