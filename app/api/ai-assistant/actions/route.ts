import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Action types the AI can perform
type AIAction = 
  | 'delete' | 'update' | 'bulk_delete' | 'bulk_update'
  | 'export' | 'analyze' | 'predict' | 'correlate'
  | 'execute_code' | 'generate_report' | 'find_duplicates'
  | 'archive' | 'restore'
  | 'create_task' | 'create_habit' | 'create_bill' | 'create_event'
  | 'create_entry' | 'navigate' | 'open_tool' | 'custom_chart'
  | 'add_to_google_calendar'

interface ActionRequest {
  action: AIAction
  domain: string
  parameters: Record<string, any>
  confirmation?: boolean
  confirmationId?: string
}

// Store pending actions temporarily (in production, use Redis or DB)
const pendingActions = new Map<string, { action: AIAction; domain: string; params: any; userId: string; expires: number }>()

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ActionRequest = await request.json()
    const { action, domain, parameters, confirmation, confirmationId } = body

    // Use request origin + forward cookies for any internal API calls.
    // This avoids relying on NEXT_PUBLIC_APP_URL (often misconfigured in prod).
    const baseUrl = request.nextUrl.origin
    const cookieHeader = request.headers.get('cookie') || ''

    console.log(`🤖 AI Action Request: ${action} on ${domain}`, parameters)

    // Handle confirmation of pending action
    if (confirmation && confirmationId) {
      const pending = pendingActions.get(confirmationId)
      if (!pending || pending.userId !== user.id || pending.expires < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired confirmation' }, { status: 400 })
      }
      pendingActions.delete(confirmationId)
      // Execute the confirmed action
      return executeAction(supabase, user.id, pending.action, pending.domain, pending.params, true, baseUrl, cookieHeader)
    }

    // Route to appropriate handler
    return executeAction(supabase, user.id, action, domain, parameters, false, baseUrl, cookieHeader)
  } catch (error: any) {
    console.error('❌ AI Action error:', error)
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 })
  }
}

async function executeAction(
  supabase: any,
  userId: string,
  action: AIAction,
  domain: string,
  params: any,
  confirmed: boolean,
  baseUrl: string,
  cookieHeader: string
) {
  switch (action) {
    case 'delete':
      return handleDelete(supabase, userId, domain, params, confirmed)
    case 'update':
      return handleUpdate(supabase, userId, domain, params)
    case 'bulk_delete':
      return handleBulkDelete(supabase, userId, domain, params, confirmed)
    case 'bulk_update':
      return handleBulkUpdate(supabase, userId, domain, params, confirmed)
    case 'export':
      return handleExport(supabase, userId, domain, params)
    case 'analyze':
      return handleAnalyze(supabase, userId, domain, params)
    case 'predict':
      return handlePredict(supabase, userId, domain, params)
    case 'correlate':
      return handleCorrelate(supabase, userId, params)
    case 'execute_code':
      return handleCodeExecution(params)
    case 'generate_report':
      return handleReportGeneration(supabase, userId, domain, params)
    case 'find_duplicates':
      return handleFindDuplicates(supabase, userId, domain, params)
    case 'archive':
      return handleArchive(supabase, userId, domain, params, confirmed)
    case 'restore':
      return handleRestore(supabase, userId, domain, params)
    case 'create_task':
      return handleCreateTask(supabase, userId, params)
    case 'create_habit':
      return handleCreateHabit(supabase, userId, params)
    case 'create_bill':
      return handleCreateBill(supabase, userId, params)
    case 'create_event':
      return handleCreateEvent(supabase, userId, params)
    case 'create_entry':
      return handleCreateEntry(supabase, userId, domain, params)
    case 'navigate':
      return handleNavigate(params)
    case 'open_tool':
      return handleOpenTool(params)
    case 'custom_chart':
      return handleCustomChart(supabase, userId, params)
    case 'add_to_google_calendar':
      return handleAddToGoogleCalendar(supabase, userId, params, baseUrl, cookieHeader)
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}

// ============================================
// DELETE HANDLER - Single entry deletion
// ============================================
async function handleDelete(
  supabase: any, 
  userId: string, 
  domain: string, 
  params: any,
  confirmed: boolean
) {
  const { id, match, dateRange, description } = params

  // Build query to find matching entries
  let query = supabase
    .from('domain_entries')
    .select('id, title, description, metadata, created_at')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (id) {
    query = query.eq('id', id)
  }

  if (match) {
    for (const [key, value] of Object.entries(match)) {
      if (key.startsWith('metadata.')) {
        // Handle JSONB queries
        const metaKey = key.replace('metadata.', '')
        query = query.filter(`metadata->>${metaKey}`, 'eq', value)
      } else {
        query = query.eq(key, value)
      }
    }
  }

  if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  if (description) {
    query = query.or(`title.ilike.%${description}%,description.ilike.%${description}%`)
  }

  const { data: matches, error: findError } = await query.limit(20)

  if (findError) {
    console.error('❌ Find error:', findError)
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({
      success: false,
      message: `No matching entries found in ${domain || 'any domain'}`,
      count: 0
    })
  }

  // If not confirmed, return preview and request confirmation
  if (!confirmed) {
    const confirmationId = crypto.randomUUID()
    pendingActions.set(confirmationId, {
      action: 'delete',
      domain,
      params: { ids: matches.map((m: any) => m.id) },
      userId,
      expires: Date.now() + 5 * 60 * 1000 // 5 minute expiry
    })

    return NextResponse.json({
      requiresConfirmation: true,
      confirmationId,
      message: `Found ${matches.length} entry(ies) to delete`,
      preview: matches.map((m: any) => ({
        id: m.id,
        title: m.title || m.description || 'Untitled',
        date: m.created_at,
        domain: domain,
        metadata: m.metadata
      })),
      action: 'delete'
    })
  }

  // Execute deletion (confirmed)
  const { ids } = params
  const { error: deleteError, count } = await supabase
    .from('domain_entries')
    .delete()
    .eq('user_id', userId)
    .in('id', ids)

  if (deleteError) {
    console.error('❌ Delete error:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Successfully deleted ${ids.length} entry(ies)`,
    count: ids.length
  })
}

// ============================================
// UPDATE HANDLER - Modify existing entries
// ============================================
async function handleUpdate(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { id, match, updates, description, dateRange } = params

  if (!updates || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  // If we have a direct ID, update directly
  if (id) {
    const { data, error } = await supabase
      .from('domain_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `✅ Successfully updated entry`,
      data: data?.[0]
    })
  }

  // Find matching entry first
  let query = supabase
    .from('domain_entries')
    .select('id, title, description, metadata, created_at')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (description) {
    query = query.or(`title.ilike.%${description}%,description.ilike.%${description}%`)
  }

  if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  if (match) {
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value)
    }
  }

  const { data: matches, error: findError } = await query.order('created_at', { ascending: false }).limit(1)

  if (findError || !matches || matches.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No matching entry found to update'
    })
  }

  const entryToUpdate = matches[0]

  // Merge metadata updates if provided
  const finalUpdates: any = { updated_at: new Date().toISOString() }
  
  if (updates.title) finalUpdates.title = updates.title
  if (updates.description) finalUpdates.description = updates.description
  
  if (updates.metadata || Object.keys(updates).some(k => !['title', 'description'].includes(k))) {
    const metadataUpdates = updates.metadata || {}
    // Move non-standard fields to metadata
    for (const [key, value] of Object.entries(updates)) {
      if (!['title', 'description', 'metadata'].includes(key)) {
        metadataUpdates[key] = value
      }
    }
    finalUpdates.metadata = {
      ...entryToUpdate.metadata,
      ...metadataUpdates
    }
  }

  const { data, error } = await supabase
    .from('domain_entries')
    .update(finalUpdates)
    .eq('id', entryToUpdate.id)
    .eq('user_id', userId)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Successfully updated: ${entryToUpdate.title || 'entry'}`,
    previousData: entryToUpdate,
    newData: data?.[0]
  })
}

// ============================================
// BULK DELETE HANDLER
// ============================================
async function handleBulkDelete(
  supabase: any,
  userId: string,
  domain: string,
  params: any,
  confirmed: boolean
) {
  const { dateRange, condition, olderThan, status } = params

  let query = supabase
    .from('domain_entries')
    .select('id, title, description, created_at')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  if (olderThan) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThan)
    query = query.lt('created_at', cutoffDate.toISOString())
  }

  if (status) {
    query = query.filter('metadata->>status', 'eq', status)
  }

  const { data: matches, error: findError } = await query.limit(100)

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No matching entries found for bulk deletion',
      count: 0
    })
  }

  if (!confirmed) {
    const confirmationId = crypto.randomUUID()
    pendingActions.set(confirmationId, {
      action: 'bulk_delete',
      domain,
      params: { ids: matches.map((m: any) => m.id) },
      userId,
      expires: Date.now() + 5 * 60 * 1000
    })

    return NextResponse.json({
      requiresConfirmation: true,
      confirmationId,
      message: `⚠️ This will delete ${matches.length} entries`,
      preview: matches.slice(0, 10).map((m: any) => ({
        id: m.id,
        title: m.title || m.description || 'Untitled',
        date: m.created_at
      })),
      totalCount: matches.length,
      action: 'bulk_delete'
    })
  }

  // Execute bulk deletion
  const { ids } = params
  const { error: deleteError } = await supabase
    .from('domain_entries')
    .delete()
    .eq('user_id', userId)
    .in('id', ids)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Successfully deleted ${ids.length} entries`,
    count: ids.length
  })
}

