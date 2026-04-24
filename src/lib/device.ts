// 设备能力封装：优先用 Capacitor 原生插件，回退到 Web API

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

interface ScheduleOpts {
  id: number
  title: string
  body: string
  at?: Date // 未提供表示立即
  ongoing?: boolean // 常驻状态栏
}

const webTimers = new Map<number, number>()

export async function scheduleNotification(opts: ScheduleOpts): Promise<void> {
  try {
    if (isNative()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [
          {
            id: opts.id,
            title: opts.title,
            body: opts.body,
            ongoing: opts.ongoing,
            autoCancel: !opts.ongoing,
            schedule: opts.at ? { at: opts.at, allowWhileIdle: true } : undefined,
            smallIcon: 'ic_stat_icon_config_sample',
          },
        ],
      })
      return
    }
  } catch {
    /* ignore */
  }
  // Web 回退：setTimeout + Notification API
  try {
    const delay = opts.at ? Math.max(0, opts.at.getTime() - Date.now()) : 0
    const existing = webTimers.get(opts.id)
    if (existing) window.clearTimeout(existing)
    const t = window.setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(opts.title, { body: opts.body })
      }
      webTimers.delete(opts.id)
    }, delay)
    webTimers.set(opts.id, t)
  } catch {
    /* ignore */
  }
}

export async function cancelNotifications(ids: number[]): Promise<void> {
  try {
    if (isNative()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
      return
    }
  } catch {
    /* ignore */
  }
  ids.forEach((id) => {
    const t = webTimers.get(id)
    if (t) {
      window.clearTimeout(t)
      webTimers.delete(id)
    }
  })
}

// 兼容旧用法（立即通知）
export async function notify(title: string, body: string): Promise<void> {
  return scheduleNotification({ id: Date.now() & 0x7fffffff, title, body })
}
