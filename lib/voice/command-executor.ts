'use client'

import { ParsedCommand } from './command-parser'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { trackEvent } from '@/lib/analytics/event-tracker'

export interface ExecutionResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Execute a parsed command
 */
export async function executeCommand(command: ParsedCommand): Promise<ExecutionResult> {
  const supabase = createClientComponentClient()

  // Track command execution
  trackEvent.settingChanged('voice_command_executed', {
    action: command.action,
    domain: command.domain,
  })

  try {
    switch (command.action) {
      case 'log':
        return await handleLogCommand(command, supabase)
      
      case 'add':
        return await handleAddCommand(command, supabase)
      
      case 'query':
        return await handleQueryCommand(command, supabase)
      
      case 'schedule':
        return await handleScheduleCommand(command, supabase)
      
      case 'navigate':
        return handleNavigateCommand(command)
      
      default:
        return {
          success: false,
          message: `Unknown action: ${command.action}`,
        }
    }
  } catch (error) {
    console.error('Command execution error:', error)
    return {
      success: false,
      message: 'Failed to execute command. Please try again.',
    }
  }
}

/**
 * Handle LOG commands (logging data)
 */
async function handleLogCommand(command: ParsedCommand, supabase: any): Promise<ExecutionResult> {
  const { domain, parameters } = command

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Please log in to track data' }
  }

  try {
    // Prepare the data object to store in normalized table
    const title = parameters.title
      || (parameters.type === 'water' && `${parameters.value} ${parameters.unit || 'oz'} water`)
      || (parameters.type === 'steps' && `${parameters.value?.toLocaleString()} steps`)
      || (parameters.type === 'weight' && `Weight: ${parameters.value} ${parameters.unit || 'lbs'}`)
      || (parameters.type === 'expense' && `$${parameters.amount} - ${parameters.description || 'expense'}`)
      || parameters.type
      || 'Entry'

    const { data: dataEntry, error: insertError } = await supabase
      .from('domain_entries')
      .insert({
        user_id: user.id,
        domain,
        title,
        description: parameters.description || '',
        metadata: { ...parameters, source: 'voice', timestamp: parameters.date || new Date().toISOString() },
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Supabase save error:', insertError)
      return {
        success: false,
        message: 'Failed to save data to cloud. Please try again.',
      }
    }

    // Get friendly message based on what was logged
    let friendlyMessage = `Successfully logged ${parameters.type || 'data'}`
    
    if (parameters.type === 'steps') {
      friendlyMessage = `Logged ${parameters.value.toLocaleString()} steps!`
    } else if (parameters.type === 'weight') {
      friendlyMessage = `Logged weight: ${parameters.value} ${parameters.unit || 'lbs'}`
    } else if (parameters.type === 'water') {
      friendlyMessage = `Logged ${parameters.value} ${parameters.unit || 'oz'} of water`
    } else if (parameters.type === 'blood_pressure') {
      friendlyMessage = `Logged BP: ${parameters.systolic}/${parameters.diastolic}`
    } else if (parameters.type === 'workout') {
      friendlyMessage = `Logged workout: ${parameters.duration || parameters.exercise_type || 'exercise'}`
    } else if (parameters.type === 'meal') {
      friendlyMessage = `Logged meal${parameters.calories ? ` (${parameters.calories} cal)` : ''}`
    }

    return {
      success: true,
      message: friendlyMessage,
      data: dataEntry,
    }
  } catch (error) {
    console.error('Error in handleLogCommand:', error)
    return {
      success: false,
      message: 'Failed to save data. Please try again.',
    }
  }
}

/**
 * Handle ADD commands (adding items)
 */
async function handleAddCommand(command: ParsedCommand, supabase: any): Promise<ExecutionResult> {
  const { domain, parameters } = command

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Please log in to add items' }
  }

  try {
    // Special handling for tasks table (has its own dedicated table)
    if (domain === 'tasks') {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: parameters.title,
          description: parameters.description || null,
          completed: false,
          priority: parameters.priority || 'medium',
          due_date: parameters.due_date || null,
        })

      if (error) {
        console.error('Task insert error:', error)
        throw error
      }

      return {
        success: true,
        message: `Added task: "${parameters.title}"`,
        data: parameters,
      }
    }

    // For all other domains, insert into domain_entries
    const itemName = parameters.title || parameters.name || parameters.description || 'item'
    const { data: dataEntry, error: insertError2 } = await supabase
      .from('domain_entries')
      .insert({
        user_id: user.id,
        domain,
        title: itemName,
        description: parameters.description || '',
        metadata: { ...parameters, source: 'voice', createdAt: new Date().toISOString() },
      })
      .select('*')
      .single()

    if (insertError2) {
      console.error('Supabase add error:', insertError2)
      throw insertError2
    }
    
    return {
      success: true,
      message: `Added ${itemName} to ${domain}`,
      data: dataEntry,
    }
  } catch (error) {
    console.error('Error in handleAddCommand:', error)
    return {
      success: false,
      message: 'Failed to add item. Please try again.',
    }
  }
}

/**
 * Handle QUERY commands (fetching information)
 */
