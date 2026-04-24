import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export interface LiquidConfig {
  blurAmount: number
  refraction: number
  chromAberration: number
  edgeHighlight: number
  specular: number
  fresnel: number
  distortion: number
  cornerRadius: number
  zRadius: number
  opacity: number
  saturation: number
  brightness: number
  shadowOpacity: number
  shadowSpread: number
  bevelMode: 0 | 1
}

// 调过的默认值：cornerRadius ≈ 半高让 pill 形状与 CSS rounded-full 对齐
export const DEFAULT_LIQUID: LiquidConfig = {
  blurAmount: 0.1,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  distortion: 0,
  cornerRadius: 24,
  zRadius: 12,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.25,
  shadowSpread: 6,
  bevelMode: 0,
}

const STORAGE_KEY = 'lightglass:liquid-config'

interface Ctx {
  config: LiquidConfig
  setConfig: (patch: Partial<LiquidConfig>) => void
  reset: () => void
  version: number // 每次 setConfig 自增，用于触发消费方重新初始化
}

const LiquidConfigContext = createContext<Ctx | null>(null)

export function LiquidConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<LiquidConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return { ...DEFAULT_LIQUID, ...JSON.parse(raw) }
    } catch {
      /* ignore */
    }
    return DEFAULT_LIQUID
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      /* ignore */
    }
  }, [config])

  const setConfig = useCallback((patch: Partial<LiquidConfig>) => {
    setConfigState((prev) => ({ ...prev, ...patch }))
    setVersion((v) => v + 1)
  }, [])

  const reset = useCallback(() => {
    setConfigState(DEFAULT_LIQUID)
    setVersion((v) => v + 1)
  }, [])

  return (
    <LiquidConfigContext.Provider value={{ config, setConfig, reset, version }}>
      {children}
    </LiquidConfigContext.Provider>
  )
}

export function useLiquidConfig() {
  const ctx = useContext(LiquidConfigContext)
  if (!ctx) throw new Error('useLiquidConfig must be used within LiquidConfigProvider')
  return ctx
}