// ============================================
// BULK UPDATE HANDLER
// ============================================
async function handleBulkUpdate(
  supabase: any,
  userId: string,
  domain: string,
  params: any,
  confirmed: boolean
) {
  const { dateRange, condition, updates, status } = params

  if (!updates) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  let query = supabase
    .from('domain_entries')
    .select('id, title')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  if (status) {
    query = query.filter('metadata->>status', 'eq', status)
  }

  const { data: matches, error: findError } = await query.limit(100)

  if (findError || !matches || matches.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No matching entries found'
    })
  }

  if (!confirmed) {
    const confirmationId = crypto.randomUUID()
    pendingActions.set(confirmationId, {
      action: 'bulk_update',
      domain,
      params: { ids: matches.map((m: any) => m.id), updates },
      userId,
      expires: Date.now() + 5 * 60 * 1000
    })

    return NextResponse.json({
      requiresConfirmation: true,
      confirmationId,
      message: `This will update ${matches.length} entries`,
      preview: matches.slice(0, 10),
      totalCount: matches.length,
      updates,
      action: 'bulk_update'
    })
  }

  // Execute bulk update
  const { ids } = params
  const updateData: any = { updated_at: new Date().toISOString() }
  
  if (updates.status) {
    updateData.metadata = supabase.sql`metadata || ${JSON.stringify({ status: updates.status })}::jsonb`
  }

  // For simpler updates, do them one by one to handle metadata merging
  let successCount = 0
  for (const id of ids) {
    const { error } = await supabase
      .from('domain_entries')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) successCount++
  }

  return NextResponse.json({
    success: true,
    message: `✅ Successfully updated ${successCount} entries`,
    count: successCount
  })
}

// ============================================
// EXPORT HANDLER - CSV, JSON, PDF
// ============================================
async function handleExport(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { format = 'json', dateRange, fields } = params

  let query = supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No data to export'
    })
  }

  // Format data based on requested format
  let exportData: string
  let mimeType: string
  let filename: string

  if (format === 'csv') {
    // Generate CSV
    const headers = ['id', 'domain', 'title', 'description', 'created_at', 'updated_at']
    const rows = data.map((entry: any) => 
      headers.map(h => {
        const val = entry[h]
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val || ''
      }).join(',')
    )
    exportData = [headers.join(','), ...rows].join('\n')
    mimeType = 'text/csv'
    filename = `${domain || 'all'}_export_${new Date().toISOString().split('T')[0]}.csv`
  } else {
    // Default to JSON
    exportData = JSON.stringify(data, null, 2)
    mimeType = 'application/json'
    filename = `${domain || 'all'}_export_${new Date().toISOString().split('T')[0]}.json`
  }

  return NextResponse.json({
    success: true,
    message: `✅ Export ready: ${data.length} entries`,
    data: exportData,
    mimeType,
    filename,
    count: data.length
  })
}

