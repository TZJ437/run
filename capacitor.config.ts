import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.maozi.liquid.lightglass',
  appName: 'LightGlass',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
