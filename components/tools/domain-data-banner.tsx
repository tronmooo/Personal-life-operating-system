'use client'

/**
 * DomainDataBanner Component
 * 
 * Shows users that their data has been auto-filled from domains
 * and allows them to refresh or view the source data.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { RefreshCw, Sparkles, Database, ChevronDown, ExternalLink, Loader2 } from 'lucide-react'
import type { Domain } from '@/types/domains'
import { DOMAIN_CONFIGS } from '@/types/domains'
import Link from 'next/link'

interface DomainDataBannerProps {
  // Whether data has been auto-filled
  isAutoFilled: boolean
  
  // List of domains that provided data
  relevantDomains: Domain[]
  
  // Domain items count
  domainItems: Record<string, unknown[]>
  
  // Loading state
  loading: boolean
  
  // Refresh function
  onRefresh: () => void
  
  // Compact mode (inline badge)
  compact?: boolean
  
  // Show even if no data
  showEmpty?: boolean
}

const DOMAIN_ICONS: Record<Domain, string> = {
  health: '❤️',
  nutrition: '🥗',
  fitness: '💪',
  financial: '💰',
  home: '🏠',
  vehicles: '🚗',
  insurance: '🛡️',
  services: '⚡',
  appliances: '🔌',
  digital: '💻',
  mindfulness: '🧘',
  pets: '🐾',
  relationships: '👥',
  miscellaneous: '📦',
}

export function DomainDataBanner({
  isAutoFilled,
  relevantDomains,
  domainItems,
  loading,
  onRefresh,
  compact = false,
  showEmpty = false,
}: DomainDataBannerProps) {
  const domainsWithData = relevantDomains.filter(d => (domainItems[d]?.length || 0) > 0)
  const totalItems = Object.values(domainItems).reduce((sum, items) => sum + (items?.length || 0), 0)

  if (!isAutoFilled && !showEmpty && !loading) {
    return null
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-secondary/80"
              onClick={onRefresh}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {isAutoFilled ? 'Auto-Filled' : 'No Data'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isAutoFilled ? (
              <p>Data from {domainsWithData.length} domain(s) - Click to refresh</p>
            ) : (
              <p>Add data to your domains for auto-fill</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
            {loading ? (
              <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
            ) : (
              <Database className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {isAutoFilled ? '🤖 Auto-Fill from Your Data' : 'No Domain Data Found'}
              </span>
              {isAutoFilled && (
                <Badge variant="secondary" className="text-xs">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAutoFilled 
                ? `Populated from ${domainsWithData.length} domain${domainsWithData.length !== 1 ? 's' : ''}`
                : 'Add data to your domains for smart auto-fill'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Domain Details Dropdown */}
          {isAutoFilled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  View Sources
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>Data Sources</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {domainsWithData.map((domain) => (
                  <DropdownMenuItem key={domain} asChild>
                    <Link href={`/domains/${domain}`} className="flex items-center justify-between w-full cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{DOMAIN_ICONS[domain]}</span>
                        <span className="font-medium">
                          {DOMAIN_CONFIGS[domain]?.name || domain}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {domainItems[domain]?.length || 0}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
                {domainsWithData.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2 px-2">
                    No domain data found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Domain Pills */}
      {isAutoFilled && domainsWithData.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
          {domainsWithData.map((domain) => (
            <Link key={domain} href={`/domains/${domain}`}>
              <Badge 
                variant="outline" 
                className="hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer transition-colors"
              >
                {DOMAIN_ICONS[domain]} {DOMAIN_CONFIGS[domain]?.name || domain}
                <span className="ml-1 text-muted-foreground">
                  ({domainItems[domain]?.length || 0})
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State - Suggest Adding Data */}
      {!isAutoFilled && !loading && (
        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <p className="text-sm text-muted-foreground mb-2">
            💡 Tip: Add data to these domains for auto-fill:
          </p>
          <div className="flex flex-wrap gap-2">
            {relevantDomains.slice(0, 4).map((domain) => (
              <Link key={domain} href={`/domains/${domain}`}>
                <Badge 
                  variant="outline" 
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  {DOMAIN_ICONS[domain]} {DOMAIN_CONFIGS[domain]?.name || domain}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DomainDataBanner

