'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, LayoutDashboard, FolderOpen, Wrench, BarChart3, Brain } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DOMAIN_CONFIGS } from '@/types/domains'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search commands, domains, or tools..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => runCommand(() => router.push('/'))}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/domains'))}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Domains</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/tools'))}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
              >
                <Wrench className="h-4 w-4" />
                <span>Tools</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/analytics'))}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/ai-insights'))}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
              >
                <Brain className="h-4 w-4" />
                <span>AI Insights</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Domains">
              {Object.values(DOMAIN_CONFIGS).map((domain) => (
                <Command.Item
                  key={domain.id}
                  onSelect={() => runCommand(() => router.push(`/domains/${domain.id}`))}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
                >
                  <div className={cn('h-2 w-2 rounded-full', domain.color)} />
                  <span>{domain.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}


