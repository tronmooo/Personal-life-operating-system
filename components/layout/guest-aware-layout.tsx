'use client'

import { ReactNode } from 'react'
import { GuestBanner } from '@/components/auth/guest-banner'
import { usePathname } from 'next/navigation'

interface GuestAwareLayoutProps {
  children: ReactNode
}

// Pages that don't need the guest banner (auth pages, public pages, etc.)
const EXCLUDE_BANNER_PATHS = [
  '/auth',
  '/shared',
  '/offline',
]

export function GuestAwareLayout({ children }: GuestAwareLayoutProps) {
  const pathname = usePathname()
  
  // Check if current path should exclude the banner
  const shouldShowBanner = !EXCLUDE_BANNER_PATHS.some(path => 
    pathname?.startsWith(path)
  )

  return (
    <>
      {shouldShowBanner && (
        <div className="px-4 py-2">
          <GuestBanner />
        </div>
      )}
      {children}
    </>
  )
}
