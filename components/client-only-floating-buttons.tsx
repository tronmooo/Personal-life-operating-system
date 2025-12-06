'use client'

import dynamic from 'next/dynamic'

// Force client-side only rendering to ensure React hydration works
const FloatingAIButtons = dynamic(
  () => import('./floating-ai-buttons').then(mod => ({ default: mod.FloatingAIButtons })),
  { 
    ssr: false,
    loading: () => null
  }
)

export function ClientOnlyFloatingButtons() {
  return <FloatingAIButtons />
}
















