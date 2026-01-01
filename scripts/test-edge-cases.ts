#!/usr/bin/env npx ts-node
/**
 * Edge Case Command Tester
 * Tests 100 edge cases for command parsing robustness
 */

interface TestCase {
  id: number
  category: string
  command: string
  expected: string
  potentialBreak: string
}

interface TestResult {
  id: number
  category: string
  command: string
  expected: string
  potentialBreak: string
  passed: boolean
  status: 'PASS' | 'FAIL' | 'ERROR' | 'NEEDS_REVIEW'
  aiResponse?: string
  parsedData?: any
  issues: string[]
  executionTime: number
}

// All 100 test cases
const TEST_CASES: TestCase[] = [
  // CATEGORY 1: EDGE CASE PARSING (Commands 1-15)
  { id: 1, category: 'Edge Case Parsing', command: '', expected: 'Error handling', potentialBreak: 'Crashes or hangs' },
  { id: 2, category: 'Edge Case Parsing', command: '   ', expected: 'Graceful rejection', potentialBreak: 'Regex match failures' },
  { id: 3, category: 'Edge Case Parsing', command: 'spent $-50 on groceries', expected: 'Reject negative expense', potentialBreak: 'Incorrect domain routing' },
  { id: 4, category: 'Edge Case Parsing', command: 'weigh 0 pounds', expected: 'Reject invalid weight', potentialBreak: 'Saves zero value' },
  { id: 5, category: 'Edge Case Parsing', command: 'walked 99999999 miles', expected: 'Reject unreasonable value', potentialBreak: 'Integer overflow' },
  { id: 6, category: 'Edge Case Parsing', command: 'drank 0.5 oz water', expected: 'Handle decimal', potentialBreak: 'Truncation errors' },
  { id: 7, category: 'Edge Case Parsing', command: 'blood pressure 500/20', expected: 'Validate medical ranges', potentialBreak: 'Saves dangerous values' },
  { id: 8, category: 'Edge Case Parsing', command: 'spent $0.001 on coffee', expected: 'Handle fractional cents', potentialBreak: 'Rounding issues' },
  { id: 9, category: 'Edge Case Parsing', command: 'weigh 175pounds', expected: 'Parse anyway', potentialBreak: 'Regex fails' },
  { id: 10, category: 'Edge Case Parsing', command: 'spent$50on groceries', expected: 'Parse anyway', potentialBreak: 'Token parsing fails' },
  { id: 11, category: 'Edge Case Parsing', command: 'I weigh one hundred seventy five pounds', expected: 'Word-to-number', potentialBreak: 'Only digits work' },
  { id: 12, category: 'Edge Case Parsing', command: 'spent fifty dollars on lunch', expected: 'Word-to-number', potentialBreak: 'Only digits work' },
  { id: 13, category: 'Edge Case Parsing', command: 'ate 2.5 chicken sandwiches 450cal each', expected: 'Multi-item calculation', potentialBreak: 'Misses multiplication' },
  { id: 14, category: 'Edge Case Parsing', command: 'ran 3.14159 miles in 31:41.59', expected: 'Precision handling', potentialBreak: 'Time parsing fails' },
  { id: 15, category: 'Edge Case Parsing', command: '"log water"', expected: 'Handle quoted text', potentialBreak: 'Quotes break parsing' },

  // CATEGORY 2: MULTI-INTENT & COMPOUND COMMANDS (Commands 16-30)
  { id: 16, category: 'Multi-Intent', command: 'weigh 175, ran 3 miles, spent $50, and blood pressure 120/80', expected: '4 entries', potentialBreak: 'Misses some items' },
  { id: 17, category: 'Multi-Intent', command: 'pull up my license AND log 20oz water', expected: 'Retrieval + Data log', potentialBreak: 'Only processes one' },
  { id: 18, category: 'Multi-Intent', command: 'add task call doctor and add habit drink water and log 5000 steps', expected: '3 different actions', potentialBreak: 'Sequential processing fails' },
  { id: 19, category: 'Multi-Intent', command: 'interview at Google tomorrow at 2pm and meeting with recruiter at 3pm', expected: '2 calendar events', potentialBreak: 'Second overwrites first' },
  { id: 20, category: 'Multi-Intent', command: 'I weigh 175 lbs, blood pressure 120/80, heart rate 72, and temperature 98.6', expected: '4 health entries', potentialBreak: 'Misses temperature' },
  { id: 21, category: 'Multi-Intent', command: 'spent $30 at Starbucks and $25 at Target and $15 on gas', expected: '3 expenses', potentialBreak: 'Missing entries' },
  { id: 22, category: 'Multi-Intent', command: 'retrieve my insurance, show my vehicle registration, and get my ID', expected: '3 retrievals', potentialBreak: 'Only returns first' },
  { id: 23, category: 'Multi-Intent', command: 'delete my last expense and add new expense $50 groceries', expected: 'Delete + Add', potentialBreak: 'Wrong order execution' },
  { id: 24, category: 'Multi-Intent', command: 'update my weight to 170 and delete old weight entries', expected: 'Update + Delete', potentialBreak: 'Deletes wrong entries' },
  { id: 25, category: 'Multi-Intent', command: 'create chart of expenses AND export financial data as CSV', expected: 'Chart + Export', potentialBreak: 'Only one action' },
  { id: 26, category: 'Multi-Intent', command: 'go to health page and log weight 175 and show my fitness data', expected: 'Nav + Log + Query', potentialBreak: 'Routing confusion' },
  { id: 27, category: 'Multi-Intent', command: 'add bill Netflix $15 AND mark Netflix bill as paid', expected: 'Create + Update', potentialBreak: 'Update fails (doesn\'t exist yet)' },
  { id: 28, category: 'Multi-Intent', command: 'schedule dentist appointment tomorrow at 10am and add task to confirm appointment', expected: 'Event + Task', potentialBreak: 'Task timing unclear' },
  { id: 29, category: 'Multi-Intent', command: 'log breakfast eggs 300cal, lunch salad 400cal, dinner steak 600cal', expected: '3 meals', potentialBreak: 'Meal type detection' },
  { id: 30, category: 'Multi-Intent', command: 'pull up my auto insurance for my toyota and my health insurance card', expected: 'Multi-doc search', potentialBreak: 'Returns wrong docs' },

  // CATEGORY 3: AMBIGUOUS/VAGUE INPUTS (Commands 31-45)
  { id: 31, category: 'Ambiguous', command: 'add something', expected: 'Ask for clarification', potentialBreak: 'Creates empty entry' },
  { id: 32, category: 'Ambiguous', command: 'log it', expected: 'Ask what to log', potentialBreak: 'Error or null entry' },
  { id: 33, category: 'Ambiguous', command: '175', expected: 'Ask for context', potentialBreak: 'Guesses wrong domain' },
  { id: 34, category: 'Ambiguous', command: 'did a thing', expected: 'Ask for details', potentialBreak: 'Misroutes to random domain' },
  { id: 35, category: 'Ambiguous', command: 'spent money', expected: 'Ask for amount', potentialBreak: 'Creates $0 expense' },
  { id: 36, category: 'Ambiguous', command: 'meeting', expected: 'Ask who/when', potentialBreak: 'Creates incomplete entry' },
  { id: 37, category: 'Ambiguous', command: 'fix my data', expected: 'Ask what data', potentialBreak: 'Destructive action without target' },
  { id: 38, category: 'Ambiguous', command: 'show me everything', expected: 'Too broad', potentialBreak: 'System crash/timeout' },
  { id: 39, category: 'Ambiguous', command: 'delete all', expected: 'Require confirmation', potentialBreak: 'Deletes without confirm' },
  { id: 40, category: 'Ambiguous', command: 'update weight', expected: 'Ask for value', potentialBreak: 'Sets to null' },
  { id: 41, category: 'Ambiguous', command: 'more', expected: 'Ask for context', potentialBreak: 'Error' },
  { id: 42, category: 'Ambiguous', command: 'yes', expected: 'Ask what for', potentialBreak: 'Confirms wrong action' },
  { id: 43, category: 'Ambiguous', command: 'cancel', expected: 'Ignore gracefully', potentialBreak: 'Error' },
  { id: 44, category: 'Ambiguous', command: 'undo', expected: 'Should undo last action', potentialBreak: 'Not implemented' },
  { id: 45, category: 'Ambiguous', command: 'what did I just say', expected: 'Recall last command', potentialBreak: 'No conversation memory' },

  // CATEGORY 4: DOMAIN MISROUTING (Commands 46-60)
  { id: 46, category: 'Domain Routing', command: 'paid vet $150 for Buddy\'s checkup', expected: '→ pets domain', potentialBreak: '→ financial domain' },
  { id: 47, category: 'Domain Routing', command: 'paid rent $2000', expected: '→ home domain', potentialBreak: '→ financial domain' },
  { id: 48, category: 'Domain Routing', command: 'oil change $80', expected: '→ vehicles domain', potentialBreak: '→ financial domain' },
  { id: 49, category: 'Domain Routing', command: 'gym membership $50/month', expected: '→ fitness? financial?', potentialBreak: 'Ambiguous routing' },
  { id: 50, category: 'Domain Routing', command: 'Netflix subscription $15', expected: '→ digital domain', potentialBreak: '→ financial domain' },
  { id: 51, category: 'Domain Routing', command: 'bought dog food $40', expected: '→ pets domain', potentialBreak: '→ financial domain' },
  { id: 52, category: 'Domain Routing', command: 'health insurance premium $500', expected: '→ insurance domain', potentialBreak: '→ financial domain' },
  { id: 53, category: 'Domain Routing', command: 'property tax $3000', expected: '→ property/home domain', potentialBreak: '→ financial domain' },
  { id: 54, category: 'Domain Routing', command: 'car registration $150', expected: '→ vehicles domain', potentialBreak: '→ financial domain' },
  { id: 55, category: 'Domain Routing', command: 'tutor for math $100/hour', expected: '→ education domain', potentialBreak: '→ financial domain' },
  { id: 56, category: 'Domain Routing', command: 'therapy session $200', expected: '→ health domain', potentialBreak: '→ financial domain' },
  { id: 57, category: 'Domain Routing', command: 'lawyer consultation $300', expected: '→ legal domain', potentialBreak: '→ financial domain' },
  { id: 58, category: 'Domain Routing', command: 'meditation app subscription', expected: '→ mindfulness? digital?', potentialBreak: 'Ambiguous' },
  { id: 59, category: 'Domain Routing', command: 'bought wedding ring $5000', expected: '→ relationships? miscellaneous?', potentialBreak: 'Unclear' },
  { id: 60, category: 'Domain Routing', command: 'paid brother back $50', expected: '→ relationships? financial?', potentialBreak: 'Ambiguous' },

  // CATEGORY 5: DATE/TIME PARSING (Commands 61-75)
  { id: 61, category: 'Date/Time', command: 'interview at Amazon on 12/25/2025', expected: 'Parse date correctly', potentialBreak: 'MM/DD vs DD/MM' },
  { id: 62, category: 'Date/Time', command: 'meeting tomorrow at noon', expected: '12:00 PM', potentialBreak: 'Parses to midnight' },
  { id: 63, category: 'Date/Time', command: 'appointment next Tuesday at 3', expected: '3 PM assumed', potentialBreak: '3 AM created' },
  { id: 64, category: 'Date/Time', command: 'event on Feb 30th', expected: 'Invalid date error', potentialBreak: 'Creates invalid date' },
  { id: 65, category: 'Date/Time', command: 'meeting at 25:00', expected: 'Invalid time error', potentialBreak: 'Creates broken event' },
  { id: 66, category: 'Date/Time', command: 'log weight yesterday', expected: 'Previous day\'s date', potentialBreak: 'Uses today' },
  { id: 67, category: 'Date/Time', command: 'spent $50 last Thursday', expected: 'Calculate correct date', potentialBreak: 'Wrong date' },
  { id: 68, category: 'Date/Time', command: 'log steps for past week', expected: '7 entries? Query?', potentialBreak: 'Unclear action' },
  { id: 69, category: 'Date/Time', command: 'schedule recurring meeting every Monday at 9am', expected: 'Recurring event', potentialBreak: 'Only creates once' },
  { id: 70, category: 'Date/Time', command: 'bill due on the 15th of every month', expected: 'Recurring bill', potentialBreak: 'Single instance' },
  { id: 71, category: 'Date/Time', command: 'reminder in 2 hours', expected: 'Relative time handling', potentialBreak: 'Absolute time needed' },
  { id: 72, category: 'Date/Time', command: 'meeting from 2pm to 4pm', expected: 'Duration = 2 hours', potentialBreak: 'Wrong duration' },
  { id: 73, category: 'Date/Time', command: 'event December 25 2025 at 6:30pm PST', expected: 'Timezone handling', potentialBreak: 'Uses wrong timezone' },
  { id: 74, category: 'Date/Time', command: 'appointment on 2025-12-25', expected: 'ISO date format', potentialBreak: 'Fails to parse' },
  { id: 75, category: 'Date/Time', command: 'something happening in 3 days', expected: 'Calculate future date', potentialBreak: 'Fails' },

  // CATEGORY 6: DESTRUCTIVE OPERATIONS (Commands 76-85)
  { id: 76, category: 'Destructive', command: 'delete all my financial data', expected: 'Strong confirmation', potentialBreak: 'Deletes immediately' },
  { id: 77, category: 'Destructive', command: 'remove every expense from this year', expected: 'Confirmation + count', potentialBreak: 'Bypasses confirm' },
  { id: 78, category: 'Destructive', command: 'bulk delete completed tasks older than 30 days', expected: 'Soft delete / archive', potentialBreak: 'Hard delete' },
  { id: 79, category: 'Destructive', command: 'clear all habits', expected: 'Confirmation required', potentialBreak: 'Deletes without confirm' },
  { id: 80, category: 'Destructive', command: 'update all expenses to $0', expected: 'Reject dangerous bulk update', potentialBreak: 'Allows it' },
  { id: 81, category: 'Destructive', command: 'archive everything in health domain', expected: 'Should work', potentialBreak: 'Fails silently' },
  { id: 82, category: 'Destructive', command: 'restore archived entries', expected: 'Should list and restore', potentialBreak: 'Not implemented' },
  { id: 83, category: 'Destructive', command: 'find and merge duplicate expenses', expected: 'Identify + confirm', potentialBreak: 'Auto-merges wrong items' },
  { id: 84, category: 'Destructive', command: 'delete the expense I just added', expected: 'Reference "last" entry', potentialBreak: 'Can\'t identify it' },
  { id: 85, category: 'Destructive', command: 'undo my last delete', expected: 'Restore deleted item', potentialBreak: 'Not implemented' },

  // CATEGORY 7: INJECTION & SECURITY (Commands 86-92)
  { id: 86, category: 'Security', command: 'log expense <script>alert(\'xss\')</script>', expected: 'Sanitize HTML', potentialBreak: 'XSS vulnerability' },
  { id: 87, category: 'Security', command: "add task '; DROP TABLE domain_entries; --", expected: 'Sanitize SQL', potentialBreak: 'SQL injection' },
  { id: 88, category: 'Security', command: "spent ${{constructor.constructor('return this')()}}", expected: 'Reject prototype pollution', potentialBreak: 'Security issue' },
  { id: 89, category: 'Security', command: 'log weight ${process.env.SUPABASE_KEY}', expected: 'Never expose env vars', potentialBreak: 'Leaks secrets' },
  { id: 90, category: 'Security', command: 'retrieve ../../../etc/passwd', expected: 'Path traversal protection', potentialBreak: 'File access' },
  { id: 91, category: 'Security', command: 'navigate to javascript:alert(1)', expected: 'Reject malicious URL', potentialBreak: 'XSS via navigation' },
  { id: 92, category: 'Security', command: 'create entry with very long title ' + 'a'.repeat(10000), expected: 'Limit input length', potentialBreak: 'Buffer issues' },

  // CATEGORY 8: SPECIAL CHARACTERS & UNICODE (Commands 93-100)
  { id: 93, category: 'Unicode', command: 'add task café meeting ☕', expected: 'Handle Unicode', potentialBreak: 'Encoding issues' },
  { id: 94, category: 'Unicode', command: 'spent ¥500 on sushi', expected: 'Currency handling', potentialBreak: 'Only handles $' },
  { id: 95, category: 'Unicode', command: 'weigh 79.5kg', expected: 'Metric conversion', potentialBreak: 'Stores kg as lbs' },
  { id: 96, category: 'Unicode', command: 'log meal: 🍕🍕🍕', expected: 'Handle emoji', potentialBreak: 'Crashes or strips' },
  { id: 97, category: 'Unicode', command: 'note: "quotes" and \'apostrophes\' & ampersands', expected: 'Escape special chars', potentialBreak: 'Display corruption' },
  { id: 98, category: 'Unicode', command: 'add habit: ¿Hablar español?', expected: 'Non-ASCII chars', potentialBreak: 'Encoding failure' },
  { id: 99, category: 'Unicode', command: 'log: line1\nline2\nline3', expected: 'Multi-line content', potentialBreak: 'Only saves first line' },
  { id: 100, category: 'Unicode', command: 'spent $1,000.50 on furniture', expected: 'Handle comma in number', potentialBreak: 'Parses as 1' },
]

