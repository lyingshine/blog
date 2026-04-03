import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'
import { loadEnv } from 'vite'

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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devBackendTarget = env.VITE_DEV_BACKEND || 'http://127.0.0.1:3000'

  return {
    plugins: [vue()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion)
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: devBackendTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: devBackendTarget,
          changeOrigin: true
        }
      }
    }
  }
})
