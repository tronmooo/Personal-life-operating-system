import { NextResponse } from 'next/server'

/**
 * In-memory storage for call logs
 * Note: This will reset when the server restarts
 * For production, use a database
 */
let callLogs = []

/**
 * POST /api/calls
 * Store a new call log
 * 
 * Body: {
 *   callId: string,
 *   to: string (phone number or business name),
 *   status: string (initiated, ringing, connected, completed, failed),
 *   timestamp: string (ISO date),
 *   duration?: number (seconds),
 *   notes?: string
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    
    const callLog = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callId: body.callId || `vapi_${Date.now()}`,
      to: body.to || 'Unknown',
      status: body.status || 'initiated',
      timestamp: body.timestamp || new Date().toISOString(),
      duration: body.duration || 0,
      notes: body.notes || '',
      metadata: body.metadata || {}
    }

    // Add to in-memory storage
    callLogs.unshift(callLog) // Add to beginning (most recent first)

    // Keep only last 100 calls
    if (callLogs.length > 100) {
      callLogs = callLogs.slice(0, 100)
    }

    console.log('📞 Call log saved:', callLog.id, callLog.to, callLog.status)

    return NextResponse.json({
      success: true,
      call: callLog,
      message: 'Call log saved successfully'
    })

  } catch (error) {
    console.error('Error saving call log:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save call log' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/calls
 * Retrieve all call logs
 * 
 * Query params:
 *   ?limit=10 - Limit number of results
 *   ?status=completed - Filter by status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || callLogs.length
    const statusFilter = searchParams.get('status')

    let filteredLogs = callLogs

    // Filter by status if provided
    if (statusFilter) {
      filteredLogs = callLogs.filter(log => log.status === statusFilter)
    }

    // Apply limit
    const results = filteredLogs.slice(0, limit)

    return NextResponse.json({
      success: true,
      count: results.length,
      total: callLogs.length,
      calls: results
    })

  } catch (error) {
    console.error('Error retrieving call logs:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to retrieve call logs' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calls
 * Clear all call logs (useful for testing)
 */
export async function DELETE(request) {
  const count = callLogs.length
  callLogs = []
  
  return NextResponse.json({
    success: true,
    message: `Cleared ${count} call logs`,
    cleared: count
  })
}







