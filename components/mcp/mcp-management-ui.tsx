'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Check, 
  X, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Calendar,
  Database,
  Folder,
  Github,
  Search
} from 'lucide-react'
import { loadMCPConfig, saveMCPConfig, toggleMCPServer, type MCPConfig, type MCPServer } from '@/lib/mcp/mcp-manager'

const iconMap: Record<string, any> = {
  '📅': Calendar,
  '🗄️': Database,
  '📁': Folder,
  '🐙': Github,
  '🔍': Search
}

export function MCPManagementUI() {
  const [config, setConfig] = useState<MCPConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const loadedConfig = await loadMCPConfig()
      setConfig(loadedConfig)
    } catch (error) {
      console.error('Error loading MCP config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleServer = async (serverId: string, enabled: boolean) => {
    if (!config) return

    setSaving(true)
    try {
      // Update local state
      const newConfig = {
        ...config,
        mcpServers: {
          ...config.mcpServers,
          [serverId]: {
            ...config.mcpServers[serverId],
            enabled
          }
        }
      }

      // Save to backend
      const success = await saveMCPConfig(newConfig)
      if (success) {
        setConfig(newConfig)
        console.log(`✅ ${serverId} ${enabled ? 'enabled' : 'disabled'}`)
      }
    } catch (error) {
      console.error('Error toggling server:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadConfig()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load MCP configuration</p>
          <Button onClick={loadConfig} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const serverCount = Object.keys(config.mcpServers).length
  const enabledCount = Object.values(config.mcpServers).filter(s => s.enabled).length

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-2 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <span>MCP Server Status</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription>
            {enabledCount} of {serverCount} servers active • Version {config.version}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* MCP Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(config.mcpServers).map(([id, server]) => (
          <MCPServerCard
            key={id}
            id={id}
            server={server}
            onToggle={handleToggleServer}
            disabled={saving}
          />
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <span>About MCP Servers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            MCP (Model Context Protocol) servers provide external tools and capabilities to your AI assistants.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Calendar:</strong> Create and manage events with natural language</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Database:</strong> Query and update your Supabase data</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Web Search:</strong> Get real-time information from the web</span>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Toggle servers on/off to control which tools your AI assistants can access. Some servers require
              authentication (OAuth) before they can be used.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MCPServerCard({
  id,
  server,
  onToggle,
  disabled
}: {
  id: string
  server: MCPServer
  onToggle: (id: string, enabled: boolean) => void
  disabled: boolean
}) {
  const Icon = iconMap[server.icon] || Settings
  const statusColor = server.enabled ? 'text-green-600' : 'text-gray-400'
  const bgColor = server.enabled 
    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'

  return (
    <Card className={`border-2 ${bgColor} transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${server.enabled ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Icon className={`h-6 w-6 ${statusColor}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {server.name}
                {server.type === 'oauth' && (
                  <Badge variant="secondary" className="text-xs">OAuth</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {server.description}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={server.enabled}
            onCheckedChange={(checked) => onToggle(id, checked)}
            disabled={disabled}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Capabilities */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {server.capabilities.map((cap) => (
                <Badge 
                  key={cap} 
                  variant="outline" 
                  className="text-xs"
                >
                  {cap.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              {server.enabled ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Active</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Inactive</span>
                </>
              )}
            </div>
            {server.type === 'oauth' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // TODO: Handle OAuth connection
                  alert(`Connect to ${server.name} - Coming soon!`)
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}






















