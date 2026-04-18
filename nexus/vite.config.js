import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const newsKey = env.VITE_NEWS_API_KEY || ''
  const anthropicKey = env.VITE_ANTHROPIC_API_KEY || ''
  const twitterToken = env.VITE_TWITTER_BEARER_TOKEN || ''

  const proxy = {
    '/reddit': {
      target: 'https://www.reddit.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/reddit/, ''),
    },
  }

  if (newsKey) {
    proxy['/newsapi'] = {
      target: 'https://newsapi.org/v2',
      changeOrigin: true,
      rewrite: (path) => {
        const q = path.replace(/^\/newsapi/, '') || '/top-headlines'
        const join = q.includes('?') ? '&' : '?'
        return `${q}${join}apiKey=${encodeURIComponent(newsKey)}`
      },
    }
  }

  if (anthropicKey) {
    proxy['/anthropic'] = {
      target: 'https://api.anthropic.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/anthropic/, ''),
      configure: (proxyServer) => {
        proxyServer.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('x-api-key', anthropicKey)
          proxyReq.setHeader('anthropic-version', '2023-06-01')
        })
      },
    }
  }

  if (twitterToken) {
    proxy['/twitterapi'] = {
      target: 'https://api.twitter.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/twitterapi/, ''),
      configure: (proxyServer) => {
        proxyServer.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('Authorization', `Bearer ${twitterToken}`)
        })
      },
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  }
})
