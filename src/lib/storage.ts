/**
 * 通用本地存储 + 可选 Supabase 云同步封装
 * - 未登录或未配置 Supabase：只用 localStorage
 * - 已登录 + Supabase 开启：先读/写本地，后台同步到云
 */
import { supabase, isSupabaseEnabled } from './supabase'

const userScope = (userId: string | null, key: string) =>
  `lightglass:${userId ?? 'guest'}:${key}`

export async function loadData<T>(userId: string | null, key: string, fallback: T): Promise<T> {
  const localKey = userScope(userId, key)
  const raw = localStorage.getItem(localKey)
  let localValue: T = fallback
  if (raw) {
    try { localValue = JSON.parse(raw) as T } catch { /* noop */ }
  }
  if (!userId || !isSupabaseEnabled || !supabase) return localValue

  const { data, error } = await supabase
    .from('user_data')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()

  if (error || !data) return localValue
  const cloudValue = data.value as T
  localStorage.setItem(localKey, JSON.stringify(cloudValue))
  return cloudValue
}

export async function saveData<T>(userId: string | null, key: string, value: T): Promise<void> {
  const localKey = userScope(userId, key)
  localStorage.setItem(localKey, JSON.stringify(value))
  if (!userId || !isSupabaseEnabled || !supabase) return

  await supabase.from('user_data').upsert(
    { user_id: userId, key, value, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,key' },
  )
}
