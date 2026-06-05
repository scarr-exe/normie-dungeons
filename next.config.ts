import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.normies.art' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
    ],
  },
}

export default nextConfig