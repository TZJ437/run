/**
 * 平台检测工具
 */

/** 当前是否运行在 Capacitor 原生壳里（Android APK / iOS） */
export function isNativeApp(): boolean {
  // @ts-expect-error Capacitor 由原生壳注入全局
  const cap = typeof window !== 'undefined' ? window.Capacitor : undefined
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform())
}

/** 当前是否是移动设备浏览器（根据 UA 粗略判断） */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

/** 当前是否是 Android 浏览器 */
export function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent || '')
}

/** 简单的 App 运行环境名 */
export function platformLabel(): string {
  if (isNativeApp()) return 'Android App'
  if (isAndroidBrowser()) return 'Android 浏览器'
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'iOS 浏览器'
  return '桌面浏览器'
}