class EdgeCaseTester {
  private results: TestResult[] = []
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async testCommand(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now()
    const result: TestResult = {
      ...testCase,
      passed: false,
      status: 'ERROR',
      issues: [],
      executionTime: 0
    }

    try {
      console.log(`\n🧪 Test #${testCase.id}: "${testCase.command.substring(0, 50)}${testCase.command.length > 50 ? '...' : ''}"`)
      console.log(`   Category: ${testCase.category}`)
      console.log(`   Expected: ${testCase.expected}`)

      // Call the test parser API (dev-only endpoint)
      const response = await fetch(`${this.baseUrl}/api/test-parser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: testCase.command
        })
      })

      result.executionTime = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text()
        result.issues.push(`API returned ${response.status}: ${errorText.substring(0, 200)}`)
        result.status = 'ERROR'
        console.log(`   ❌ API Error: ${response.status}`)
        return result
      }

      const data = await response.json()
      result.aiResponse = JSON.stringify(data.parseResult)?.substring(0, 500)
      result.parsedData = data

      // Analyze the response based on category
      this.analyzeResult(testCase, data, result)
      
      // Log additional info for debugging
      console.log(`   Security checks: ${JSON.stringify(data.securityChecks || {})}`)
      if (data.parseResult?.validation?.needsClarification) {
        console.log(`   Needs clarification: ${data.parseResult.validation.clarificationQuestion}`)
      }

      if (result.issues.length === 0) {
        result.passed = true
        result.status = 'PASS'
        console.log(`   ✅ PASS (${result.executionTime}ms)`)
      } else if (result.status === 'NEEDS_REVIEW') {
        console.log(`   🟡 NEEDS REVIEW: ${result.issues.join(', ')}`)
      } else {
        result.status = 'FAIL'
        console.log(`   ❌ FAIL: ${result.issues.join(', ')}`)
      }

    } catch (error: any) {
      result.executionTime = Date.now() - startTime
      result.issues.push(`Exception: ${error.message}`)
      result.status = 'ERROR'
      console.log(`   ❌ Exception: ${error.message}`)
    }

    return result
  }

  private analyzeResult(testCase: TestCase, data: any, result: TestResult) {
    const category = testCase.category
    const responseText = (data.response || '').toLowerCase()

    // Category-specific analysis
    switch (category) {
      case 'Edge Case Parsing':
        this.analyzeEdgeCaseParsing(testCase, data, result)
        break
      case 'Multi-Intent':
        this.analyzeMultiIntent(testCase, data, result)
        break
      case 'Ambiguous':
        this.analyzeAmbiguous(testCase, data, result)
        break
      case 'Domain Routing':
        this.analyzeDomainRouting(testCase, data, result)
        break
      case 'Date/Time':
        this.analyzeDateTimeParsing(testCase, data, result)
        break
      case 'Destructive':
        this.analyzeDestructive(testCase, data, result)
        break
      case 'Security':
        this.analyzeSecurity(testCase, data, result)
        break
      case 'Unicode':
        this.analyzeUnicode(testCase, data, result)
        break
    }
  }

  private analyzeEdgeCaseParsing(testCase: TestCase, data: any, result: TestResult) {
    const parseResult = data.parseResult || {}
    const validation = parseResult.validation || {}
    const commands = parseResult.commands || []

    // Test 1 & 2: Empty/whitespace should be handled gracefully
    if (testCase.id <= 2) {
      if (parseResult.handled === 'gracefully' || parseResult.isCommand === false) {
        result.status = 'PASS'
        return
      }
      result.issues.push('Should handle empty input gracefully')
      return
    }

    // Test 3: Negative expense
    if (testCase.id === 3) {
      const cmd = commands[0] || {}
      if (cmd.validation?.isValid === false || cmd.validation?.issues?.length > 0) {
        result.status = 'PASS'
        return
      }
      if (parseResult.isCommand && !validation.needsClarification) {
        result.issues.push('Accepted negative expense amount without validation error')
      }
      return
    }

    // Test 4: Zero weight
    if (testCase.id === 4) {
      const cmd = commands[0] || {}
      if (cmd.data?.weight === 0 && cmd.validation?.isValid !== false) {
        result.issues.push('Saved invalid zero weight without flagging')
      }
      return
    }

    // Test 5: Unreasonable value
    if (testCase.id === 5) {
      const cmd = commands[0] || {}
      if (cmd.validation?.issues?.some((i: string) => i.toLowerCase().includes('unreasonable'))) {
        result.status = 'PASS'
        return
      }
      result.status = 'NEEDS_REVIEW'
      result.issues.push('Check if unreasonable value was flagged')
      return
    }

    // Test 6: Decimal handling
    if (testCase.id === 6) {
      const cmd = commands[0] || {}
      if (cmd.data?.value === 0.5 || cmd.data?.amount === 0.5) {
        result.status = 'PASS'
        return
      }
      result.status = 'NEEDS_REVIEW'
      result.issues.push('Check if decimal 0.5 was preserved correctly')
      return
    }

    // Test 7: Invalid blood pressure
    if (testCase.id === 7) {
      const cmd = commands[0] || {}
      if (cmd.validation?.issues?.some((i: string) => i.toLowerCase().includes('blood pressure') || i.toLowerCase().includes('range'))) {
        result.status = 'PASS'
        return
      }
      if (cmd.data?.systolic === 500) {
        result.issues.push('Saved dangerously invalid blood pressure 500/20')
      }
      return
    }

    // Test 8-15: Various parsing edge cases
    result.status = 'NEEDS_REVIEW'
    result.issues.push('Review parsed output for correctness')
  }

  private analyzeMultiIntent(testCase: TestCase, data: any, result: TestResult) {
    const response = data.response || ''
    
    // Check if multiple actions were mentioned in response
    const actionIndicators = ['✅', 'logged', 'added', 'created', 'scheduled']
    const actionCount = actionIndicators.reduce((count, indicator) => {
      const matches = response.toLowerCase().match(new RegExp(indicator, 'g'))
      return count + (matches ? matches.length : 0)
    }, 0)

    // Multi-intent commands should ideally process multiple items
    const expectedCount = this.getExpectedActionCount(testCase)
    
    if (actionCount < expectedCount) {
      result.issues.push(`Expected ${expectedCount} actions, detected ~${actionCount}`)
      result.status = 'NEEDS_REVIEW'
    }
  }

  private getExpectedActionCount(testCase: TestCase): number {
    const counts: Record<number, number> = {
      16: 4, 17: 2, 18: 3, 19: 2, 20: 4, 21: 3, 22: 3, 23: 2,
      24: 2, 25: 2, 26: 3, 27: 2, 28: 2, 29: 3, 30: 2
    }
    return counts[testCase.id] || 1
  }

  private analyzeAmbiguous(testCase: TestCase, data: any, result: TestResult) {
    const response = (data.response || '').toLowerCase()
    
    // Good behavior: asking for clarification
    const asksForClarification = 
      response.includes('what') ||
      response.includes('which') ||
      response.includes('please specify') ||
      response.includes('could you') ||
      response.includes('can you') ||
      response.includes('clarify') ||
      response.includes('more information') ||
      response.includes('need more') ||
      response.includes('?')

    // Bad behavior: creating incomplete entries
    if (data.saved && !asksForClarification) {
      result.issues.push('Created entry without clarification')
      result.status = 'FAIL'
    } else if (!asksForClarification && !data.saved) {
      result.status = 'NEEDS_REVIEW'
      result.issues.push('Did not ask for clarification (review response)')
    }
  }

  private analyzeDomainRouting(testCase: TestCase, data: any, result: TestResult) {
    const domain = data.data?.domain || data.domain || ''
    const expected = testCase.expected.toLowerCase()

    // Map expected domains
    const domainKeywords: Record<number, string[]> = {
      46: ['pets'],
      47: ['home', 'property'],
      48: ['vehicles'],
      49: ['fitness', 'financial'], // both acceptable
      50: ['digital'],
      51: ['pets'],
      52: ['insurance'],
      53: ['property', 'home'],
      54: ['vehicles'],
      55: ['education'],
      56: ['health'],
      57: ['legal'],
      58: ['mindfulness', 'digital'], // both acceptable
      59: ['relationships', 'miscellaneous', 'financial'], // ambiguous
      60: ['relationships', 'financial'] // ambiguous
    }

    const acceptableDomains = domainKeywords[testCase.id] || []
    
    if (domain && acceptableDomains.length > 0) {
      const isCorrectDomain = acceptableDomains.some(d => domain.toLowerCase().includes(d))
      if (!isCorrectDomain) {
        result.issues.push(`Routed to '${domain}' instead of ${acceptableDomains.join('/')}`)
      }
    } else {
      result.status = 'NEEDS_REVIEW'
      result.issues.push(`Domain routing unclear: ${domain || 'none detected'}`)
    }
  }

  private analyzeDateTimeParsing(testCase: TestCase, data: any, result: TestResult) {
    const response = (data.response || '').toLowerCase()
    
    // Test 64 & 65: Invalid dates/times
    if (testCase.id === 64 || testCase.id === 65) {
      if (data.saved && !response.includes('invalid')) {
        result.issues.push('Accepted invalid date/time')
      }
      return
    }

    // Other date/time tests - check if date was handled
    if (data.saved) {
      result.status = 'NEEDS_REVIEW'
      result.issues.push('Verify date/time parsed correctly')
    }
  }

  private analyzeDestructive(testCase: TestCase, data: any, result: TestResult) {
    const response = (data.response || '').toLowerCase()
    
    // Destructive operations should ask for confirmation
    const hasConfirmation = 
      response.includes('confirm') ||
      response.includes('are you sure') ||
      response.includes('warning') ||
      response.includes('cannot undo') ||
      response.includes('this will')

    // Or refuse the operation
    const refusesOperation = 
      response.includes("can't") ||
      response.includes('cannot') ||
      response.includes('not allowed') ||
      response.includes('not supported')

    if (!hasConfirmation && !refusesOperation && data.saved) {
      result.issues.push('Executed destructive operation without confirmation')
      result.status = 'FAIL'
    } else {
      result.status = 'NEEDS_REVIEW'
      result.issues.push('Verify destructive operation handling')
    }
  }

  private analyzeSecurity(testCase: TestCase, data: any, result: TestResult) {
    const securityChecks = data.securityChecks || {}
    const input = data.input || {}
    const parseResult = data.parseResult || {}
    
    // Test 86: XSS - Script tags should be detected and sanitized
    if (testCase.id === 86) {
      if (securityChecks.hasScript && input.wasSanitized) {
        result.status = 'PASS'
        console.log('   ✅ XSS detected and sanitized')
        return
      }
      if (!securityChecks.hasScript) {
        result.issues.push('CRITICAL: Script tag not detected')
        result.status = 'FAIL'
      } else if (!input.wasSanitized) {
        result.issues.push('CRITICAL: XSS not sanitized')
        result.status = 'FAIL'
      }
      return
    }

    // Test 87: SQL Injection detection
    if (testCase.id === 87) {
      if (securityChecks.hasSqlInjection) {
        result.status = 'PASS'
        console.log('   ✅ SQL injection pattern detected')
        return
      }
      result.issues.push('SQL injection pattern not detected')
      result.status = 'NEEDS_REVIEW'
      return
    }

    // Test 88: Prototype pollution
    if (testCase.id === 88) {
      if (securityChecks.hasPrototypePollution) {
        result.status = 'PASS'
        console.log('   ✅ Prototype pollution pattern detected')
        return
      }
      result.issues.push('Prototype pollution not detected')
      result.status = 'NEEDS_REVIEW'
      return
    }

    // Test 89: Env var exposure
    if (testCase.id === 89) {
      if (securityChecks.hasEnvVar) {
        result.status = 'PASS'
        console.log('   ✅ Env var pattern detected')
        return
      }
      result.status = 'NEEDS_REVIEW'
      result.issues.push('Env var pattern detection: review needed')
      return
    }

    // Test 90: Path traversal
    if (testCase.id === 90) {
      if (securityChecks.hasPathTraversal) {
        result.status = 'PASS'
        console.log('   ✅ Path traversal pattern detected')
        return
      }
      result.issues.push('Path traversal pattern not detected')
      result.status = 'NEEDS_REVIEW'
      return
    }

    // Test 91: JavaScript URL
    if (testCase.id === 91) {
      if (securityChecks.hasJavascriptUrl && input.wasSanitized) {
        result.status = 'PASS'
        console.log('   ✅ JavaScript URL detected and sanitized')
        return
      }
      if (!securityChecks.hasJavascriptUrl) {
        result.issues.push('JavaScript URL not detected')
        result.status = 'FAIL'
      } else if (!input.wasSanitized) {
        result.issues.push('JavaScript URL not sanitized')
        result.status = 'FAIL'
      }
      return
    }

    // Test 92: Long input handling
    if (testCase.id === 92) {
      if (parseResult.reason === 'Input too long' || data.parseResult?.handled === 'rejected') {
        result.status = 'PASS'
        console.log('   ✅ Long input handled correctly')
        return
      }
      if (data.error) {
        result.status = 'NEEDS_REVIEW'
        result.issues.push('Long input may have caused error (review)')
        return
      }
      result.status = 'PASS'
      console.log('   ✅ Long input processed without crash')
      return
    }

    result.status = 'PASS'
  }

  private analyzeUnicode(testCase: TestCase, data: any, result: TestResult) {
    const response = data.response || ''
    
    // Check if Unicode characters are preserved
    if (testCase.id === 93 && data.saved) {
      if (!response.includes('☕') && !response.includes('café')) {
        result.issues.push('Unicode characters may have been stripped')
        result.status = 'NEEDS_REVIEW'
      }
    }

    if (testCase.id === 96 && data.saved) {
      if (!response.includes('🍕')) {
        result.issues.push('Emoji may have been stripped')
        result.status = 'NEEDS_REVIEW'
      }
    }

    if (testCase.id === 100) {
      // Check if comma was handled in number
      if (data.data?.metadata?.amount === 1 || data.data?.metadata?.amount === 1000) {
        result.issues.push('Comma parsing issue - check if 1000.50 was parsed correctly')
        result.status = 'NEEDS_REVIEW'
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Edge Case Testing Suite')
    console.log(`📋 Testing ${TEST_CASES.length} commands across ${new Set(TEST_CASES.map(t => t.category)).size} categories`)
    console.log('='.repeat(80))

    for (const testCase of TEST_CASES) {
      const result = await this.testCommand(testCase)
      this.results.push(result)
      
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    this.printSummary()
    this.saveResults()
  }

  async runCategory(category: string) {
    const categoryTests = TEST_CASES.filter(t => t.category === category)
    console.log(`🚀 Testing ${categoryTests.length} commands in category: ${category}`)
    console.log('='.repeat(80))

    for (const testCase of categoryTests) {
      const result = await this.testCommand(testCase)
      this.results.push(result)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    this.printSummary()
    this.saveResults()
  }

  async runSingle(id: number) {
    const testCase = TEST_CASES.find(t => t.id === id)
    if (!testCase) {
      console.log(`❌ Test case #${id} not found`)
      return
    }

    const result = await this.testCommand(testCase)
    this.results.push(result)
    console.log('\n📊 Result:', JSON.stringify(result, null, 2))
  }

  private printSummary() {
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(80))

    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const errors = this.results.filter(r => r.status === 'ERROR').length
    const needsReview = this.results.filter(r => r.status === 'NEEDS_REVIEW').length
    const total = this.results.length

    console.log(`\nTotal Tests: ${total}`)
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`)
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`)
    console.log(`⚠️ Errors: ${errors} (${((errors / total) * 100).toFixed(1)}%)`)
    console.log(`🟡 Needs Review: ${needsReview} (${((needsReview / total) * 100).toFixed(1)}%)`)

