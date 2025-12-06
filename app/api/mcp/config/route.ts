import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), '.mcp', 'config.json')

/**
 * GET /api/mcp/config
 * Load MCP configuration
 */
export async function GET() {
  try {
    console.log('📁 Loading MCP config from:', CONFIG_PATH)
    
    // Check if file exists
    try {
      await fs.access(CONFIG_PATH)
      const configData = await fs.readFile(CONFIG_PATH, 'utf-8')
      const config = JSON.parse(configData)
      console.log('✅ MCP config loaded successfully')
      return NextResponse.json(config)
    } catch (fileError) {
      console.log('⚠️ MCP config file not found, returning default')
      // Return default config if file doesn't exist
      const defaultConfig = getDefaultConfig()
      
      // Try to create the file
      try {
        const mcpDir = path.join(process.cwd(), '.mcp')
        await fs.mkdir(mcpDir, { recursive: true })
        await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8')
        console.log('✅ Created default MCP config file')
      } catch (createError) {
        console.warn('Could not create MCP config file:', createError)
      }
      
      return NextResponse.json(defaultConfig)
    }
  } catch (error) {
    console.error('❌ Error loading MCP config:', error)
    return NextResponse.json(getDefaultConfig())
  }
}

function getDefaultConfig() {
  return {
    mcpServers: {
      'google-calendar': {
        name: 'Google Calendar',
        description: 'Create, read, and manage Google Calendar events',
        enabled: true,
        type: 'oauth',
        icon: '📅',
        capabilities: ['create_event', 'read_events', 'update_event', 'delete_event', 'search_events'],
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
        capabilities: ['query_table', 'insert_data', 'update_data', 'delete_data', 'execute_rpc'],
        config: {
          useEnvKey: true
        }
      },
      'file-system': {
        name: 'File System',
        description: 'Read and write files in the workspace',
        enabled: false,
        type: 'local',
        icon: '📁',
        capabilities: ['read_file', 'write_file', 'list_directory', 'search_files'],
        config: {
          restrictedPaths: [
            '/Users/robertsennabaum/new project/public',
            '/Users/robertsennabaum/new project/docs'
          ]
        }
      },
      'github': {
        name: 'GitHub',
        description: 'Manage GitHub repositories, issues, and pull requests',
        enabled: false,
        type: 'oauth',
        icon: '🐙',
        capabilities: ['create_issue', 'list_repositories', 'create_pr', 'commit_files'],
        config: {
          scopes: ['repo', 'read:user']
        }
      },
      'web-search': {
        name: 'Web Search',
        description: 'Search the web for real-time information',
        enabled: true,
        type: 'api',
        icon: '🔍',
        capabilities: ['web_search', 'fetch_url', 'summarize_content'],
        config: {
          provider: 'tavily',
          useEnvKey: true
        }
      }
    },
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  }
}

/**
 * POST /api/mcp/config
 * Save MCP configuration
 */
export async function POST(request: Request) {
  try {
    const config = await request.json()
    
    // Update lastUpdated timestamp
    config.lastUpdated = new Date().toISOString()
    
    // Ensure .mcp directory exists
    const mcpDir = path.join(process.cwd(), '.mcp')
    try {
      await fs.access(mcpDir)
    } catch {
      await fs.mkdir(mcpDir, { recursive: true })
    }
    
    // Write config file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
    
    console.log('✅ MCP config saved successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error saving MCP config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

