/**
 * DeepSeek chat API
 * 注意：API key 直接嵌入前端会随 APK/PWA 分发，任何人都能提取。
 * 当前这样做是因为用户明确提供了一个用于个人测试的 key。
 * 生产环境请改为后端代理或动态获取。
 */

const DEFAULT_KEY = 'sk-d5abf451f79c4297bd59d44bec996641'
const KEY_STORAGE = 'lightglass:deepseek-key'
const ENDPOINT = 'https://api.deepseek.com/chat/completions'

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || DEFAULT_KEY
  } catch {
    return DEFAULT_KEY
  }
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
  '你是 LightGlass 的内置助手。请用简洁、友好的中文回答用户的日常问题，回答要有条理但不啰嗦。'