    // Group by category
    const categories = new Set(this.results.map(r => r.category))
    console.log('\n📋 RESULTS BY CATEGORY:\n')

    for (const category of categories) {
      const catResults = this.results.filter(r => r.category === category)
      const catPassed = catResults.filter(r => r.status === 'PASS').length
      const catFailed = catResults.filter(r => r.status === 'FAIL').length
      const catErrors = catResults.filter(r => r.status === 'ERROR').length
      const catReview = catResults.filter(r => r.status === 'NEEDS_REVIEW').length
      
      const emoji = catFailed > 0 || catErrors > 0 ? '❌' : catReview > 0 ? '🟡' : '✅'
      console.log(`${emoji} ${category}: ${catPassed} pass, ${catFailed} fail, ${catErrors} error, ${catReview} review`)

      // Show failed tests
      catResults.filter(r => r.status === 'FAIL' || r.status === 'ERROR').forEach(r => {
        console.log(`   #${r.id}: "${r.command.substring(0, 40)}..."`)
        r.issues.forEach(issue => console.log(`      → ${issue}`))
      })
    }

    // Average execution time
    const avgTime = this.results.reduce((sum, r) => sum + r.executionTime, 0) / this.results.length
    console.log(`\n⏱️ Average execution time: ${avgTime.toFixed(0)}ms`)

