import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai/client'

export async function POST(request: NextRequest) {
  try {
    const { message, context, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if asking about documents
    const docKeywords = ['document', 'insurance', 'license', 'card', 'pdf', 'show me', 'pull up', 'find my']
    const isDocumentQuery = docKeywords.some(keyword => message.toLowerCase().includes(keyword))

    if (isDocumentQuery && process.env.OPENAI_API_KEY) {
      // Use OpenAI with function calling for document retrieval
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that can search and retrieve user documents. When asked about documents, use the search_documents function to find them.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        functions: [
          {
            name: 'search_documents',
            description: 'Search user documents by keywords or category',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Keywords to search (e.g., "insurance", "auto", "license")'
                },
                category: {
                  type: 'string',
                  enum: ['insurance', 'health', 'vehicles', 'financial', 'legal', 'all'],
                  description: 'Category to filter by'
                }
              }
            }
          }
        ],
        function_call: 'auto'
      })

      const responseMessage = completion.choices[0]?.message

      // If function call, execute it
      if (responseMessage?.function_call) {
        const args = JSON.parse(responseMessage.function_call.arguments || '{}')
        console.log('🔍 Searching documents:', args)

        // Search database
        let query = supabase
          .from('documents')
          .select('id, document_name, document_type, file_url, file_path, expiration_date, domain, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (args.category && args.category !== 'all') {
          query = query.eq('domain', args.category)
        }

        const { data: docs } = await query.limit(10)

        // Filter by query text
        let filteredDocs = docs || []
        if (args.query) {
          const searchLower = args.query.toLowerCase()
          filteredDocs = filteredDocs.filter(doc =>
            doc.document_name?.toLowerCase().includes(searchLower) ||
            doc.document_type?.toLowerCase().includes(searchLower) ||
            doc.domain?.toLowerCase().includes(searchLower)
          )
        }

        if (filteredDocs.length > 0) {
          const docList = filteredDocs.map(doc => ({
            id: doc.id,
            name: doc.document_name || 'Untitled',
            type: doc.document_type,
            category: doc.metadata?.category || doc.domain,
            expirationDate: doc.expiration_date,
            url: doc.file_url || doc.file_path
          }))

          console.log(`✅ Found ${docList.length} documents, opening them`)

          return NextResponse.json({
            response: `I found ${docList.length} document(s): ${docList.map(d => d.name).join(', ')}. Opening them now...`,
            documents: docList,
            openDocuments: true,
            timestamp: new Date().toISOString()
          })
        } else {
          return NextResponse.json({
            response: `I couldn't find any documents matching "${args.query || 'your search'}". Try uploading some documents first!`,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // Fallback to context-based response
    const response = generateIntelligentResponse(message, context, conversationHistory)

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI chat request' },
      { status: 500 }
    )
  }
}

function generateIntelligentResponse(message: string, context: any, history: any[]): string {
  const lower = message.toLowerCase()
  
  // Greeting
  if (lower.match(/^(hi|hello|hey|greetings)/)) {
    return `Hello! I can see you have ${context.tasks.total} tasks, ${context.bills.total} bills, and ${context.finances.expenses.length} financial transactions tracked. What would you like to know?`
  }
  
  // Financial Summary
  if (lower.includes('financial') && (lower.includes('summary') || lower.includes('overview'))) {
    const netIncome = context.finances.totalIncome - context.finances.totalExpenses
    return `**Financial Summary:**\n\n💰 Total Income: $${context.finances.totalIncome.toFixed(2)}\n💸 Total Expenses: $${context.finances.totalExpenses.toFixed(2)}\n📊 Net: $${netIncome.toFixed(2)}\n\nYou have ${context.finances.expenses.length} expense transactions and ${context.finances.income.length} income transactions recorded.${netIncome < 0 ? '\n\n⚠️ You\'re currently spending more than you\'re earning.' : '\n\n✅ Your income exceeds your expenses!'}`
  }
  
  // Spending Analysis
  if (lower.includes('spend') || lower.includes('expense')) {
    const avgExpense = context.finances.expenses.length > 0 
      ? context.finances.totalExpenses / context.finances.expenses.length 
      : 0
    return `**Spending Analysis:**\n\n💸 Total Expenses: $${context.finances.totalExpenses.toFixed(2)}\n📊 Number of Transactions: ${context.finances.expenses.length}\n💵 Average per Transaction: $${avgExpense.toFixed(2)}\n\n${context.finances.expenses.length > 0 ? 'Your most recent expenses are being tracked. Keep logging to get more insights!' : 'Start tracking your expenses to get detailed spending insights.'}`
  }
  
  // Income Analysis
  if (lower.includes('income') || lower.includes('earn')) {
    return `**Income Summary:**\n\n💰 Total Income: $${context.finances.totalIncome.toFixed(2)}\n📈 Income Transactions: ${context.finances.income.length}\n\n${context.finances.income.length > 0 ? 'Great job tracking your income!' : 'Start logging your income sources to get a complete financial picture.'}`
  }
  
  // Task Management
  if (lower.includes('task') || lower.includes('todo')) {
    const completionRate = context.tasks.total > 0 
      ? ((context.tasks.completed / context.tasks.total) * 100).toFixed(1)
      : 0
    return `**Task Overview:**\n\n✅ Completed: ${context.tasks.completed}\n📋 Pending: ${context.tasks.pending}\n📊 Total: ${context.tasks.total}\n🎯 Completion Rate: ${completionRate}%\n\n${context.tasks.upcoming.length > 0 ? `**Next Up:**\n${context.tasks.upcoming.map((t: any) => `• ${t.title}`).join('\n')}` : 'No upcoming tasks. Great work!'}`
  }
  
  // Bills
  if (lower.includes('bill') || lower.includes('payment') || lower.includes('due')) {
    return `**Bills Summary:**\n\n💳 Total Bills: ${context.bills.total}\n⏰ Unpaid: ${context.bills.unpaid}\n✅ Paid: ${context.bills.total - context.bills.unpaid}\n\n${context.bills.upcomingDue.length > 0 ? `**Coming Due:**\n${context.bills.upcomingDue.map((b: any) => `• ${b.name}: $${b.amount} (${b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'No date'})`).join('\n')}` : 'No upcoming bills. You\'re all caught up!'}`
  }
  
  // Health
  if (lower.includes('health') || lower.includes('weight') || lower.includes('fitness')) {
    const weight = context.health.latestWeight
    return `**Health Summary:**\n\n📊 Health Logs: ${context.health.recentLogs.length}\n${weight ? `⚖️ Latest Weight: ${weight.metadata?.value || weight.data?.value} ${weight.metadata?.unit || weight.data?.unit || 'lbs'}` : '⚖️ No weight data yet'}\n\n${context.health.recentLogs.length > 0 ? 'Keep tracking to see your health trends!' : 'Start logging your health data to get personalized insights.'}`
  }
  
  // Habits
  if (lower.includes('habit')) {
    return `**Habit Tracking:**\n\n📋 Total Habits: ${context.habits.total}\n✨ Active: ${context.habits.active}\n\n${context.habits.active > 0 ? 'Keep up the great work with your daily habits!' : 'Create some habits to track your daily routines.'}`
  }
  
  // Events/Calendar
  if (lower.includes('event') || lower.includes('calendar') || lower.includes('schedule')) {
    return `**Calendar Overview:**\n\n📅 Total Events: ${context.events.total}\n\n${context.events.upcoming.length > 0 ? `**Upcoming Events:**\n${context.events.upcoming.map((e: any) => `• ${e.title} ${e.date ? `(${new Date(e.date).toLocaleDateString()})` : ''}`).join('\n')}` : 'No upcoming events scheduled.'}`
  }
  
  // Vehicles
  if (lower.includes('car') || lower.includes('vehicle')) {
    return `**Vehicle Information:**\n\n🚗 Vehicles Tracked: ${context.vehicles.length}\n\n${context.vehicles.length > 0 ? `You have ${context.vehicles.length} vehicle(s) registered:\n${context.vehicles.map((v: any) => `• ${v.make} ${v.model} ${v.year ? `(${v.year})` : ''}`).join('\n')}` : 'No vehicles tracked yet. Add your vehicles to track maintenance and expenses!'}`
  }
  
  // Properties
  if (lower.includes('home') || lower.includes('house') || lower.includes('property')) {
    return `**Property Information:**\n\n🏠 Properties: ${context.properties.length}\n\n${context.properties.length > 0 ? `You have ${context.properties.length} propert${context.properties.length === 1 ? 'y' : 'ies'} tracked.` : 'No properties tracked yet. Add your home to track maintenance and value!'}`
  }
  
  // Pets
  if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) {
    return `**Pet Information:**\n\n🐾 Pets: ${context.pets.length}\n\n${context.pets.length > 0 ? `You have ${context.pets.length} pet${context.pets.length === 1 ? '' : 's'} registered!` : 'No pets tracked yet. Add your furry friends to track vet appointments and care!'}`
  }
  
  // Help
  if (lower.includes('help') || lower.includes('what can you')) {
    return `**I can help you with:**\n\n💰 Financial Analysis - Track income and expenses\n📋 Task Management - View and manage your tasks\n💳 Bill Tracking - Monitor upcoming payments\n🏥 Health Tracking - Log and analyze health data\n✨ Habit Building - Track daily habits\n📅 Event Planning - View your calendar\n🚗 Vehicle Management - Track car maintenance\n🏠 Property Management - Monitor home info\n🐾 Pet Care - Track pet health\n\nJust ask me about any of these topics!`
  }
  
  // Overview
  if (lower.includes('overview') || lower.includes('summary') || lower.match(/^(show|tell).*everything/)) {
    return `**Complete Life Overview:**\n\n💰 **Finances:** $${context.finances.totalIncome.toFixed(2)} income, $${context.finances.totalExpenses.toFixed(2)} expenses\n📋 **Tasks:** ${context.tasks.pending} pending out of ${context.tasks.total} total\n💳 **Bills:** ${context.bills.unpaid} unpaid bills\n🏥 **Health:** ${context.health.recentLogs.length} health logs\n✨ **Habits:** ${context.habits.active} active habits\n📅 **Events:** ${context.events.upcoming.length} upcoming events\n🚗 **Vehicles:** ${context.vehicles.length} tracked\n🏠 **Properties:** ${context.properties.length} tracked\n🐾 **Pets:** ${context.pets.length} tracked\n\nWhat would you like to explore in detail?`
  }
  
  // Default contextual response
  return `I understand you're asking about "${message}". I have access to:\n\n• ${context.finances.expenses.length} financial transactions (Income: $${context.finances.totalIncome.toFixed(2)}, Expenses: $${context.finances.totalExpenses.toFixed(2)})\n• ${context.tasks.total} tasks (${context.tasks.pending} pending)\n• ${context.bills.total} bills (${context.bills.unpaid} unpaid)\n• ${context.health.recentLogs.length} health logs\n• ${context.habits.total} habits\n• ${context.events.total} events\n\nTry asking about:\n- "What's my financial summary?"\n- "Show me my tasks"\n- "What bills are due?"\n- "Give me a complete overview"`
}









