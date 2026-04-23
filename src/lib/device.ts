// 设备能力封装：优先用 Capacitor 原生插件，回退到 Web API
// 动态 import 保证 Web 构建下也能正常打包（插件 JS 侧会自动判定平台）

function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!cap?.isNativePlatform?.()
}

export async function hapticPulse(): Promise<void> {
  try {
    if (isNative()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: ImpactStyle.Heavy })
      return
    }
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([180, 90, 180])
  }
}

export async function requestNotifyPermission(): Promise<boolean> {
  try {
    if (isNative()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const cur = await LocalNotifications.checkPermissions()
      if (cur.display === 'granted') return true
      const req = await LocalNotifications.requestPermissions()
      return req.display === 'granted'
    }
  } catch {
    /* ignore */
  }
  if ('Notification' in window) {
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const r = await Notification.requestPermission()
    return r === 'granted'
  }
  return false
}

export async function notify(title: string, body: string): Promise<void> {
  try {
    if (isNative()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() & 0x7fffffff,
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) },
            smallIcon: 'ic_stat_icon_config_sample',
          },
        ],
      })
      return
    }
  } catch {
    /* ignore */
  }
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  } catch {
    /* ignore */
  }
}
