/**
 * 版本信息 + GitHub Release 更新检查
 */

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

export const APP_NAME: string =
  typeof __APP_NAME__ !== 'undefined' ? __APP_NAME__ : 'lightglass'

// GitHub 仓库（用于拉取 Releases / 构造 APK 下载链接）
export const GH_OWNER = 'TZJ437'
export const GH_REPO = 'run'

export const RELEASES_PAGE = `https://github.com/${GH_OWNER}/${GH_REPO}/releases`
export const LATEST_RELEASE_PAGE = `${RELEASES_PAGE}/latest`
/** GitHub 约定：/releases/latest/download/<asset-name> 永远指向最新 release 同名 asset */
export const LATEST_APK_URL = `${RELEASES_PAGE}/latest/download/LightGlass.apk`

export interface ReleaseInfo {
  /** tag 名，通常形如 "v1.2.3" */
  tag: string
  /** 去掉前缀 v 后的版本号 */
  version: string
  name: string
  notes: string
  url: string
  apkUrl: string | null
  publishedAt: string | null
}

/** 比较 semver，返回正数表示 a > b */
export function compareVersion(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/** 从 GitHub Releases 拉取最新版本信息 */
export async function fetchLatestRelease(
  signal?: AbortSignal,
): Promise<ReleaseInfo> {
  const api = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/latest`
  const res = await fetch(api, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) {
    throw new Error(`GitHub ${res.status}`)
  }
  const data = await res.json()
  const tag: string = data?.tag_name ?? ''
  const version = tag.replace(/^v/, '')
  const assets: Array<{ name: string; browser_download_url: string }> =
    Array.isArray(data?.assets) ? data.assets : []
  const apk = assets.find((a) => /\.apk$/i.test(a.name))
  return {
    tag,
    version,
    name: data?.name ?? tag,
    notes: data?.body ?? '',
    url: data?.html_url ?? LATEST_RELEASE_PAGE,
    apkUrl: apk?.browser_download_url ?? null,
    publishedAt: data?.published_at ?? null,
  }
}

export interface UpdateCheckResult {
  latest: ReleaseInfo
  hasUpdate: boolean
  current: string
}

export async function checkForUpdate(signal?: AbortSignal): Promise<UpdateCheckResult> {
  const latest = await fetchLatestRelease(signal)
  const hasUpdate =
    !!latest.version && compareVersion(latest.version, APP_VERSION) > 0
  return { latest, hasUpdate, current: APP_VERSION }
}