    // Critical security issues
    const securityFails = this.results.filter(r => 
      r.category === 'Security' && r.status === 'FAIL'
    )
    if (securityFails.length > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES:')
      securityFails.forEach(r => {
        console.log(`   #${r.id}: ${r.issues.join(', ')}`)
      })
    }
  }

  private saveResults() {
    const fs = require('fs')
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        errors: this.results.filter(r => r.status === 'ERROR').length,
        needsReview: this.results.filter(r => r.status === 'NEEDS_REVIEW').length
      },
      results: this.results
    }

    const path = '/Users/robertsennabaum/new project/EDGE_CASE_TEST_RESULTS.json'
    fs.writeFileSync(path, JSON.stringify(report, null, 2))
    console.log(`\n💾 Full results saved to: EDGE_CASE_TEST_RESULTS.json`)
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const tester = new EdgeCaseTester()

  if (args[0] === '--category') {
    await tester.runCategory(args[1])
  } else if (args[0] === '--id') {
    await tester.runSingle(parseInt(args[1]))
  } else if (args[0] === '--help') {
    console.log(`
Edge Case Command Tester

Usage:
  npx ts-node scripts/test-edge-cases.ts              # Run all 100 tests
  npx ts-node scripts/test-edge-cases.ts --category "Security"  # Run category
  npx ts-node scripts/test-edge-cases.ts --id 86     # Run single test

Categories:
  - Edge Case Parsing
  - Multi-Intent
  - Ambiguous
  - Domain Routing
  - Date/Time
  - Destructive
  - Security
  - Unicode
`)
  } else {
    await tester.runAllTests()
  }
}

main().catch(console.error)

