'use client'

import { ThemeProvider } from 'next-themes'
import { DataProvider } from '@/lib/providers/data-provider'
import { InsightsProvider } from '@/lib/providers/insights-provider'
import { AIProvider } from '@/lib/providers/ai-provider'
import { NotificationProvider } from '@/lib/providers/notification-provider'
import { EnhancedDataProvider } from '@/lib/providers/enhanced-data-provider'
import { AuthProvider } from '@/lib/supabase/auth-provider'
import { NextAuthSessionProvider } from '@/components/providers/session-provider'
import { ShareProvider } from '@/lib/contexts/share-context'
import { ActivePersonProvider } from '@/lib/providers/active-person-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextAuthSessionProvider>
        <AuthProvider>
          <ActivePersonProvider>
            <DataProvider>
              <EnhancedDataProvider>
                  <InsightsProvider>
                    <AIProvider>
                      <NotificationProvider>
                        <ShareProvider>
                          {children}
                        </ShareProvider>
                      </NotificationProvider>
                    </AIProvider>
                  </InsightsProvider>
              </EnhancedDataProvider>
            </DataProvider>
          </ActivePersonProvider>
        </AuthProvider>
      </NextAuthSessionProvider>
    </ThemeProvider>
  )
}


