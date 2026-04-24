/**
 * DeepSeek chat API
 * 无内置默认 key：必须由用户在"设置 → AI 对话"里填入自己的 key。
 */

const KEY_STORAGE = 'lightglass:deepseek-key'
const ENDPOINT = 'https://api.deepseek.com/chat/completions'

export class MissingApiKeyError extends Error {
  constructor() {
    super('请先在 设置 → AI 对话 中填入你自己的 DeepSeek API Key')
    this.name = 'MissingApiKeyError'
  }
}

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function hasApiKey(): boolean {
  return !!getApiKey().trim()
}

export function setApiKey(key: string) {
  try {
    if (key && key.trim()) localStorage.setItem(KEY_STORAGE, key.trim())
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: 'deepseek-chat' | 'deepseek-reasoner'
  temperature?: number
  signal?: AbortSignal
}

export async function chatCompletion(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const key = getApiKey()
  if (!key.trim()) throw new MissingApiKeyError()
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? 'deepseek-chat',
      messages,
      temperature: opts.temperature ?? 0.7,
      stream: false,
    }),
    signal: opts.signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('响应无内容')
  return content
}

export const SYSTEM_PROMPT =
  '你是 LightGlass 的内置助手。请用简洁、友好的中文回答用户的日常问题，回答要有条理但不啰嗦。可适度使用 Markdown（加粗/列表/代码块）让内容更清晰。'

export interface StreamOptions extends ChatOptions {
  onToken?: (chunk: string) => void
}

/**
 * SSE 流式对话。每收到一小段文字就回调 onToken(chunk)。
 * 最终返回完整拼接好的字符串。
 */
export async function chatCompletionStream(
  messages: ChatMessage[],
  opts: StreamOptions = {},
): Promise<string> {
  const key = getApiKey()
  if (!key.trim()) throw new MissingApiKeyError()

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? 'deepseek-chat',
      messages,
      temperature: opts.temperature ?? 0.7,
      stream: true,
    }),
    signal: opts.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 200)}`)
  }
  if (!res.body) throw new Error('响应无流')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || !line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') return full
      try {
        const json = JSON.parse(data)
        const delta = json?.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) {
          full += delta
          opts.onToken?.(delta)
        }
      } catch {
        /* partial chunk, wait for next */
      }
    }
  }
  return full
}

/**
 * 跨页触发聊天：任何页面 dispatch 这个事件即可打开 ChatFab 并预填/自动发送。
 * detail: { prompt: string, autoSend?: boolean }
 */
export const CHAT_OPEN_EVENT = 'lightglass:chat:open'

export function openChatWithPrompt(prompt: string, autoSend = true) {
  window.dispatchEvent(
    new CustomEvent(CHAT_OPEN_EVENT, { detail: { prompt, autoSend } }),
  )
}
