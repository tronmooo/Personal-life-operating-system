'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, BarChart3, Zap, Sparkles, Upload, LogOut, User as UserIcon, Settings, Plug, Brain, Phone, Users, History, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/lib/utils/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AIAssistantPopupClean } from '@/components/ai-assistant-popup-clean'
import { AIConciergePopup } from '@/components/ai-concierge-popup'
import { ManagePeopleDialog } from '@/components/manage-people-dialog'
import { useActivePerson } from '@/lib/providers/active-person-provider'
import { SmartUploadDialog } from '@/components/documents/smart-upload-dialog'
import { NotificationHub } from '@/components/dashboard/notification-hub'

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Domains', href: '/domains', icon: FolderOpen },
  { name: 'Tools', href: '/tools', icon: Zap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Connections', href: '/connections', icon: Plug },
  { name: 'AI', href: '/ai', icon: Sparkles },
]

export function MainNav() {
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [showConcierge, setShowConcierge] = useState(false)
  const [showManagePeople, setShowManagePeople] = useState(false)
  const { activePerson, isLoading: personLoading } = useActivePerson()

  // Derive user and initial from Supabase session
  const user = session?.user
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    setMounted(true)
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (!mounted) return null

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black">
      <div className="w-full flex h-16 items-center justify-between px-8">
        {/* Logo - Icon Only */}
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-black"></div>
        </div>
        
        {/* Main Navigation Tabs - Icons Only */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={cn(
                  'flex items-center justify-center p-3 rounded-lg transition-all duration-200 border',
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border-transparent'
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">

          {/* Active person badge */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-lg border-teal-500/40 bg-teal-500/5 text-teal-200 hover:bg-teal-500/15 hover:text-white"
            onClick={() => setShowManagePeople(true)}
            disabled={personLoading}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold">
                {(activePerson?.name || 'Me').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs uppercase text-teal-300/80">Person</span>
                <span className="text-sm font-semibold">
                  {activePerson?.name || 'Me'}
                </span>
              </div>
            </div>
          </Button>

          {/* Voice command now integrated into AI Assistant */}

          {/* Upload Document Button */}
          <SmartUploadDialog
            domain="miscellaneous"
            trigger={
              <Button
                variant="ghost"
                size="icon"
                title="Upload Document"
                className="h-10 w-10 rounded-lg bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 hover:text-orange-300 border border-orange-500/30"
              >
                <Upload className="h-5 w-5" />
              </Button>
            }
            onComplete={(document) => {
              console.log('✅ Document uploaded:', document)
              window.location.reload()
            }}
          />

          {/* AI Assistant Button */}
          <Button
            variant="ghost"
            size="icon"
            title="AI Assistant"
            onClick={() => setShowAssistant(true)}
            className="h-10 w-10 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 border border-purple-500/30"
          >
            <Brain className="h-5 w-5" />
          </Button>

          {/* AI Concierge Button */}
          <Button
            variant="ghost"
            size="icon"
            title="AI Concierge"
            onClick={() => setShowConcierge(true)}
            className="h-10 w-10 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 hover:text-cyan-300 border border-cyan-500/30"
          >
            <Phone className="h-5 w-5" />
          </Button>

              {/* Notification Bell */}
              <NotificationHub />

              {/* Profile Picture with Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={`h-10 w-10 rounded-full border-2 ${user ? 'border-green-500 bg-gradient-to-br from-green-600 to-teal-600' : 'border-gray-500 bg-gradient-to-br from-gray-600 to-gray-700'} flex items-center justify-center cursor-pointer hover:border-opacity-80 transition-colors`}>
                    <span className="text-white font-bold text-sm">{userInitial}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user ? user.email : 'Not Signed In'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => setShowManagePeople(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Manage People</span>
                  </DropdownMenuItem>
                  <Link href="/call-history">
                    <DropdownMenuItem>
                      <History className="mr-2 h-4 w-4" />
                      <span>Call History</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/calendar">
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Google Calendar</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  {!user ? (
                    <DropdownMenuItem onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                          queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                          },
                          scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
                        },
                      })
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign In</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={async () => {
                      try {
                        await supabase.auth.signOut()
                        window.location.href = '/'
                      } catch (error) {
                        console.error('Error signing out:', error)
                      }
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
        </div>
      </div>

      {/* SmartUploadDialog is now embedded in the button above */}
    </header>

    {/* AI Popups */}
    <AIAssistantPopupClean open={showAssistant} onOpenChange={setShowAssistant} />
    <AIConciergePopup open={showConcierge} onOpenChange={setShowConcierge} />
    
    {/* Manage People Dialog */}
    <ManagePeopleDialog open={showManagePeople} onOpenChange={setShowManagePeople} />
    
    {/* Toast Notifications */}
    <Toaster richColors position="top-right" />
    </>
  )
}