// ============================================
// ANALYZE HANDLER - Data analysis
// ============================================
async function handleAnalyze(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { analysisType, dateRange, metric } = params

  let query = supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No data to analyze'
    })
  }

  // Perform analysis based on type
  const analysis: any = {
    totalEntries: data.length,
    dateRange: {
      start: data[0]?.created_at,
      end: data[data.length - 1]?.created_at
    }
  }

  // Calculate domain breakdown
  const domainCounts: Record<string, number> = {}
  data.forEach((entry: any) => {
    domainCounts[entry.domain] = (domainCounts[entry.domain] || 0) + 1
  })
  analysis.domainBreakdown = domainCounts

  // Calculate metric-specific stats if applicable
  if (metric && domain === 'financial') {
    const amounts = data
      .filter((e: any) => e.metadata?.amount)
      .map((e: any) => parseFloat(e.metadata.amount) || 0)
    
    if (amounts.length > 0) {
      analysis.metricStats = {
        total: amounts.reduce((a: number, b: number) => a + b, 0),
        average: amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        count: amounts.length
      }
    }
  }

  if (domain === 'health') {
    const weights = data
      .filter((e: any) => e.metadata?.weight || e.metadata?.value)
      .map((e: any) => parseFloat(e.metadata.weight || e.metadata.value) || 0)
      .filter((w: number) => w > 0)
    
    if (weights.length > 0) {
      analysis.metricStats = {
        latest: weights[weights.length - 1],
        earliest: weights[0],
        change: weights[weights.length - 1] - weights[0],
        average: weights.reduce((a: number, b: number) => a + b, 0) / weights.length,
        min: Math.min(...weights),
        max: Math.max(...weights)
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `📊 Analysis complete for ${domain || 'all domains'}`,
    analysis
  })
}

// ============================================
// PREDICT HANDLER - Forecasting
// ============================================
async function handlePredict(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { metric, targetValue, daysAhead = 30 } = params

  // Fetch historical data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90)

  const { data, error } = await supabase
    .from('domain_entries')
    .select('metadata, created_at')
    .eq('user_id', userId)
    .eq('domain', domain)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data || data.length < 3) {
    return NextResponse.json({
      success: false,
      message: 'Insufficient data for prediction (need at least 3 data points)'
    })
  }

  // Extract numeric values
  const dataPoints = data
    .map((entry: any) => ({
      date: new Date(entry.created_at),
      value: parseFloat(entry.metadata?.weight || entry.metadata?.amount || entry.metadata?.value || 0)
    }))
    .filter((d: { date: Date; value: number }) => d.value > 0)

  if (dataPoints.length < 3) {
    return NextResponse.json({
      success: false,
      message: 'Insufficient numeric data for prediction'
    })
  }

  // Simple linear regression
  const n = dataPoints.length
  const firstDate = dataPoints[0].date.getTime()
  const xValues = dataPoints.map((d: { date: Date; value: number }) => (d.date.getTime() - firstDate) / (1000 * 60 * 60 * 24)) // Days
  const yValues = dataPoints.map((d: { date: Date; value: number }) => d.value)

  const sumX = xValues.reduce((a: number, b: number) => a + b, 0)
  const sumY = yValues.reduce((a: number, b: number) => a + b, 0)
  const sumXY = xValues.reduce((sum: number, x: number, i: number) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum: number, x: number) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate predictions
  const lastDay = xValues[xValues.length - 1]
  const predictions = []
  
  for (let i = 1; i <= daysAhead; i += 7) {
    const futureDay = lastDay + i
    const predictedValue = intercept + slope * futureDay
    const futureDate = new Date(firstDate + futureDay * 24 * 60 * 60 * 1000)
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      value: Math.round(predictedValue * 10) / 10
    })
  }

  // Calculate when target will be reached (if applicable)
  let targetDate = null
  if (targetValue && slope !== 0) {
    const daysToTarget = (targetValue - intercept) / slope - lastDay
    if (daysToTarget > 0) {
      const targetDateObj = new Date(firstDate + (lastDay + daysToTarget) * 24 * 60 * 60 * 1000)
      targetDate = targetDateObj.toISOString().split('T')[0]
    }
  }

  const currentValue = yValues[yValues.length - 1]
  const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
  const weeklyChange = slope * 7

  return NextResponse.json({
    success: true,
    message: `📈 Prediction generated for ${domain}`,
    prediction: {
      currentValue,
      trend,
      weeklyChange: Math.round(weeklyChange * 10) / 10,
      predictions,
      targetValue,
      targetDate,
      confidence: Math.min(0.9, 0.5 + (n / 20) * 0.4), // Higher confidence with more data
      dataPointsUsed: n
    }
  })
}

// ============================================
// CORRELATE HANDLER - Cross-domain analysis
// ============================================
async function handleCorrelate(
  supabase: any,
  userId: string,
  params: any
) {
  const { domain1, metric1, domain2, metric2, dateRange = 'this_month' } = params

  const { start, end } = getDateRange(dateRange)

  // Fetch data from both domains
  const [{ data: data1 }, { data: data2 }] = await Promise.all([
    supabase
      .from('domain_entries')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('domain', domain1)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true }),
    supabase
      .from('domain_entries')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('domain', domain2)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true })
  ])

  if (!data1 || !data2 || data1.length < 3 || data2.length < 3) {
    return NextResponse.json({
      success: false,
      message: 'Insufficient data for correlation analysis'
    })
  }

  // Group data by date and extract values
  const groupByDate = (data: any[], metricKey: string) => {
    const grouped: Record<string, number[]> = {}
    data.forEach((entry: any) => {
      const date = entry.created_at.split('T')[0]
      const value = parseFloat(entry.metadata?.[metricKey] || entry.metadata?.value || entry.metadata?.amount || 0)
      if (value > 0) {
        if (!grouped[date]) grouped[date] = []
        grouped[date].push(value)
      }
    })
    // Average values per day
    return Object.entries(grouped).map(([date, values]) => ({
      date,
      value: values.reduce((a, b) => a + b, 0) / values.length
    }))
  }

  const series1 = groupByDate(data1, metric1)
  const series2 = groupByDate(data2, metric2)

  // Find matching dates
  const commonDates = series1.filter(s1 => series2.some(s2 => s2.date === s1.date))
  
  if (commonDates.length < 3) {
    return NextResponse.json({
      success: false,
      message: 'Not enough overlapping data points for correlation'
    })
  }

  // Calculate Pearson correlation
  const matchedPairs = commonDates.map(s1 => ({
    x: s1.value,
    y: series2.find(s2 => s2.date === s1.date)!.value
  }))

  const n = matchedPairs.length
  const sumX = matchedPairs.reduce((sum, p) => sum + p.x, 0)
  const sumY = matchedPairs.reduce((sum, p) => sum + p.y, 0)
  const sumXY = matchedPairs.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = matchedPairs.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumY2 = matchedPairs.reduce((sum, p) => sum + p.y * p.y, 0)

  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  const strength = 
    Math.abs(correlation) >= 0.7 ? 'strong' :
    Math.abs(correlation) >= 0.4 ? 'moderate' :
    Math.abs(correlation) >= 0.2 ? 'weak' : 'negligible'

  const direction = correlation > 0 ? 'positive' : 'negative'

  // Generate insight
  let insight = ''
  if (Math.abs(correlation) >= 0.4) {
    insight = `There is a ${strength} ${direction} correlation between ${domain1} and ${domain2}. `
    if (correlation > 0) {
      insight += `When ${metric1 || domain1} increases, ${metric2 || domain2} tends to increase as well.`
    } else {
      insight += `When ${metric1 || domain1} increases, ${metric2 || domain2} tends to decrease.`
    }
  } else {
    insight = `There is little to no correlation between ${domain1} and ${domain2} in your data.`
  }

  return NextResponse.json({
    success: true,
    message: `🔗 Correlation analysis complete`,
    correlation: {
      coefficient: Math.round(correlation * 1000) / 1000,
      strength,
      direction,
      dataPoints: n,
      insight,
      scatterData: matchedPairs.map((p, i) => ({
        x: p.x,
        y: p.y,
        date: commonDates[i].date
      }))
    }
  })
}

