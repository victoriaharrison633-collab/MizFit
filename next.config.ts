import path from 'node:path'
import type { NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * The Supabase project origin has to be reachable from the browser (auth, REST,
 * realtime), so it is named explicitly in connect-src rather than widening the
 * directive to a wildcard.
 */
const supabaseOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
})()

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' is required by the Next.js dev server (React Refresh) and is
  // allowed in development only.
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    supabaseOrigin,
    supabaseOrigin ? supabaseOrigin.replace(/^https:/, 'wss:') : null,
    // Dev server websocket for hot reload.
    isProduction ? null : 'ws: http://localhost:*',
  ]
    .filter(Boolean)
    .join(' '),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  isProduction ? 'upgrade-insecure-requests' : null,
]
  .filter(Boolean)
  .join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A lockfile in a parent directory makes Next infer the wrong workspace root
  // and trace the wrong files. Pin the root to this project.
  outputFileTracingRoot: path.resolve(process.cwd()),
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
