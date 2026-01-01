import type { Metadata, Viewport } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { MainNav } from '@/components/navigation/main-nav'
import { CommandPalette } from '@/components/command-palette'
import { DigitalLifeAssistant } from '@/components/ai/digital-life-assistant'
import { AppEnhancements } from '@/components/app-enhancements'
import { QuickAddWidget } from '@/components/quick-add-widget'
import { WelcomeWizard } from '@/components/onboarding/welcome-wizard'
import { VoiceDataEntry } from '@/components/voice-data-entry'
import { ClientOnlyFloatingButtons } from '@/components/client-only-floating-buttons'
import { NotificationScheduler } from '@/components/notifications/notification-scheduler'
import { BackButtonGuard } from '@/components/ui/back-button-guard'
import { GuestAwareLayout } from '@/components/layout/guest-aware-layout'
import { initDevGeolocationStub } from '@/lib/utils/dev-geolocation-stub'

// Distinctive fonts for a premium feel
const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LifeHub - Personal Life Operating System',
  description: 'A comprehensive life management dashboard for tracking and managing all aspects of personal life',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#667eea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Force dynamic rendering for all pages to prevent static generation errors
// when Supabase env vars are not available during build time
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize geolocation stub in development only (client)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    try { 
      initDevGeolocationStub(); 
    } catch (error) {
      console.error('Failed to initialize dev geolocation stub:', error)
      // Non-critical, continue without stub
    }
  }
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${dmSans.variable}`}>
      <body className={`${dmSans.className} overflow-x-hidden antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]">
            <MainNav />
            <div className="px-4 pt-2">
              <BackButtonGuard />
            </div>
            <main className="flex-1 overflow-x-hidden">
              <GuestAwareLayout>
                {children}
              </GuestAwareLayout>
            </main>
          </div>
          <CommandPalette />
          <ClientOnlyFloatingButtons />
          <NotificationScheduler />
          {/* Voice button now in navigation bar */}
          {/* Removed floating buttons: DigitalLifeAssistant, AppEnhancements, QuickAddWidget, VoiceDataEntry */}
          {/* <WelcomeWizard /> */}
        </Providers>
        </body>
      </html>
    )
  }


