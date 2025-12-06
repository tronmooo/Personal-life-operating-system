'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Link2, CheckCircle2, XCircle, Loader2,
  Settings, Key, RefreshCw, ExternalLink, Search, Copy,
  Star, Info, Clock, Zap, Shield, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { INTEGRATIONS, getAllServices, type IntegrationService } from '@/lib/config/integrations'
import { useIntegrations } from '@/lib/hooks/use-integrations'

export default function ConnectionsPage() {
  const searchParams = useSearchParams()
  const { 
    connections, 
    loading: connectionsLoading, 
    isConnected, 
    getConnection,
    connectWithApiKey,
    initiateOAuth,
    disconnect,
    syncProvider,
    refresh
  } = useIntegrations()

  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | '1' | '2' | '3'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all')
  const [activeTab, setActiveTab] = useState('financial')

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider')

    if (success === 'connected' && provider) {
      toast.success(`Successfully connected to ${provider}!`)
      refresh()
    }

    if (error) {
      toast.error(`Connection failed: ${error}`)
    }
  }, [searchParams, refresh])

  const handleConnect = (service: IntegrationService) => {
    setSelectedService(service)
    setApiKey('')
    setShowConnectDialog(true)
  }

  const handleShowSetup = (service: IntegrationService) => {
    setSelectedService(service)
    setShowSetupDialog(true)
  }

  const handleDisconnect = async (serviceId: string) => {
    try {
      await disconnect(serviceId)
    } catch (error) {
      // Error already handled by hook
    }
  }

  const confirmConnect = async () => {
    if (!selectedService) return

    setIsConnecting(true)
    try {
      if (selectedService.authType === 'api_key') {
        if (!apiKey.trim()) {
          toast.error('Please enter an API key')
          return
        }
        await connectWithApiKey(selectedService.id, apiKey, {
          service_name: selectedService.name,
          category: selectedService.category,
        })
      } else if (selectedService.authType === 'oauth') {
        // Special handling for built-in OAuth (Google services)
        if (selectedService.oauthUrl === 'built-in') {
          toast.info('This service uses your Google Sign-In. It should already be connected!')
          // For Google services, we just mark as connected
          await connectWithApiKey(selectedService.id, 'google-oauth-connected', {
            service_name: selectedService.name,
            category: selectedService.category,
            uses_google_oauth: true,
          })
        } else if (selectedService.oauthUrl === 'plaid-link') {
          // Redirect to finance page for Plaid
          toast.info('Redirecting to Plaid Link...')
          window.location.href = '/finance?connect=plaid'
          return
        } else {
          // Initiate OAuth flow
          initiateOAuth(selectedService.id, {
            ...selectedService,
            oauthUrl: selectedService.oauthUrl!,
            scopes: selectedService.scopes,
          } as any)
          return // Don't close dialog - we're redirecting
        }
      }

      setShowConnectDialog(false)
      setSelectedService(null)
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async (serviceId: string) => {
    try {
      await syncProvider(serviceId)
    } catch (error) {
      // Error handled by hook
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getTierColor = (tier: number) => {
    switch(tier) {
      case 1: return 'bg-emerald-500'
      case 2: return 'bg-amber-500'
      case 3: return 'bg-sky-500'
      default: return 'bg-gray-500'
    }
  }

  const getTierLabel = (tier: number) => {
    switch(tier) {
      case 1: return 'Essential'
      case 2: return 'Recommended'
      case 3: return 'Enhanced'
      default: return 'Specialized'
    }
  }

  const getTotalConnected = () => {
    return connections.filter(c => c.status === 'active').length
  }

  const getTier1Connected = () => {
    const tier1Services = getAllServices().filter(s => s.tier === 1)
    return tier1Services.filter(s => isConnected(s.id)).length
  }

  const getAutoSyncEnabled = () => {
    return connections.filter(c => c.metadata?.auto_sync !== false).length
  }

  const filterServices = (services: IntegrationService[]) => {
    return services.filter(service => {
      const matchesSearch = searchQuery === '' || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTier = tierFilter === 'all' || service.tier.toString() === tierFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'connected' && isConnected(service.id)) ||
        (statusFilter === 'disconnected' && !isConnected(service.id))
      return matchesSearch && matchesTier && matchesStatus
    })
  }

  const getConnectionStatus = (serviceId: string): { status: string; lastSync?: string } => {
    const conn = getConnection(serviceId)
    if (!conn) return { status: 'disconnected' }
    
    return {
      status: conn.status,
      lastSync: conn.last_synced ? new Date(conn.last_synced).toLocaleString() : undefined,
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Link2 className="h-6 w-6" />
            </div>
            External Connections
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your accounts and automate data sync across domains
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2 font-semibold">
            {getTotalConnected()} Connected
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={connectionsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${connectionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{getTotalConnected()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active integrations</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Essential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{getTier1Connected()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {getAllServices().filter(s => s.tier === 1).length} must-have services
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              Auto-Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{getAutoSyncEnabled()}</div>
            <p className="text-xs text-muted-foreground mt-1">Enabled connections</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {getAllServices().length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total integrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Notice */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Setup Required</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Most integrations require API keys or OAuth app credentials. Click the <Info className="h-3 w-3 inline" /> icon on any integration to see setup instructions.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={(v: any) => setTierFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="1">Tier 1 - Essential</SelectItem>
                <SelectItem value="2">Tier 2 - Recommended</SelectItem>
                <SelectItem value="3">Tier 3 - Enhanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Integrations by Domain */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-2 h-auto bg-transparent">
          {Object.entries(INTEGRATIONS).map(([key, domain]) => {
            const Icon = domain.icon
            const connected = domain.services.filter(s => isConnected(s.id)).length
            return (
              <TabsTrigger 
                key={key} 
                value={key} 
                className="flex-col gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{domain.name.split(' ')[0]}</span>
                {connected > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {connected}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(INTEGRATIONS).map(([key, domain]) => (
          <TabsContent key={key} value={key} className="space-y-4 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-2.5 rounded-xl" 
                style={{ backgroundColor: `${domain.color}20` }}
              >
                {React.createElement(domain.icon, { 
                  className: 'h-6 w-6', 
                  style: { color: domain.color } 
                })}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{domain.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {filterServices(domain.services).length} integrations available
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filterServices(domain.services).map(service => {
                const connected = isConnected(service.id)
                const { lastSync } = getConnectionStatus(service.id)
                
                return (
                  <Card 
                    key={service.id} 
                    className={`transition-all ${
                      connected 
                        ? 'border-green-400 dark:border-green-600 shadow-green-100 dark:shadow-green-900/20 shadow-md' 
                        : 'hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <Badge className={`${getTierColor(service.tier)} text-white text-xs`}>
                              {getTierLabel(service.tier)}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => handleShowSetup(service)}
                                  >
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View setup instructions</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <CardDescription className="text-sm">
                            {service.description}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {service.authType === 'oauth' ? '🔐 OAuth' : '🔑 API Key'}
                            </Badge>
                            {connected && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.features.slice(0, 4).map((feature, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {service.features.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{service.features.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {connected && lastSync && (
                        <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last synced: {lastSync}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        {!connected ? (
                          <Button
                            onClick={() => handleConnect(service)}
                            className="flex-1"
                            size="sm"
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleSync(service.id)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync Now
                            </Button>
                            <Button
                              onClick={() => handleDisconnect(service.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {service.website && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(service.website, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Connect {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedService?.authType === 'oauth'
                ? selectedService?.oauthUrl === 'built-in'
                  ? 'This service uses your Google account. Click connect to enable it.'
                  : 'You will be redirected to authorize this connection.'
                : 'Enter your API key to connect this service.'}
            </DialogDescription>
          </DialogHeader>

          {selectedService?.authType === 'api_key' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key will be stored securely and encrypted.
                </p>
              </div>

              {selectedService?.developerPortal && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    <strong>Where to get your API key:</strong>
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => window.open(selectedService.developerPortal, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {selectedService.developerPortal}
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedService?.authType === 'oauth' && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                      Secure OAuth Connection
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {selectedService?.oauthUrl === 'built-in'
                        ? 'This integration uses your existing Google Sign-In credentials.'
                        : `You'll be redirected to ${selectedService?.name} to authorize access. You can revoke access at any time.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Instructions Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup: {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              Follow these instructions to configure this integration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Auth Type */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedService?.authType === 'oauth' ? '🔐 OAuth' : '🔑 API Key'}
              </Badge>
              <Badge variant="outline">
                {selectedService?.pricing === 'free' && '✅ Free'}
                {selectedService?.pricing === 'freemium' && '💳 Freemium'}
                {selectedService?.pricing === 'paid' && '💰 Paid'}
              </Badge>
            </div>

            {/* Setup Guide */}
            {selectedService?.setupGuide && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setup Instructions</Label>
                <div className="p-3 rounded-lg bg-muted text-sm">
                  {selectedService.setupGuide}
                </div>
              </div>
            )}

            {/* Developer Portal */}
            {selectedService?.developerPortal && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Developer Portal</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedService.developerPortal} 
                    readOnly 
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(selectedService.developerPortal!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(selectedService.developerPortal, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Environment Variables */}
            {(selectedService?.clientIdEnv || selectedService?.clientSecretEnv || selectedService?.apiKeyEnv) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Required Environment Variables</Label>
                <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-xs space-y-1">
                  {selectedService.clientIdEnv && (
                    <div className="flex items-center justify-between">
                      <span>{selectedService.clientIdEnv}=your_client_id</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`${selectedService.clientIdEnv}=`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {selectedService.clientSecretEnv && (
                    <div className="flex items-center justify-between">
                      <span>{selectedService.clientSecretEnv}=your_client_secret</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`${selectedService.clientSecretEnv}=`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {selectedService.apiKeyEnv && (
                    <div className="flex items-center justify-between">
                      <span>{selectedService.apiKeyEnv}=your_api_key</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`${selectedService.apiKeyEnv}=`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add these to your <code className="bg-muted px-1 rounded">.env.local</code> file
                </p>
              </div>
            )}

            {/* OAuth Scopes */}
            {selectedService?.scopes && selectedService.scopes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Required OAuth Scopes</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedService.scopes.map((scope, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowSetupDialog(false)
              if (selectedService) handleConnect(selectedService)
            }}>
              Connect Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
