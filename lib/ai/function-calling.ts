/**
 * AI Function Calling with MCP Integration
 * Converts MCP capabilities into OpenAI function definitions
 */

import { loadMCPConfig, mcpCapabilitiesToOpenAIFunctions, callMCPCapability } from '@/lib/mcp/mcp-manager'

/**
 * Get available functions for AI based on enabled MCP servers
 */
export async function getAvailableAIFunctions(): Promise<any[]> {
  try {
    const config = await loadMCPConfig()
    return mcpCapabilitiesToOpenAIFunctions(config)
  } catch (error) {
    console.error('Error loading MCP functions:', error)
    return []
  }
}

/**
 * Execute a function call from AI
 */
export async function executeFunctionCall(
  functionName: string,
  parameters: any
): Promise<any> {
  console.log(`🔧 Executing function: ${functionName}`, parameters)
  
  // Map function names to MCP capabilities
  const functionMap: Record<string, { serverId: string, capability: string }> = {
    'create_calendar_event': { serverId: 'google-calendar', capability: 'create_event' },
    'query_database': { serverId: 'supabase-database', capability: 'query_table' },
    'search_web': { serverId: 'web-search', capability: 'web_search' }
  }
  
  const mapping = functionMap[functionName]
  if (!mapping) {
    throw new Error(`Unknown function: ${functionName}`)
  }
  
  try {
    const result = await callMCPCapability(
      mapping.serverId,
      mapping.capability,
      parameters
    )
    return result
  } catch (error: any) {
    console.error(`❌ Function execution error:`, error)
    throw error
  }
}

/**
 * Process AI response with function calls
 */
export async function processAIResponseWithFunctions(
  messages: any[],
  model: string = 'gpt-4o-mini'
): Promise<{ response: string, functionCalls: any[] }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }
  
  // Get available functions
  const functions = await getAvailableAIFunctions()
  
  // First call to OpenAI
  const initialResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      functions: functions.length > 0 ? functions : undefined,
      function_call: functions.length > 0 ? 'auto' : undefined,
      temperature: 0.7,
      max_tokens: 500
    })
  })
  
  if (!initialResponse.ok) {
    throw new Error(`OpenAI API error: ${initialResponse.statusText}`)
  }
  
  const initialData = await initialResponse.json()
  const choice = initialData.choices[0]
  
  // Check if AI wants to call a function
  if (choice.message.function_call) {
    const functionCall = choice.message.function_call
    console.log('🤖 AI requesting function call:', functionCall.name)
    
    try {
      // Execute the function
      const functionResult = await executeFunctionCall(
        functionCall.name,
        JSON.parse(functionCall.arguments)
      )
      
      // Add function result to messages and get final response
      const updatedMessages = [
        ...messages,
        choice.message, // AI's function call
        {
          role: 'function',
          name: functionCall.name,
          content: JSON.stringify(functionResult)
        }
      ]
      
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: updatedMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      })
      
      const finalData = await finalResponse.json()
      const finalMessage = finalData.choices[0].message.content
      
      return {
        response: finalMessage,
        functionCalls: [{
          name: functionCall.name,
          arguments: JSON.parse(functionCall.arguments),
          result: functionResult
        }]
      }
    } catch (error: any) {
      return {
        response: `I tried to ${functionCall.name.replace(/_/g, ' ')} but encountered an error: ${error.message}`,
        functionCalls: []
      }
    }
  }
  
  // No function call, return direct response
  return {
    response: choice.message.content,
    functionCalls: []
  }
}






