// ============================================
// CODE EXECUTION HANDLER - Safe sandbox
// ============================================
async function handleCodeExecution(params: any) {
  const { calculation, inputs } = params

  // Pre-defined safe calculations
  const calculations: Record<string, (inputs: any) => any> = {
    compound_interest: (i) => {
      const { principal, rate, years, compoundingFrequency = 12 } = i
      const r = rate / 100
      const n = compoundingFrequency
      const t = years
      const amount = principal * Math.pow(1 + r/n, n * t)
      return {
        principal,
        rate: `${rate}%`,
        years,
        finalAmount: Math.round(amount * 100) / 100,
        interestEarned: Math.round((amount - principal) * 100) / 100
      }
    },
    monthly_payment: (i) => {
      const { principal, annualRate, months } = i
      const r = annualRate / 100 / 12
      const n = months
      const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      return {
        principal,
        annualRate: `${annualRate}%`,
        months,
        monthlyPayment: Math.round(payment * 100) / 100,
        totalPayment: Math.round(payment * n * 100) / 100,
        totalInterest: Math.round((payment * n - principal) * 100) / 100
      }
    },
    savings_goal: (i) => {
      const { targetAmount, monthlyContribution, annualRate = 5 } = i
      const r = annualRate / 100 / 12
      // Using future value of annuity formula: FV = PMT * ((1 + r)^n - 1) / r
      // Solve for n: n = log(FV * r / PMT + 1) / log(1 + r)
      const n = Math.log(targetAmount * r / monthlyContribution + 1) / Math.log(1 + r)
      const months = Math.ceil(n)
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      return {
        targetAmount,
        monthlyContribution,
        annualRate: `${annualRate}%`,
        monthsToGoal: months,
        timeToGoal: `${years} years, ${remainingMonths} months`,
        totalContributed: monthlyContribution * months
      }
    },
    bmi: (i) => {
      const { weight, height, unit = 'imperial' } = i
      let bmi: number
      if (unit === 'imperial') {
        bmi = (weight / (height * height)) * 703
      } else {
        bmi = weight / (height * height)
      }
      const category = 
        bmi < 18.5 ? 'Underweight' :
        bmi < 25 ? 'Normal' :
        bmi < 30 ? 'Overweight' : 'Obese'
      return {
        bmi: Math.round(bmi * 10) / 10,
        category,
        weight,
        height
      }
    },
    calorie_deficit: (i) => {
      const { currentWeight, targetWeight, weeksToGoal, unit = 'lbs' } = i
      const weightToLose = currentWeight - targetWeight
      const poundsPerWeek = weightToLose / weeksToGoal
      const dailyDeficit = poundsPerWeek * 500 // ~3500 calories per pound
      return {
        weightToLose,
        weeksToGoal,
        poundsPerWeek: Math.round(poundsPerWeek * 10) / 10,
        dailyCalorieDeficit: Math.round(dailyDeficit),
        recommendation: dailyDeficit > 1000 ? 
          '⚠️ This pace may be too aggressive. Consider a longer timeline.' :
          '✅ This is a healthy pace for weight loss.'
      }
    }
  }

  if (!calculations[calculation]) {
    return NextResponse.json({
      success: false,
      message: `Unknown calculation type. Available: ${Object.keys(calculations).join(', ')}`
    })
  }

  try {
    const result = calculations[calculation](inputs)
    return NextResponse.json({
      success: true,
      message: `🧮 Calculation complete`,
      result
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Calculation error: ${error.message}`
    })
  }
}

// ============================================
// REPORT GENERATION HANDLER
// ============================================
async function handleReportGeneration(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { reportType, dateRange = 'this_month', title } = params
  const { start, end } = getDateRange(dateRange)

  // Fetch data
  let query = supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true })

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No data available for report generation'
    })
  }

  // Generate report sections
  const report: any = {
    title: title || `${domain?.toUpperCase() || 'Life'} Report`,
    generatedAt: new Date().toISOString(),
    period: { start, end },
    sections: []
  }

  // Summary section
  const domainCounts: Record<string, number> = {}
  data.forEach((entry: any) => {
    domainCounts[entry.domain] = (domainCounts[entry.domain] || 0) + 1
  })

  report.sections.push({
    heading: 'Summary',
    content: `Total entries: ${data.length}\nDomains covered: ${Object.keys(domainCounts).length}\nPeriod: ${start.split('T')[0]} to ${end.split('T')[0]}`
  })

  // Domain-specific sections
  if (domain === 'financial' || !domain) {
    const financialEntries = data.filter((e: any) => e.domain === 'financial')
    if (financialEntries.length > 0) {
      const expenses = financialEntries
        .filter((e: any) => e.metadata?.type === 'expense')
        .reduce((sum: number, e: any) => sum + (parseFloat(e.metadata?.amount) || 0), 0)
      const income = financialEntries
        .filter((e: any) => e.metadata?.type === 'income')
        .reduce((sum: number, e: any) => sum + (parseFloat(e.metadata?.amount) || 0), 0)

      report.sections.push({
        heading: 'Financial Summary',
        content: `Total Income: $${income.toLocaleString()}\nTotal Expenses: $${expenses.toLocaleString()}\nNet: $${(income - expenses).toLocaleString()}\nTransactions: ${financialEntries.length}`
      })
    }
  }

  if (domain === 'health' || !domain) {
    const healthEntries = data.filter((e: any) => e.domain === 'health')
    if (healthEntries.length > 0) {
      const weights = healthEntries
        .filter((e: any) => e.metadata?.weight || e.metadata?.logType === 'weight')
        .map((e: any) => parseFloat(e.metadata?.weight || e.metadata?.value))
        .filter((w: number) => w > 0)

      if (weights.length > 0) {
        report.sections.push({
          heading: 'Health Summary',
          content: `Weight entries: ${weights.length}\nLatest weight: ${weights[weights.length - 1]} lbs\nChange: ${(weights[weights.length - 1] - weights[0]).toFixed(1)} lbs`
        })
      }
    }
  }

  if (domain === 'fitness' || !domain) {
    const fitnessEntries = data.filter((e: any) => e.domain === 'fitness')
    if (fitnessEntries.length > 0) {
      const totalDuration = fitnessEntries
        .reduce((sum: number, e: any) => sum + (parseInt(e.metadata?.duration) || 0), 0)

      report.sections.push({
        heading: 'Fitness Summary',
        content: `Total workouts: ${fitnessEntries.length}\nTotal duration: ${totalDuration} minutes\nAverage per workout: ${Math.round(totalDuration / fitnessEntries.length)} minutes`
      })
    }
  }

  // Activity breakdown
  report.sections.push({
    heading: 'Activity Breakdown',
    content: Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([d, c]) => `${d}: ${c} entries`)
      .join('\n')
  })

  return NextResponse.json({
    success: true,
    message: `📄 Report generated: ${report.title}`,
    report
  })
}

// ============================================
// FIND DUPLICATES HANDLER
// ============================================
async function handleFindDuplicates(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { threshold = 'strict' } = params

  let query = supabase
    .from('domain_entries')
    .select('id, title, description, metadata, created_at, domain')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No data to check for duplicates'
    })
  }

  // Find potential duplicates
  const duplicates: any[] = []
  const seen = new Map<string, any>()

  for (const entry of data) {
    // Generate a key based on content
    const key = threshold === 'strict'
      ? `${entry.domain}-${entry.title}-${JSON.stringify(entry.metadata)}`
      : `${entry.domain}-${entry.title?.toLowerCase().trim()}`

    if (seen.has(key)) {
      duplicates.push({
        original: seen.get(key),
        duplicate: entry
      })
    } else {
      seen.set(key, entry)
    }
  }

  return NextResponse.json({
    success: true,
    message: `🔍 Found ${duplicates.length} potential duplicate(s)`,
    duplicates: duplicates.slice(0, 20), // Limit response size
    totalFound: duplicates.length
  })
}

// ============================================
// ARCHIVE HANDLER
// ============================================
async function handleArchive(
  supabase: any,
  userId: string,
  domain: string,
  params: any,
  confirmed: boolean
) {
  const { dateRange, olderThan } = params

  let query = supabase
    .from('domain_entries')
    .select('id, title')
    .eq('user_id', userId)

  if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  if (olderThan) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThan)
    query = query.lt('created_at', cutoffDate.toISOString())
  } else if (dateRange) {
    const { start, end } = getDateRange(dateRange)
    query = query.gte('created_at', start).lte('created_at', end)
  }

  const { data: matches, error } = await query.limit(100)

  if (error || !matches || matches.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No entries found to archive'
    })
  }

  if (!confirmed) {
    const confirmationId = crypto.randomUUID()
    pendingActions.set(confirmationId, {
      action: 'archive',
      domain,
      params: { ids: matches.map((m: any) => m.id) },
      userId,
      expires: Date.now() + 5 * 60 * 1000
    })

    return NextResponse.json({
      requiresConfirmation: true,
      confirmationId,
      message: `This will archive ${matches.length} entries`,
      preview: matches.slice(0, 10),
      action: 'archive'
    })
  }

  // Mark as archived (update metadata)
  const { ids } = params
  let successCount = 0
  
  for (const id of ids) {
    const { error } = await supabase.rpc('archive_entry', { entry_id: id })
    // Fallback: update metadata
    if (error) {
      await supabase
        .from('domain_entries')
        .update({ 
          metadata: supabase.sql`metadata || '{"archived": true}'::jsonb`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    }
    successCount++
  }

  return NextResponse.json({
    success: true,
    message: `📦 Archived ${successCount} entries`,
    count: successCount
  })
}

// ============================================
// RESTORE HANDLER
// ============================================
async function handleRestore(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { id, ids } = params

  const idsToRestore = ids || (id ? [id] : [])

  if (idsToRestore.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No entries specified to restore'
    })
  }

  let successCount = 0
  
  for (const entryId of idsToRestore) {
    const { error } = await supabase
      .from('domain_entries')
      .update({ 
        metadata: supabase.sql`metadata - 'archived'`,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('user_id', userId)

    if (!error) successCount++
  }

  return NextResponse.json({
    success: true,
    message: `✅ Restored ${successCount} entry(ies)`,
    count: successCount
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getDateRange(range: string): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString()
  let start: Date

  switch (range) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'yesterday':
      start = new Date(now)
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      return { start: start.toISOString(), end: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() }
    case 'this_week':
      start = new Date(now)
      start.setDate(start.getDate() - start.getDay())
      start.setHours(0, 0, 0, 0)
      break
    case 'last_week':
      start = new Date(now)
      start.setDate(start.getDate() - start.getDay() - 7)
      start.setHours(0, 0, 0, 0)
      const lastWeekEnd = new Date(start)
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
      lastWeekEnd.setHours(23, 59, 59, 999)
      return { start: start.toISOString(), end: lastWeekEnd.toISOString() }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: start.toISOString(), end: lastMonthEnd.toISOString() }
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1)
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
      return { start: start.toISOString(), end: lastYearEnd.toISOString() }
    case 'all':
    default:
      start = new Date('2020-01-01')
      break
  }

  return { start: start.toISOString(), end }
}

// ============================================
// CREATE TASK HANDLER
// ============================================
async function handleCreateTask(
  supabase: any,
  userId: string,
  params: any
) {
  const { title, description, priority = 'medium', dueDate, category } = params

  if (!title) {
    return NextResponse.json({
      success: false,
      message: 'Task title is required'
    })
  }

  const taskId = crypto.randomUUID()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      id: taskId,
      user_id: userId,
      title,
      description: description || null,
      completed: false,
      priority,
      due_date: dueDate || null,
      metadata: { category, source: 'ai_assistant' },
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('❌ Task creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Task created: "${title}"${dueDate ? ` (due ${dueDate})` : ''}`,
    data: data?.[0],
    triggerReload: true
  })
}

// ============================================
// CREATE HABIT HANDLER
// ============================================
async function handleCreateHabit(
  supabase: any,
  userId: string,
  params: any
) {
  const { name, icon = '⭐', frequency = 'daily', description } = params

  if (!name) {
    return NextResponse.json({
      success: false,
      message: 'Habit name is required'
    })
  }

  const habitId = crypto.randomUUID()
  const { data, error } = await supabase
    .from('habits')
    .insert({
      id: habitId,
      user_id: userId,
      name,
      icon,
      frequency,
      streak: 0,
      completion_history: [],
      metadata: { description, source: 'ai_assistant' },
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('❌ Habit creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Habit created: "${name}" ${icon} (${frequency})`,
    data: data?.[0],
    triggerReload: true
  })
}

// ============================================
// CREATE BILL HANDLER
// ============================================
async function handleCreateBill(
  supabase: any,
  userId: string,
  params: any
) {
  const { name, amount, dueDate, category, recurring = false, recurrencePeriod } = params

  if (!name || amount === undefined) {
    return NextResponse.json({
      success: false,
      message: 'Bill name and amount are required'
    })
  }

  const billId = crypto.randomUUID()
  const { data, error } = await supabase
    .from('bills')
    .insert({
      id: billId,
      user_id: userId,
      title: name, // bills table uses 'title' not 'name'
      amount: parseFloat(amount),
      due_date: dueDate || new Date().toISOString(),
      status: 'pending', // bills table uses 'status' not 'paid'
      recurring,
      recurrence_period: recurrencePeriod || null,
      category: category || 'other',
      metadata: { source: 'ai_assistant' },
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('❌ Bill creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Bill created: "${name}" - $${amount}${dueDate ? ` (due ${dueDate})` : ''}`,
    data: data?.[0],
    triggerReload: true
  })
}

// ============================================
// CREATE EVENT HANDLER
// ============================================
async function handleCreateEvent(
  supabase: any,
  userId: string,
  params: any
) {
  const { title, date, time, location, description, allDay = false } = params

  if (!title) {
    return NextResponse.json({
      success: false,
      message: 'Event title is required'
    })
  }

  // Build the event_date timestamp
  let eventDate = new Date()
  if (date) {
    eventDate = new Date(date)
  }
  if (time) {
    const [hours, minutes] = time.split(':').map(Number)
    eventDate.setHours(hours || 9, minutes || 0, 0, 0)
  }

  const eventId = crypto.randomUUID()
  const { data, error } = await supabase
    .from('events')
    .insert({
      id: eventId,
      user_id: userId,
      title,
      event_date: eventDate.toISOString(), // events table uses 'event_date' not 'start_date'
      location: location || null,
      description: description || null,
      metadata: { source: 'ai_assistant', allDay, time: time || null },
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('❌ Event creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Event created: "${title}"${date ? ` on ${date}` : ''}${time ? ` at ${time}` : ''}`,
    data: data?.[0],
    triggerReload: true
  })
}

// ============================================
// CREATE DOMAIN ENTRY HANDLER
// ============================================
async function handleCreateEntry(
  supabase: any,
  userId: string,
  domain: string,
  params: any
) {
  const { title, description, metadata = {} } = params

  if (!title) {
    return NextResponse.json({
      success: false,
      message: 'Entry title is required'
    })
  }

  // Get active person ID from user settings
  const { getUserSettings } = await import('@/lib/supabase/user-settings')
  const settings = await getUserSettings()
  const activePersonId = settings?.activePersonId || 
                        settings?.people?.find((p: any) => p.isActive)?.id || 
                        'me'

  const entryId = crypto.randomUUID()
  const { data, error } = await supabase
    .from('domain_entries')
    .insert({
      id: entryId,
      user_id: userId,
      domain,
      title,
      description: description || null,
      metadata: { ...metadata, source: 'ai_assistant' },
      person_id: activePersonId, // 🔧 NEW: Include person_id
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('❌ Entry creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ Created ${domain} entry: "${title}"`,
    data: data?.[0],
    triggerReload: true
  })
}

// ============================================
// NAVIGATE HANDLER - Navigate to pages
// ============================================
async function handleNavigate(params: any) {
  const { destination, path } = params

  // Map common destinations to paths
  const navigationMap: Record<string, string> = {
    // Main pages
    'dashboard': '/',
    'home': '/',
    'command_center': '/',
    
    // Domains
    'health': '/domains/health',
    'fitness': '/domains/fitness',
    'nutrition': '/domains/nutrition',
    'financial': '/domains/financial',
    'finance': '/domains/financial',
    'vehicles': '/domains/vehicles',
    'pets': '/domains/pets',
    'insurance': '/domains/insurance',
    'travel': '/domains/travel',
    'education': '/domains/education',
    'career': '/domains/career',
    'relationships': '/domains/relationships',
    'mindfulness': '/domains/mindfulness',
    'home_domain': '/domains/home',
    'property': '/domains/property',
    'legal': '/domains/legal',
    'appliances': '/domains/appliances',
    'digital': '/domains/digital-life',
    'hobbies': '/domains/hobbies',
    'goals': '/domains/goals',
    
    // Tools
    'tools': '/tools',
    'calculators': '/ai-tools-calculators',
    'ai_tools': '/ai-tools-calculators',
    
    // AI
    'ai': '/ai',
    'ai_chat': '/ai-chat',
    'ai_assistant': '/ai-assistant',
    
    // Other pages
    'settings': '/settings',
    'calendar': '/calendar',
    'documents': '/documents',
    'notifications': '/notifications',
    'activity': '/activity',
    'domains': '/domains',
    'all_domains': '/domains'
  }

  const targetPath = path || navigationMap[destination?.toLowerCase()] || navigationMap['dashboard']

  return NextResponse.json({
    success: true,
    message: `🧭 Navigating to ${destination || targetPath}`,
    navigate: {
      path: targetPath,
      destination
    }
  })
}

// ============================================
// OPEN TOOL HANDLER - Open specific tools
// ============================================
async function handleOpenTool(params: any) {
  const { tool, toolType } = params

  // Map tools to their paths
  const toolMap: Record<string, { path: string; name: string }> = {
    // Calculators
    'bmi': { path: '/ai-tools-calculators?tab=calculators&tool=bmi', name: 'BMI Calculator' },
    'bmi_calculator': { path: '/ai-tools-calculators?tab=calculators&tool=bmi', name: 'BMI Calculator' },
    'calorie': { path: '/ai-tools-calculators?tab=calculators&tool=calorie', name: 'Calorie Calculator' },
    'calorie_calculator': { path: '/ai-tools-calculators?tab=calculators&tool=calorie', name: 'Calorie Calculator' },
    'mortgage': { path: '/ai-tools-calculators?tab=calculators&tool=mortgage', name: 'Mortgage Calculator' },
    'mortgage_calculator': { path: '/ai-tools-calculators?tab=calculators&tool=mortgage', name: 'Mortgage Calculator' },
    'compound_interest': { path: '/ai-tools-calculators?tab=calculators&tool=compound-interest', name: 'Compound Interest Calculator' },
    'retirement': { path: '/ai-tools-calculators?tab=calculators&tool=retirement', name: 'Retirement Calculator' },
    'retirement_calculator': { path: '/ai-tools-calculators?tab=calculators&tool=retirement', name: 'Retirement Calculator' },
    'loan': { path: '/ai-tools-calculators?tab=calculators&tool=loan', name: 'Loan Calculator' },
    'tip': { path: '/ai-tools-calculators?tab=calculators&tool=tip', name: 'Tip Calculator' },
    'net_worth': { path: '/ai-tools-calculators?tab=calculators&tool=net-worth', name: 'Net Worth Calculator' },
    'budget': { path: '/ai-tools-calculators?tab=calculators&tool=budget', name: 'Budget Calculator' },
    
    // AI Tools
    'receipt_scanner': { path: '/ai-tools-calculators?tab=ai-tools&tool=receipt-scanner', name: 'Receipt Scanner' },
    'expense_tracker': { path: '/ai-tools-calculators?tab=ai-tools&tool=expense-tracker', name: 'Smart Expense Tracker' },
    'invoice': { path: '/ai-tools-calculators?tab=ai-tools&tool=invoice', name: 'Invoice Generator' },
    'document_scanner': { path: '/ai-tools-calculators?tab=ai-tools&tool=document-scanner', name: 'Document Scanner' },
    'contract_reviewer': { path: '/ai-tools-calculators?tab=ai-tools&tool=contract-reviewer', name: 'Contract Reviewer' },
    'scheduler': { path: '/ai-tools-calculators?tab=ai-tools&tool=scheduler', name: 'Smart Scheduler' },
    'meal_planner': { path: '/ai-tools-calculators?tab=ai-tools&tool=meal-planner', name: 'AI Meal Planner' },
    'email_assistant': { path: '/ai-tools-calculators?tab=ai-tools&tool=email-assistant', name: 'Email Assistant' },
    'translator': { path: '/ai-tools-calculators?tab=ai-tools&tool=translator', name: 'Translator' },
    
    // Utility
    'currency': { path: '/ai-tools-calculators?tab=utility&tool=currency', name: 'Currency Converter' },
    'unit': { path: '/ai-tools-calculators?tab=utility&tool=unit', name: 'Unit Converter' },
    'timezone': { path: '/ai-tools-calculators?tab=utility&tool=timezone', name: 'Timezone Converter' },
    'password': { path: '/ai-tools-calculators?tab=utility&tool=password', name: 'Password Generator' },
    'qr': { path: '/ai-tools-calculators?tab=utility&tool=qr', name: 'QR Code Generator' },
    'pomodoro': { path: '/ai-tools-calculators?tab=utility&tool=pomodoro', name: 'Pomodoro Timer' }
  }

  const toolKey = tool?.toLowerCase().replace(/\s+/g, '_') || ''
  const toolInfo = toolMap[toolKey] || { path: '/ai-tools-calculators', name: 'Tools' }

  return NextResponse.json({
    success: true,
    message: `🔧 Opening ${toolInfo.name}`,
    openTool: {
      path: toolInfo.path,
      name: toolInfo.name,
      tool: toolKey
    }
  })
}

// ============================================
// CUSTOM CHART HANDLER - Generate charts from any data
// ============================================
async function handleCustomChart(
  supabase: any,
  userId: string,
  params: any
) {
  const { 
    domain, 
    domains,
    chartType = 'line', 
    metric, 
    metrics,
    dateRange = 'this_month',
    title,
    groupBy,
    aggregation = 'sum'
  } = params

  const { start, end } = getDateRange(dateRange)

  // Fetch data
  let query = supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true })

  // Filter by domain(s)
  if (domains && domains.length > 0) {
    query = query.in('domain', domains)
  } else if (domain && domain !== 'all') {
    query = query.eq('domain', domain)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'No data found for the specified criteria'
    })
  }

  // Process data based on chart type and grouping
  let chartData: any[] = []
  let datasetsArray: any[] = []

  if (groupBy === 'domain') {
    // Group by domain for multi-series
    const grouped: Record<string, any[]> = {}
    data.forEach((entry: any) => {
      if (!grouped[entry.domain]) grouped[entry.domain] = []
      grouped[entry.domain].push(entry)
    })

    if (chartType === 'pie' || chartType === 'bar') {
      chartData = Object.entries(grouped).map(([dom, entries]) => ({
        name: dom,
        domain: dom,
        value: entries.length,
        label: `${dom}: ${entries.length}`
      }))
    } else {
      // Multi-line chart
      datasetsArray = Object.entries(grouped).map(([dom, entries]) => ({
        name: dom,
        domain: dom,
        data: entries.map((e: any) => ({
          date: new Date(e.created_at).toLocaleDateString(),
          value: parseFloat(e.metadata?.amount || e.metadata?.value || e.metadata?.weight || 1),
          label: e.title
        }))
      }))
    }
  } else if (groupBy === 'date' || !groupBy) {
    // Group by date
    const byDate: Record<string, { total: number; count: number; entries: any[] }> = {}
    
    data.forEach((entry: any) => {
      const date = new Date(entry.created_at).toLocaleDateString()
      if (!byDate[date]) byDate[date] = { total: 0, count: 0, entries: [] }
      
      const value = parseFloat(entry.metadata?.amount || entry.metadata?.value || entry.metadata?.weight || 1)
      byDate[date].total += value
      byDate[date].count++
      byDate[date].entries.push(entry)
    })

    chartData = Object.entries(byDate).map(([date, stats]) => ({
      date,
      value: aggregation === 'count' ? stats.count : 
             aggregation === 'average' ? stats.total / stats.count : 
             stats.total,
      count: stats.count,
      label: date
    }))
  } else if (groupBy === 'category' || groupBy === 'type') {
    // Group by metadata type/category
    const byCategory: Record<string, number> = {}
    
    data.forEach((entry: any) => {
      const cat = entry.metadata?.type || entry.metadata?.category || entry.domain || 'other'
      byCategory[cat] = (byCategory[cat] || 0) + 
        (aggregation === 'count' ? 1 : parseFloat(entry.metadata?.amount || entry.metadata?.value || 1))
    })

    chartData = Object.entries(byCategory).map(([cat, value]) => ({
      name: cat,
      category: cat,
      value,
      label: `${cat}: ${value}`
    }))
  }

  // Determine best chart type if not specified
  let finalChartType = chartType
  if (chartType === 'auto') {
    if (chartData.length <= 6) finalChartType = 'pie'
    else if (groupBy === 'domain' && datasetsArray.length > 1) finalChartType = 'multi_line'
    else finalChartType = 'line'
  }

  // Build visualization object
  const visualization: any = {
    type: finalChartType,
    title: title || `${domain || 'All'} Data - ${dateRange.replace('_', ' ')}`,
    xAxis: groupBy === 'date' ? 'Date' : groupBy || 'Category',
    yAxis: metric || 'Value',
    config: {
      height: 400,
      showGrid: true,
      showLegend: true
    }
  }

  if (datasetsArray.length > 0) {
    visualization.datasets = datasetsArray
  } else {
    visualization.data = chartData
  }

  return NextResponse.json({
    success: true,
    message: `📊 Chart created: ${visualization.title}`,
    visualization,
    data: chartData.length > 0 ? chartData : datasetsArray,
    stats: {
      totalEntries: data.length,
      dateRange: { start, end },
      domains: Array.from(new Set(data.map((e: any) => e.domain)))
    }
  })
}

// ============================================
// ADD TO GOOGLE CALENDAR HANDLER
// ============================================
async function handleAddToGoogleCalendar(
  supabase: any,
  userId: string,
  params: any,
  baseUrl: string,
  cookieHeader: string
) {
  const { 
    title, 
    summary,
    date, 
    time, 
    duration = 60, // default 60 minutes
    location, 
    description,
    allDay = false,
    endDate,
    endTime,
    reminders,
    message // Natural language message to pass to AI parser
  } = params

  // Use title or summary
  const eventTitle = title || summary
  
  if (!eventTitle && !message) {
    return NextResponse.json({
      success: false,
      message: '❌ Please provide an event title or description'
    })
  }

  try {
    // Get the user's session to get their OAuth token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: '❌ Not signed in. Please sign in to add events to Google Calendar.',
        requiresAuth: true
      })
    }

    const token = session.provider_token
    if (!token) {
      return NextResponse.json({
        success: false,
        message: '📅 Google Calendar not connected. Please sign out and sign back in with Google to enable calendar access.',
        requiresAuth: true
      })
    }

    // If we have a natural language message, use AI to parse it
    if (message && !eventTitle) {
      // Call the AI calendar event creation endpoint
      const calendarResponse = await fetch(
        new URL('/api/ai/create-calendar-event', baseUrl),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cookieHeader ? { Cookie: cookieHeader } : {})
          },
          body: JSON.stringify({ message })
        }
      )
      
      const result = await calendarResponse.json()
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message || `📅 Event added to Google Calendar: "${result.event?.summary}"`,
          event: result.event,
          triggerReload: true
        })
      } else {
        return NextResponse.json({
          success: false,
          message: result.error || '❌ Failed to create calendar event',
          requiresAuth: result.requiresAuth
        })
      }
    }

    // Build the event with provided structured data
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()
    
    // Parse the date
    let eventDate: Date
    if (date) {
      if (date.toLowerCase() === 'today') {
        eventDate = new Date()
      } else if (date.toLowerCase() === 'tomorrow') {
        eventDate = new Date()
        eventDate.setDate(eventDate.getDate() + 1)
      } else {
        eventDate = new Date(date)
      }
    } else {
      eventDate = now
    }
    
    // Set the time
    let startDateTime: string
    let endDateTime: string
    
    if (allDay) {
      // All-day event
      const dateStr = eventDate.toISOString().split('T')[0]
      const endDateStr = endDate ? new Date(endDate).toISOString().split('T')[0] : dateStr
      
      startDateTime = dateStr
      endDateTime = endDateStr
    } else {
      // Timed event
      if (time) {
        const [hours, minutes] = time.split(':').map(Number)
        eventDate.setHours(hours || 9, minutes || 0, 0, 0)
      } else {
        eventDate.setHours(9, 0, 0, 0) // Default to 9 AM
      }
      
      startDateTime = eventDate.toISOString()
      
      // Calculate end time
      if (endTime) {
        const endEventDate = new Date(endDate || eventDate)
        const [hours, minutes] = endTime.split(':').map(Number)
        endEventDate.setHours(hours, minutes, 0, 0)
        endDateTime = endEventDate.toISOString()
      } else {
        const endEventDate = new Date(eventDate.getTime() + duration * 60 * 1000)
        endDateTime = endEventDate.toISOString()
      }
    }

    // Build the calendar event
    const calendarEvent: any = {
      summary: eventTitle,
      description: description || `Created via LifeHub AI Assistant`,
      location: location || undefined,
    }

    if (allDay) {
      calendarEvent.start = { date: startDateTime }
      calendarEvent.end = { date: endDateTime }
    } else {
      calendarEvent.start = { dateTime: startDateTime, timeZone: timezone }
      calendarEvent.end = { dateTime: endDateTime, timeZone: timezone }
    }

    // Add reminders if specified
    if (reminders) {
      calendarEvent.reminders = {
        useDefault: false,
        overrides: Array.isArray(reminders) 
          ? reminders.map((r: any) => ({ method: r.method || 'popup', minutes: r.minutes || 30 }))
          : [{ method: 'popup', minutes: 30 }]
      }
    }

    console.log('📅 Creating Google Calendar event:', calendarEvent)

    // Create the event using Google Calendar API
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      }
    )

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json()
      console.error('❌ Google Calendar API error:', errorData)
      
      if (calendarResponse.status === 401) {
        return NextResponse.json({
          success: false,
          message: '📅 Google Calendar session expired. Please sign out and sign back in to reconnect.',
          requiresAuth: true
        })
      }
      
      return NextResponse.json({
        success: false,
        message: `❌ Failed to create calendar event: ${errorData.error?.message || 'Unknown error'}`
      })
    }

    const createdEvent = await calendarResponse.json()
    
    console.log('✅ Google Calendar event created:', createdEvent.id)

    // Format the response message
    const eventDateFormatted = allDay 
      ? new Date(startDateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : new Date(startDateTime).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

    return NextResponse.json({
      success: true,
      message: `📅 Added to Google Calendar: "${eventTitle}" on ${eventDateFormatted}`,
      event: {
        id: createdEvent.id,
        summary: createdEvent.summary,
        start: createdEvent.start.dateTime || createdEvent.start.date,
        end: createdEvent.end.dateTime || createdEvent.end.date,
        htmlLink: createdEvent.htmlLink,
        location: createdEvent.location
      },
      triggerReload: true
    })

  } catch (error: any) {
    console.error('❌ Google Calendar error:', error)
    return NextResponse.json({
      success: false,
      message: `❌ Failed to add to Google Calendar: ${error.message || 'Unknown error'}`
    })
  }
}

