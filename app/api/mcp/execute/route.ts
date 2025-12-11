import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


/**
 * POST /api/mcp/execute
 * Execute an MCP capability
 */
export async function POST(request: Request) {
  try {
    const { serverId, capability, parameters } = await request.json()
    
    console.log(`🔧 MCP Execute: ${serverId}.${capability}`, parameters)
    
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get session for provider token (Google Calendar)
    const { data: { session } } = await supabase.auth.getSession()
    
    // Route to appropriate MCP server handler
    switch (serverId) {
      case 'google-calendar':
        return await handleGoogleCalendarMCP(capability, parameters, session)
      
      case 'supabase-database':
        return await handleSupabaseMCP(capability, parameters, supabase)
      
      case 'web-search':
        return await handleWebSearchMCP(capability, parameters)
      
      default:
        return NextResponse.json(
          { error: `Unknown MCP server: ${serverId}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('❌ MCP execution error:', error)
    return NextResponse.json(
      { error: error.message || 'MCP execution failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle Google Calendar MCP calls
 */
async function handleGoogleCalendarMCP(
  capability: string,
  parameters: any,
  session: any
) {
  const token = session.provider_token
  
  if (!token) {
    return NextResponse.json(
      { error: 'Google Calendar not authorized. Please connect your calendar.' },
      { status: 403 }
    )
  }
  
  switch (capability) {
    case 'create_event': {
      const { summary, start, end, description, location } = parameters
      
      const event = {
        summary,
        description,
        location,
        start: {
          dateTime: start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }
      
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Calendar API error: ${error.error?.message || response.statusText}`)
      }
      
      const createdEvent = await response.json()
      console.log('✅ Calendar event created:', createdEvent.id)
      
      return NextResponse.json({
        success: true,
        event: {
          id: createdEvent.id,
          summary: createdEvent.summary,
          start: createdEvent.start.dateTime || createdEvent.start.date,
          end: createdEvent.end.dateTime || createdEvent.end.date,
          htmlLink: createdEvent.htmlLink
        }
      })
    }
    
    case 'read_events': {
      const { timeMin, timeMax, maxResults = 50 } = parameters
      
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
      url.searchParams.set('timeMin', timeMin || new Date().toISOString())
      if (timeMax) url.searchParams.set('timeMax', timeMax)
      url.searchParams.set('maxResults', maxResults.toString())
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('orderBy', 'startTime')
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      return NextResponse.json({
        success: true,
        events: data.items || []
      })
    }
    
    default:
      return NextResponse.json(
        { error: `Unknown calendar capability: ${capability}` },
        { status: 400 }
      )
  }
}

/**
 * Handle Supabase Database MCP calls
 */
// Whitelist of allowed tables for MCP queries
const ALLOWED_TABLES = [
  'domain_entries',
  'notifications',
  'notification_settings',
  'documents',
  'user_settings',
  'dashboard_layouts',
  'call_history',
  'linked_accounts',
  'transactions',
  'health_metrics',
  'insurance_policies',
  'insurance_claims',
  'pet_profiles',
  'properties',
  'vehicles',
  'appliances',
  'monthly_budgets',
]

async function handleSupabaseMCP(
  capability: string,
  parameters: any,
  supabase: any
) {
  switch (capability) {
    case 'query_table': {
      const { table, filters, limit = 50 } = parameters
      
      // Validate table name against whitelist
      if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json(
          { error: `Forbidden: Table '${table}' is not allowed` },
          { status: 403 }
        )
      }
      
      let query = supabase.from(table).select('*')
      
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value)
        }
      }
      
      query = query.limit(limit)
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(`Database query error: ${error.message}`)
      }
      
      return NextResponse.json({
        success: true,
        data: data || []
      })
    }
    
    case 'insert_data': {
      const { table, values } = parameters
      if (!table || !values) {
        return NextResponse.json(
          { error: 'insert_data requires table and values' },
          { status: 400 }
        )
      }
      // Validate table name against whitelist
      if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json(
          { error: `Forbidden: Table '${table}' is not allowed` },
          { status: 403 }
        )
      }
      const { data, error } = await supabase.from(table).insert(values).select('*')
      if (error) throw new Error(`Database insert error: ${error.message}`)
      return NextResponse.json({ success: true, data })
    }

    case 'update_data': {
      const { table, values, match } = parameters
      if (!table || !values || !match) {
        return NextResponse.json(
          { error: 'update_data requires table, values, and match' },
          { status: 400 }
        )
      }
      // Validate table name against whitelist
      if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json(
          { error: `Forbidden: Table '${table}' is not allowed` },
          { status: 403 }
        )
      }
      let query = supabase.from(table).update(values)
      for (const [key, value] of Object.entries(match)) {
        query = query.eq(key as string, value)
      }
      const { data, error } = await query.select('*')
      if (error) throw new Error(`Database update error: ${error.message}`)
      return NextResponse.json({ success: true, data })
    }

    case 'delete_data': {
      const { table, match } = parameters
      if (!table || !match) {
        return NextResponse.json(
          { error: 'delete_data requires table and match' },
          { status: 400 }
        )
      }
      // Validate table name against whitelist
      if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json(
          { error: `Forbidden: Table '${table}' is not allowed` },
          { status: 403 }
        )
      }
      let query = supabase.from(table).delete()
      for (const [key, value] of Object.entries(match)) {
        query = query.eq(key as string, value)
      }
      const { data, error } = await query.select('*')
      if (error) throw new Error(`Database delete error: ${error.message}`)
      return NextResponse.json({ success: true, data })
    }

    case 'execute_rpc': {
      const { functionName, args } = parameters
      if (!functionName) {
        return NextResponse.json(
          { error: 'execute_rpc requires functionName' },
          { status: 400 }
        )
      }
      const { data, error } = await supabase.rpc(functionName, args || {})
      if (error) throw new Error(`RPC error: ${error.message}`)
      return NextResponse.json({ success: true, data })
    }
    
    default:
      return NextResponse.json(
        { error: `Unknown database capability: ${capability}` },
        { status: 400 }
      )
  }
}

/**
 * Handle Web Search MCP calls
 * Uses Brave Search API if available, otherwise falls back
 */
async function handleWebSearchMCP(
  capability: string,
  parameters: any
) {
  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY
  
  if (!braveApiKey) {
    // Try Tavily as fallback
    const tavilyKey = process.env.TAVILY_API_KEY
    if (tavilyKey && capability === 'web_search') {
      try {
        const { query, count = 10 } = parameters
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            max_results: count,
            include_answer: true
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
            success: true,
            result: {
              web: {
                results: data.results || []
              },
              answer: data.answer
            }
          })
        }
      } catch (error) {
        console.error('Tavily search error:', error)
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Web search requires BRAVE_SEARCH_API_KEY or TAVILY_API_KEY environment variable'
    })
  }
  
  // Use Brave Search
  if (capability === 'web_search') {
    const { query, count = 10 } = parameters
    
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': braveApiKey
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return NextResponse.json({
        success: true,
        result: data
      })
    } catch (error: any) {
      console.error('Brave Search error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      })
    }
  }
  
  return NextResponse.json({
    success: false,
    error: `Unknown web search capability: ${capability}`
  })
}






















