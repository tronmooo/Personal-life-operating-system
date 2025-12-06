/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'life-hub.me', 'www.life-hub.me'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      }
    ]
  },
  // Request size limits
  api: {
    bodyParser: {
      sizeLimit: '1mb' // API routes limited to 1MB
    },
    responseLimit: '4mb' // Response size limit
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Server actions limited to 2MB
      allowedOrigins: [
        'localhost:3000', 
        'localhost:3001',
        'life-hub.me',
        'www.life-hub.me',
      ],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig


