'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, BarChart3, Zap, Sparkles, Upload, LogOut, LogIn, User as UserIcon, Settings, Plug, Brain, Phone, Users, History, Calendar, Menu, X } from 'lucide-react'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    const subscription = authListener?.data?.subscription

    return () => subscription?.unsubscribe()
  }, [supabase])

  if (!mounted) return null

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-2 sm:px-4 lg:px-8">
        {/* Mobile Menu Button - Only visible on mobile */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 glass-strong border-border/50">
            <SheetHeader>
              <SheetTitle className="text-foreground flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg glow-pulse">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-[family-name:var(--font-display)] text-xl gradient-text">LifeHub</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                      'animate-fade-in-up animate-fill-both',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      'p-2 rounded-lg transition-colors',
                      isActive ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                )
              })}
              
              {/* Quick Actions in Mobile Menu */}
              <div className="pt-6 mt-6 border-t border-border/50">
                <p className="px-4 text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Quick Actions</p>
                <SmartUploadDialog
                  domain="miscellaneous"
                  trigger={
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-orange-500 hover:bg-orange-500/10 transition-all duration-300 group"
                    >
                      <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Upload Document</span>
                    </button>
                  }
                  onComplete={(document) => {
                    console.log('✅ Document uploaded:', document)
                    setMobileMenuOpen(false)
                    window.location.reload()
                  }}
                />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setShowAssistant(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Brain className="h-4 w-4" />
                  </div>
                  <span className="font-medium">AI Assistant</span>
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        
        {/* Logo - Always visible */}
        <Link href="/" className="relative flex-shrink-0 group">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-primary/30 group-hover:shadow-xl group-hover:scale-105">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background shadow-sm">
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
        </Link>
        
        {/* Main Navigation Tabs - Hidden on mobile, visible on desktop */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 p-1.5 rounded-2xl bg-muted/50 border border-border/50">
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
                  'relative flex items-center justify-center p-2.5 lg:p-3 rounded-xl transition-all duration-300 group',
                  isActive
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 lg:h-5 lg:w-5 transition-transform duration-300',
                  !isActive && 'group-hover:scale-110'
                )} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Side Actions - Compact on mobile */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Active person badge - Compact on mobile */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 rounded-xl border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/50 px-2 sm:px-3 transition-all duration-300"
            onClick={() => setShowManagePeople(true)}
            disabled={personLoading}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                {(activePerson?.name || 'Me').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Person</span>
                <span className="text-sm font-semibold">
                  {activePerson?.name || 'Me'}
                </span>
              </div>
            </div>
          </Button>

          {/* Upload Document Button - Always visible, more prominent on mobile */}
          <SmartUploadDialog
            domain="miscellaneous"
            trigger={
              <Button
                variant="ghost"
                size="icon"
                title="Upload Document"
                className="flex-shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-500 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
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
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary hover:from-primary/30 hover:to-purple-500/30 border border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
          >
            <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* AI Concierge Button */}
          <Button
            variant="ghost"
            size="icon"
            title="AI Concierge"
            onClick={() => setShowConcierge(true)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-500 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Notification Bell */}
          <div className="hidden sm:block">
            <NotificationHub />
          </div>

          {/* Profile Picture with Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${user ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25' : 'border-muted bg-gradient-to-br from-muted to-muted-foreground/20 hover:border-muted-foreground/30'} flex items-center justify-center cursor-pointer`}>
                <span className="text-white font-bold text-xs sm:text-sm">{userInitial}</span>
                {user && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-background" />
                )}
              </button>
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
                <Link href="/auth/signin">
                  <DropdownMenuItem>
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Sign In</span>
                  </DropdownMenuItem>
                </Link>
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
