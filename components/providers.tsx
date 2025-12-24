'use client'

import { ThemeProvider } from 'next-themes'
import { DataProvider } from '@/lib/providers/data-provider'
import { InsightsProvider } from '@/lib/providers/insights-provider'
import { AIProvider } from '@/lib/providers/ai-provider'
import { NotificationProvider } from '@/lib/providers/notification-provider'
import { EnhancedDataProvider } from '@/lib/providers/enhanced-data-provider'
import { AuthProvider } from '@/lib/supabase/auth-provider'
import { ShareProvider } from '@/lib/contexts/share-context'
import { ActivePersonProvider } from '@/lib/providers/active-person-provider'

// NOTE: NextAuth SessionProvider removed - Supabase Auth is the primary auth system.
// NextAuth was creating cookies that interfered with Supabase email/password login.
// Google OAuth tokens are stored in user_settings via Supabase Auth callback.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
    </ThemeProvider>
  )
}


