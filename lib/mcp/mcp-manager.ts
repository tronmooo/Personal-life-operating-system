/**
 * MCP (Model Context Protocol) Manager
 * Manages MCP server configurations and connections
 */

export interface MCPCapability {
  name: string
  description?: string
  parameters?: Record<string, any>
}

export interface MCPServer {
  name: string
  description: string
  enabled: boolean
  type: 'oauth' | 'api' | 'local'
  icon: string
  capabilities: string[]
  config: Record<string, any>
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServer>
  version: string
  lastUpdated: string
}

/**
 * Load MCP configuration from file
 */
export async function loadMCPConfig(): Promise<MCPConfig> {
  try {
    const response = await fetch('/api/mcp/config')
    if (!response.ok) throw new Error('Failed to load MCP config')
    return await response.json()
  } catch (error) {
    console.error('Error loading MCP config:', error)
    return getDefaultConfig()
  }
}

/**
 * Save MCP configuration
 */
export async function saveMCPConfig(config: MCPConfig): Promise<boolean> {
  try {
    const response = await fetch('/api/mcp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    return response.ok
  } catch (error) {
    console.error('Error saving MCP config:', error)
    return false
  }
}

/**
 * Toggle MCP server enabled state
 */
export async function toggleMCPServer(serverId: string, enabled: boolean): Promise<boolean> {
  try {
    const response = await fetch(`/api/mcp/servers/${serverId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    })
    return response.ok
  } catch (error) {
    console.error(`Error toggling MCP server ${serverId}:`, error)
    return false
  }
}

/**
 * Get enabled MCP servers
 */
export function getEnabledServers(config: MCPConfig): Record<string, MCPServer> {
  const enabled: Record<string, MCPServer> = {}
  for (const [id, server] of Object.entries(config.mcpServers)) {
    if (server.enabled) {
      enabled[id] = server
    }
  }
  return enabled
}

/**
 * Get MCP capabilities for AI function calling
 */
export function getMCPCapabilitiesForAI(config: MCPConfig): MCPCapability[] {
  const capabilities: MCPCapability[] = []
  const enabled = getEnabledServers(config)
  
  for (const [serverId, server] of Object.entries(enabled)) {
    for (const capability of server.capabilities) {
      capabilities.push({
        name: `${serverId}_${capability}`,
        description: `${server.name}: ${capability.replace(/_/g, ' ')}`
      })
    }
  }
  
  return capabilities
}

/**
 * Call MCP server capability
 */
export async function callMCPCapability(
  serverId: string,
  capability: string,
  parameters: Record<string, any>
): Promise<any> {
  try {
    const response = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId,
        capability,
        parameters
      })
    })
    
    if (!response.ok) {
      throw new Error(`MCP call failed: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error calling MCP capability ${serverId}.${capability}:`, error)
    throw error
  }
}

/**
 * Default MCP configuration
 */
function getDefaultConfig(): MCPConfig {
  return {
    mcpServers: {
      'google-calendar': {
        name: 'Google Calendar',
        description: 'Create, read, and manage Google Calendar events',
        enabled: true,
        type: 'oauth',
        icon: '📅',
        capabilities: ['create_event', 'read_events', 'update_event', 'delete_event'],
        config: {
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ]
        }
      },
      'supabase-database': {
        name: 'Supabase Database',
        description: 'Query and manage Supabase database tables',
        enabled: true,
        type: 'api',
        icon: '🗄️',
        capabilities: ['query_table', 'insert_data', 'update_data'],
        config: { useEnvKey: true }
      }
    },
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Convert MCP capabilities to OpenAI function definitions
 */
export function mcpCapabilitiesToOpenAIFunctions(config: MCPConfig): any[] {
  const functions: any[] = []
  const enabled = getEnabledServers(config)
  
  // Google Calendar - Create Event
  if (enabled['google-calendar']?.capabilities.includes('create_event')) {
    functions.push({
      name: 'create_calendar_event',
      description: 'Create a new Google Calendar event with specified details',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'The event title/summary'
          },
          start: {
            type: 'string',
            description: 'Start date/time in ISO 8601 format (e.g., 2025-10-20T15:00:00)'
          },
          end: {
            type: 'string',
            description: 'End date/time in ISO 8601 format'
          },
          description: {
            type: 'string',
            description: 'Event description/notes'
          },
          location: {
            type: 'string',
            description: 'Event location'
          }
        },
        required: ['summary', 'start', 'end']
      }
    })
  }
  
  // Supabase - Query Data
  if (enabled['supabase-database']?.capabilities.includes('query_table')) {
    functions.push({
      name: 'query_database',
      description: 'Query data from Supabase database tables',
      parameters: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'The table name to query',
            enum: ['mindfulness_data', 'domains', 'user_settings']
          },
          filters: {
            type: 'object',
            description: 'Filters to apply to the query'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return'
          }
        },
        required: ['table']
      }
    })
  }
  
  return functions
}






















