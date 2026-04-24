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
  '你是 LightGlass 的内置助手。请用简洁、友好的中文回答用户的日常问题，回答要有条理但不啰嗦。'