async function handleQueryCommand(command: ParsedCommand, supabase: any): Promise<ExecutionResult> {
  const { domain, parameters } = command

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Please log in to query data' }
  }

  try {
    // Fetch normalized entries from domain_entries
    const { data, error } = await supabase
      .from('domain_entries')
      .select('id, title, description, metadata, created_at')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Query error:', error)
      throw error
    }

    if (domain === 'financial') {
      if (parameters.type === 'net_worth') {
        if (data.length === 0) {
          return {
            success: true,
            message: 'You have no financial data yet. Start by adding accounts!',
            data: { netWorth: 0 },
          }
        }

        const netWorth = data.reduce((sum: number, entry: any) => {
          return sum + (entry.balance || entry.value || entry.amount || 0)
        }, 0)

        return {
          success: true,
          message: `Your net worth is $${netWorth.toLocaleString()}`,
          data: { netWorth },
        }
      }

      if (parameters.type === 'expenses') {
        const expenses = data.filter((entry: any) => entry.type === 'expense')
        const total = expenses.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0)
        
        return {
          success: true,
          message: `You've spent $${total.toLocaleString()} ${parameters.period ? parameters.period.replace('_', ' ') : 'recently'}`,
          data: { expenses: total, period: parameters.period },
        }
      }
    }

    if (domain === 'health') {
      if (parameters.type === 'appointments') {
        const appointments = data.filter((entry: any) => 
          entry.type === 'appointment' && new Date(entry.date) >= new Date()
        )

        const count = appointments.length

        return {
          success: true,
          message: count > 0 
            ? `You have ${count} upcoming appointment${count !== 1 ? 's' : ''}`
            : 'You have no upcoming appointments',
          data: { appointments, count },
        }
      }

      // General health stats query
      const recentEntries = data.slice(-10) // Get last 10 entries
      return {
        success: true,
        message: `Found ${data.length} health record${data.length !== 1 ? 's' : ''}`,
        data: { entries: recentEntries, total: data.length },
      }
    }

    // Generic query for any domain
    return {
      success: true,
      message: `Found ${data.length} ${domain} record${data.length !== 1 ? 's' : ''}`,
      data: { entries: data, count: data.length },
    }
  } catch (error) {
    console.error('Error in handleQueryCommand:', error)
    return {
      success: false,
      message: 'Failed to query data. Please try again.',
    }
  }
}

/**
 * Handle SCHEDULE commands (scheduling events)
 */
async function handleScheduleCommand(command: ParsedCommand, supabase: any): Promise<ExecutionResult> {
  const { domain, parameters } = command

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'Please log in to schedule events' }
  }

  try {
    // Create event entry
    const eventEntry: any = {
      id: crypto.randomUUID(),
      ...parameters,
      scheduled_date: parameters.date || parameters.scheduled_date,
      created_at: new Date().toISOString(),
      status: 'scheduled',
      source: 'voice'
    }

    // Get or create domain entry
    const { data: existingDomain, error: fetchError } = await supabase
      .from('domains')
      .select('data')
      .eq('user_id', user.id)
      .eq('domain_name', domain)
      .single()

    let currentData = []
    
    if (existingDomain && !fetchError) {
      currentData = Array.isArray(existingDomain.data) ? existingDomain.data : []
    }

    // Add new event
    currentData.push(eventEntry)

    // Upsert to Supabase
    const { error: upsertError } = await supabase
      .from('domains')
      .upsert({
        user_id: user.id,
        domain_name: domain,
        data: currentData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,domain_name'
      })

    if (upsertError) {
      console.error('Supabase schedule error:', upsertError)
      throw upsertError
    }

    const dateStr = parameters.date ? new Date(parameters.date).toLocaleDateString() : 'soon'
    const eventName = parameters.description || parameters.title || parameters.type || 'event'

    return {
      success: true,
      message: `Scheduled ${eventName} for ${dateStr}`,
      data: eventEntry,
    }
  } catch (error) {
    console.error('Error in handleScheduleCommand:', error)
    return {
      success: false,
      message: 'Failed to schedule event. Please try again.',
    }
  }
}

/**
 * Handle NAVIGATE commands (navigation)
 */
function handleNavigateCommand(command: ParsedCommand): ExecutionResult {
  const { parameters } = command

  if (typeof window !== 'undefined') {
    window.location.href = parameters.path
    
    return {
      success: true,
      message: `Navigating to ${parameters.path}`,
      data: { path: parameters.path },
    }
  }

  return {
    success: false,
    message: 'Navigation not available',
  }
}

/**
 * Get user-friendly message for command execution
 */
export function getExecutionMessage(command: ParsedCommand, result: ExecutionResult): string {
  if (!result.success) {
    return result.message
  }

  // Customize messages based on command type
  switch (command.action) {
    case 'log':
      return `✅ ${result.message}`
    case 'add':
      return `➕ ${result.message}`
    case 'query':
      return `💬 ${result.message}`
    case 'schedule':
      return `📅 ${result.message}`
    case 'navigate':
      return `🧭 ${result.message}`
    default:
      return result.message
  }
}


