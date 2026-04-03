import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

const packageVersion = process.env.npm_package_version || '0.0.0'

const resolveGitShortHash = () => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
}

const appVersion = `v${packageVersion}+${resolveGitShortHash()}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  server: {
    host: '0.0.0.0'
  }
})
