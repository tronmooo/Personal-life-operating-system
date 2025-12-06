import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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
import { initDevGeolocationStub } from '@/lib/utils/dev-geolocation-stub'

const inter = Inter({ subsets: ['latin'] })

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
}

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <MainNav />
            <div className="px-4 pt-2">
              <BackButtonGuard />
            </div>
            <main className="flex-1">
              {children}
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


