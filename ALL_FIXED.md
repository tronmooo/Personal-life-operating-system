🔧 What's Missing (Gap Analysis)
OpenAI Function Calling Integration: The AI can't autonomously decide which action to call
Multi-Step Conversations: Assistant can't gather missing data through follow-ups
Schema Coverage: Missing schemas for: insurance, appliances, relationships, digital, mindfulness, fitness, nutrition, services, miscellaneous
Unified Entry Point: No single API that converts natural language → action execution
🚀 Development Plan (Step-by-Step Prompts)
Phase 1: Enhanced AI Function Calling System
Step 1.1: Create Comprehensive OpenAI Function Definitions
Prompt to use:
Create a new file `lib/ai/openai-function-definitions.ts` that exports 
OpenAI function-calling definitions for ALL AI actions from the command-catalog.ts.

Include functions for:
1. create_entry(domain, title, description, metadata) - Creates any domain entry
2. update_entry(id, updates) - Updates any entry
3. delete_entry(id) or delete_entries(match_criteria) - Deletes entries
4. search_entries(domain, query, dateRange) - Searches data
5. analyze_data(domain, analysisType, dateRange) - Analyzes domain data
6. predict_trend(domain, metric, daysAhead) - Predicts future values
7. correlate_domains(domain1, domain2, metric1, metric2) - Cross-domain analysis
8. export_data(domain, format, dateRange) - Exports to CSV/JSON
9. create_task(title, dueDate, priority) - Creates a task
10. create_habit(name, frequency) - Creates a habit
11. create_bill(name, amount, dueDate, recurring) - Creates a bill
12. create_event(title, date, time, location) - Creates calendar event
13. add_to_google_calendar(title, date, time, duration) - Adds to Google Calendar
14. navigate(destination) - Navigates to app page
15. open_tool(toolName) - Opens calculator/tool
16. generate_report(domain, reportType, dateRange) - Generates reports
17. execute_calculation(calculationType, inputs) - Runs financial/health calculators

Use the OpenAI function calling format with proper parameter descriptions.
Reference types/domains.ts for domain types and types/domain-metadata.ts for metadata schemas.
Create a new file `lib/ai/openai-function-definitions.ts` that exports OpenAI function-calling definitions for ALL AI actions from the command-catalog.ts.Include functions for:1. create_entry(domain, title, description, metadata) - Creates any domain entry2. update_entry(id, updates) - Updates any entry3. delete_entry(id) or delete_entries(match_criteria) - Deletes entries4. search_entries(domain, query, dateRange) - Searches data5. analyze_data(domain, analysisType, dateRange) - Analyzes domain data6. predict_trend(domain, metric, daysAhead) - Predicts future values7. correlate_domains(domain1, domain2, metric1, metric2) - Cross-domain analysis8. export_data(domain, format, dateRange) - Exports to CSV/JSON9. create_task(title, dueDate, priority) - Creates a task10. create_habit(name, frequency) - Creates a habit11. create_bill(name, amount, dueDate, recurring) - Creates a bill12. create_event(title, date, time, location) - Creates calendar event13. add_to_google_calendar(title, date, time, duration) - Adds to Google Calendar14. navigate(destination) - Navigates to app page15. open_tool(toolName) - Opens calculator/tool16. generate_report(domain, reportType, dateRange) - Generates reports17. execute_calculation(calculationType, inputs) - Runs financial/health calculatorsUse the OpenAI function calling format with proper parameter descriptions.Reference types/domains.ts for domain types and types/domain-metadata.ts for metadata schemas.
Step 1.2: Create Action Executor
Prompt to use:
Create `lib/ai/action-executor.ts` that:

1. Takes a function call response from OpenAI
2. Maps the function name to the appropriate API endpoint:
   - create_entry → POST /api/ai-assistant/actions { action: 'create_entry', ... }
   - delete_entry → POST /api/ai-assistant/actions { action: 'delete', ... }
   - etc.
3. Executes the action with proper error handling
4. Returns a structured response for the AI to communicate back

Include:
- executeAction(functionName, parameters, userId) function
- Map all 20+ actions from command-catalog.ts
- Handle confirmation flows for destructive operations
- Return human-readable results for the AI to report
Create `lib/ai/action-executor.ts` that:1. Takes a function call response from OpenAI2. Maps the function name to the appropriate API endpoint:   - create_entry → POST /api/ai-assistant/actions { action: 'create_entry', ... }   - delete_entry → POST /api/ai-assistant/actions { action: 'delete', ... }   - etc.3. Executes the action with proper error handling4. Returns a structured response for the AI to communicate backInclude:- executeAction(functionName, parameters, userId) function- Map all 20+ actions from command-catalog.ts- Handle confirmation flows for destructive operations- Return human-readable results for the AI to report
Step 1.3: Create Unified AI Chat with Function Calling
Prompt to use:
Update `app/api/ai-assistant/intelligent-chat/route.ts` to:

1. Import the OpenAI function definitions from step 1.1
2. On each user message:
   a. Build context from user's Supabase data (already done)
   b. Include function definitions in the OpenAI API call
   c. If OpenAI returns a function_call:
      - Execute it using the action-executor from step 1.2
      - Add the result to the conversation
      - Call OpenAI again for a human-friendly response
   d. If no function call, return the direct response

3. Include the COMMAND_CATALOG_PROMPT from command-catalog.ts in the system prompt
4. Add streaming support for real-time responses

The system prompt should tell the AI:
- All available actions it can perform
- All 14 domains and their purposes
- To ask clarifying questions when data is incomplete
- To confirm before destructive actions (delete, bulk operations)
Update `app/api/ai-assistant/intelligent-chat/route.ts` to:1. Import the OpenAI function definitions from step 1.12. On each user message:   a. Build context from user's Supabase data (already done)   b. Include function definitions in the OpenAI API call   c. If OpenAI returns a function_call:      - Execute it using the action-executor from step 1.2      - Add the result to the conversation      - Call OpenAI again for a human-friendly response   d. If no function call, return the direct response3. Include the COMMAND_CATALOG_PROMPT from command-catalog.ts in the system prompt4. Add streaming support for real-time responsesThe system prompt should tell the AI:- All available actions it can perform- All 14 domains and their purposes- To ask clarifying questions when data is incomplete- To confirm before destructive actions (delete, bulk operations)
Phase 2: Complete Domain Schemas
Step 2.1: Add Missing Domain Schemas
Prompt to use:
Extend `lib/ai/domain-field-schemas.ts` to add schemas for ALL 14 domains.

Add these missing schemas:

INSURANCE_SCHEMAS:
- policy (policyType, provider, policyNumber, premium, deductible, coverageAmount, renewalDate)
- claim (policyId, claimType, amount, status, dateSubmitted)
- legal_document (documentType, attorney, caseNumber, filingDate)

APPLIANCES_SCHEMAS:
- appliance (name, brand, model, serialNumber, purchaseDate, warrantyExpiry, location)
- maintenance_record (applianceId, serviceType, cost, date, provider)

RELATIONSHIPS_SCHEMAS:
- person (name, relationshipType, birthday, phone, email, address)
- important_date (personId, dateType, date, reminderDays)
- gift_idea (personId, idea, occasion, priceRange)

DIGITAL_SCHEMAS:
- subscription (serviceName, category, monthlyCost, renewalDate, username)
- password_entry (serviceName, username, passwordStrength, lastChanged)
- domain_name (domain, registrar, expiryDate, autoRenew)

MINDFULNESS_SCHEMAS:
- meditation (duration, type, mood_before, mood_after)
- journal_entry (entryType, content, mood, date)
- gratitude (items, date)

FITNESS_SCHEMAS:
- workout (activityType, duration, calories, distance, exercises)
- goal (goalType, targetValue, currentValue, deadline)
- body_measurement (weight, bodyFat, muscle, date)

NUTRITION_SCHEMAS:
- meal (mealType, name, calories, protein, carbs, fat)
- water_intake (amount, unit, date)
- food_log (items, totalCalories, date)

SERVICES_SCHEMAS:
- service_provider (serviceType, providerName, monthlyCost, contractEnd, rating)
- comparison (serviceType, competitors, savingsFound, date)

MISCELLANEOUS_SCHEMAS:
- collectible (name, category, value, condition, purchaseDate)
- boat (name, make, model, year, registration)
- jewelry (name, type, value, insuredValue)

Follow the same pattern as existing schemas with required fields and followUpQuestion.
Extend `lib/ai/domain-field-schemas.ts` to add schemas for ALL 14 domains.Add these missing schemas:INSURANCE_SCHEMAS:- policy (policyType, provider, policyNumber, premium, deductible, coverageAmount, renewalDate)- claim (policyId, claimType, amount, status, dateSubmitted)- legal_document (documentType, attorney, caseNumber, filingDate)APPLIANCES_SCHEMAS:- appliance (name, brand, model, serialNumber, purchaseDate, warrantyExpiry, location)- maintenance_record (applianceId, serviceType, cost, date, provider)RELATIONSHIPS_SCHEMAS:- person (name, relationshipType, birthday, phone, email, address)- important_date (personId, dateType, date, reminderDays)- gift_idea (personId, idea, occasion, priceRange)DIGITAL_SCHEMAS:- subscription (serviceName, category, monthlyCost, renewalDate, username)- password_entry (serviceName, username, passwordStrength, lastChanged)- domain_name (domain, registrar, expiryDate, autoRenew)MINDFULNESS_SCHEMAS:- meditation (duration, type, mood_before, mood_after)- journal_entry (entryType, content, mood, date)- gratitude (items, date)FITNESS_SCHEMAS:- workout (activityType, duration, calories, distance, exercises)- goal (goalType, targetValue, currentValue, deadline)- body_measurement (weight, bodyFat, muscle, date)NUTRITION_SCHEMAS:- meal (mealType, name, calories, protein, carbs, fat)- water_intake (amount, unit, date)- food_log (items, totalCalories, date)SERVICES_SCHEMAS:- service_provider (serviceType, providerName, monthlyCost, contractEnd, rating)- comparison (serviceType, competitors, savingsFound, date)MISCELLANEOUS_SCHEMAS:- collectible (name, category, value, condition, purchaseDate)- boat (name, make, model, year, registration)- jewelry (name, type, value, insuredValue)Follow the same pattern as existing schemas with required fields and followUpQuestion.
Phase 3: Smart Conversation Management
Step 3.1: Create Conversation State Manager
Prompt to use:
Create `lib/ai/conversation-manager.ts` that:

1. Stores conversation state including:
   - pendingEntry: Partial entry data being collected
   - missingFields: Fields still needed
   - currentDomain: Active domain context
   - lastAction: What action was last attempted

2. Implements stateful conversation flow:
   - detectIntent(message) → Determines what user wants to do
   - extractData(message, schema) → Pulls field values from natural language
   - checkCompleteness(data, schema) → Returns missing required fields
   - generateFollowUp(missingFields) → Creates natural follow-up question
   - buildEntry(data, schema) → Constructs complete entry with defaults

3. Uses Redis or Supabase to persist state between API calls
   (Can also use in-memory Map with TTL for simpler implementation)

4. Example flow:
   User: "I spent $45 at Walmart"
   → detectIntent: create expense in financial domain
   → extractData: { amount: 45, payee: "Walmart" }
   → checkCompleteness: missing 'category' (optional but valuable)
   → generateFollowUp: "Got it! What category is this? (Food, Shopping, etc.)"
   User: "Shopping"
   → extractData: { category: "Shopping" }
   → buildEntry: Complete expense entry
   → Execute create_entry action
Create `lib/ai/conversation-manager.ts` that:1. Stores conversation state including:   - pendingEntry: Partial entry data being collected   - missingFields: Fields still needed   - currentDomain: Active domain context   - lastAction: What action was last attempted2. Implements stateful conversation flow:   - detectIntent(message) → Determines what user wants to do   - extractData(message, schema) → Pulls field values from natural language   - checkCompleteness(data, schema) → Returns missing required fields   - generateFollowUp(missingFields) → Creates natural follow-up question   - buildEntry(data, schema) → Constructs complete entry with defaults3. Uses Redis or Supabase to persist state between API calls   (Can also use in-memory Map with TTL for simpler implementation)4. Example flow:   User: "I spent $45 at Walmart"   → detectIntent: create expense in financial domain   → extractData: { amount: 45, payee: "Walmart" }   → checkCompleteness: missing 'category' (optional but valuable)   → generateFollowUp: "Got it! What category is this? (Food, Shopping, etc.)"   User: "Shopping"   → extractData: { category: "Shopping" }   → buildEntry: Complete expense entry   → Execute create_entry action
Step 3.2: Create Natural Language Parser
Prompt to use:
Create `lib/ai/natural-language-parser.ts` that:

1. Uses GPT-4 to parse natural language into structured data
2. Implements parseMessage(message, expectedSchema) function
3. Handles various natural language patterns:
   - "My weight is 175 lbs" → { domain: 'health', type: 'weight', value: 175, unit: 'lbs' }
   - "Spent $50 on groceries at Kroger" → { domain: 'financial', type: 'expense', amount: 50, category: 'Food', payee: 'Kroger' }
   - "Add a vet appointment for Max on Tuesday" → { domain: 'pets', type: 'vet_appointment', petName: 'Max', date: '2025-12-30' }
   - "Log 10,000 steps" → { domain: 'fitness', type: 'workout', steps: 10000 }
   - "My blood pressure is 120/80" → { domain: 'health', type: 'blood_pressure', systolic: 120, diastolic: 80 }

4. Date parsing intelligence:
   - "today", "tomorrow", "next Tuesday", "in 2 weeks" → ISO date strings

5. Currency parsing:
   - "$45", "45 dollars", "forty-five bucks" → 45

6. Unit normalization:
   - "175 pounds", "175 lbs" → { value: 175, unit: 'lbs' }
   - "2 miles", "2mi" → { distance: 2, unit: 'miles' }
Create `lib/ai/natural-language-parser.ts` that:1. Uses GPT-4 to parse natural language into structured data2. Implements parseMessage(message, expectedSchema) function3. Handles various natural language patterns:   - "My weight is 175 lbs" → { domain: 'health', type: 'weight', value: 175, unit: 'lbs' }   - "Spent $50 on groceries at Kroger" → { domain: 'financial', type: 'expense', amount: 50, category: 'Food', payee: 'Kroger' }   - "Add a vet appointment for Max on Tuesday" → { domain: 'pets', type: 'vet_appointment', petName: 'Max', date: '2025-12-30' }   - "Log 10,000 steps" → { domain: 'fitness', type: 'workout', steps: 10000 }   - "My blood pressure is 120/80" → { domain: 'health', type: 'blood_pressure', systolic: 120, diastolic: 80 }4. Date parsing intelligence:   - "today", "tomorrow", "next Tuesday", "in 2 weeks" → ISO date strings5. Currency parsing:   - "$45", "45 dollars", "forty-five bucks" → 456. Unit normalization:   - "175 pounds", "175 lbs" → { value: 175, unit: 'lbs' }   - "2 miles", "2mi" → { distance: 2, unit: 'miles' }
Phase 4: Multi-Entry & Batch Operations
Step 4.1: Multi-Entry Creation
Prompt to use:
Enhance `app/api/ai-assistant/multi-entry/route.ts` to:

1. Accept multiple entries in a single request:
   {
     entries: [
       { domain: 'financial', type: 'expense', data: {...} },
       { domain: 'health', type: 'weight', data: {...} }
     ]
   }

2. Support "compound" natural language:
   "My weight is 175 and I walked 5000 steps and spent $12 on lunch"
   → Creates 3 entries across 2 domains

3. Parse voice commands that log multiple things:
   "Log breakfast at 400 calories, 30g protein"
   → Creates nutrition entry with all macros

4. Return structured response:
   {
     created: [{ id, domain, title }...],
     failed: [{ data, error }...],
     summary: "Created 3 entries: 1 health, 1 fitness, 1 financial"
   }
Enhance `app/api/ai-assistant/multi-entry/route.ts` to:1. Accept multiple entries in a single request:   {     entries: [       { domain: 'financial', type: 'expense', data: {...} },       { domain: 'health', type: 'weight', data: {...} }     ]   }2. Support "compound" natural language:   "My weight is 175 and I walked 5000 steps and spent $12 on lunch"   → Creates 3 entries across 2 domains3. Parse voice commands that log multiple things:   "Log breakfast at 400 calories, 30g protein"   → Creates nutrition entry with all macros4. Return structured response:   {     created: [{ id, domain, title }...],     failed: [{ data, error }...],     summary: "Created 3 entries: 1 health, 1 fitness, 1 financial"   }
Phase 5: Advanced AI Capabilities
Step 5.1: Proactive Insights Engine
Prompt to use:
Create `lib/ai/proactive-insights-engine.ts` that:

1. Runs daily/weekly analysis on user data
2. Generates actionable insights like:
   - "Your gym attendance dropped 40% this month"
   - "You've exceeded your dining budget by $120"
   - "Your car is due for an oil change (5,000 miles since last service)"
   - "Your home insurance renews in 14 days"
   - "You haven't logged weight in 7 days"

3. Cross-domain correlations:
   - "Days you meditate, your mood score is 25% higher"
   - "Your spending increases by $200 on weeks with less sleep"

4. Anomaly detection:
   - "Unusual $500 charge detected at Merchant XYZ"
   - "Blood pressure reading significantly higher than your average"

5. Goal progress tracking:
   - "You're 60% of the way to your weight goal!"
   - "At current savings rate, you'll reach $10K in 4 months"

Store insights in Supabase `notifications` table with type: 'ai_insight'
Create `lib/ai/proactive-insights-engine.ts` that:1. Runs daily/weekly analysis on user data2. Generates actionable insights like:   - "Your gym attendance dropped 40% this month"   - "You've exceeded your dining budget by $120"   - "Your car is due for an oil change (5,000 miles since last service)"   - "Your home insurance renews in 14 days"   - "You haven't logged weight in 7 days"3. Cross-domain correlations:   - "Days you meditate, your mood score is 25% higher"   - "Your spending increases by $200 on weeks with less sleep"4. Anomaly detection:   - "Unusual $500 charge detected at Merchant XYZ"   - "Blood pressure reading significantly higher than your average"5. Goal progress tracking:   - "You're 60% of the way to your weight goal!"   - "At current savings rate, you'll reach $10K in 4 months"Store insights in Supabase `notifications` table with type: 'ai_insight'
Step 5.2: Smart Suggestions
Prompt to use:
Create `lib/ai/smart-suggestions.ts` that:

1. Provides context-aware suggestions based on:
   - Time of day: Morning → "Log your weight?" Mealtime → "Log what you ate?"
   - Location: Near home → "Any home maintenance done?"
   - Recent activity: Just logged expense → "Would you like to categorize other pending transactions?"
   - Calendar events: Upcoming vet appt → "Max has a vet appointment tomorrow"

2. Implements getSuggestions(userId, context) function that returns:
   [
     { type: 'log_prompt', message: "Log today's weight?", quickAction: { domain: 'health', type: 'weight' } },
     { type: 'reminder', message: "Car insurance renews in 5 days", quickAction: { navigate: '/domains/insurance' } },
     { type: 'insight', message: "You're $50 under budget this week! 🎉", quickAction: null }
   ]

3. Priority ranking based on urgency and user habits
Create `lib/ai/smart-suggestions.ts` that:1. Provides context-aware suggestions based on:   - Time of day: Morning → "Log your weight?" Mealtime → "Log what you ate?"   - Location: Near home → "Any home maintenance done?"   - Recent activity: Just logged expense → "Would you like to categorize other pending transactions?"   - Calendar events: Upcoming vet appt → "Max has a vet appointment tomorrow"2. Implements getSuggestions(userId, context) function that returns:   [     { type: 'log_prompt', message: "Log today's weight?", quickAction: { domain: 'health', type: 'weight' } },     { type: 'reminder', message: "Car insurance renews in 5 days", quickAction: { navigate: '/domains/insurance' } },     { type: 'insight', message: "You're $50 under budget this week! 🎉", quickAction: null }   ]3. Priority ranking based on urgency and user habits
Phase 6: Voice Command Enhancement
Step 6.1: Enhanced Voice Parser
Prompt to use:
Update `app/api/voice/parse-command/route.ts` to:

1. Support ALL 14 domains (currently limited subset)
2. Handle compound commands: "Log weight 175 and 8000 steps"
3. Support queries: "How much did I spend on food this month?"
4. Support updates: "Change my car's mileage to 50000"
5. Support deletions: "Delete my last weight entry"

Add regex patterns for:
- Relationships: "Add John's birthday March 15"
- Digital: "Add Netflix subscription $15.99 monthly"
- Mindfulness: "Log 20 minute meditation"
- Services: "Add internet provider Comcast $79.99"

Test with VOICE_EXAMPLE_COMMANDS from command-catalog.ts
Update `app/api/voice/parse-command/route.ts` to:1. Support ALL 14 domains (currently limited subset)2. Handle compound commands: "Log weight 175 and 8000 steps"3. Support queries: "How much did I spend on food this month?"4. Support updates: "Change my car's mileage to 50000"5. Support deletions: "Delete my last weight entry"Add regex patterns for:- Relationships: "Add John's birthday March 15"- Digital: "Add Netflix subscription $15.99 monthly"- Mindfulness: "Log 20 minute meditation"- Services: "Add internet provider Comcast $79.99"Test with VOICE_EXAMPLE_COMMANDS from command-catalog.ts
Phase 7: Testing & Documentation
Step 7.1: AI Assistant Test Suite
Prompt to use:
Create `__tests__/ai-assistant/` with tests for:

1. Function calling:
   - Test each of the 17+ functions gets called correctly
   - Test parameter extraction from natural language
   - Test error handling for invalid parameters

2. Conversation flow:
   - Test multi-turn conversations
   - Test field collection follow-ups
   - Test confirmation dialogs for destructive actions

3. Domain coverage:
   - Test entry creation for all 14 domains
   - Test all entry types per domain (financial has 9 types, etc.)

4. Edge cases:
   - Ambiguous messages
   - Multiple domains mentioned
   - Date parsing edge cases
   - Currency/number parsing
Create `__tests__/ai-assistant/` with tests for:1. Function calling:   - Test each of the 17+ functions gets called correctly   - Test parameter extraction from natural language   - Test error handling for invalid parameters2. Conversation flow:   - Test multi-turn conversations   - Test field collection follow-ups   - Test confirmation dialogs for destructive actions3. Domain coverage:   - Test entry creation for all 14 domains   - Test all entry types per domain (financial has 9 types, etc.)4. Edge cases:   - Ambiguous messages   - Multiple domains mentioned   - Date parsing edge cases   - Currency/number parsing
Step 7.2: Document All AI Capabilities
Prompt to use:
Create `docs/AI_ASSISTANT_CAPABILITIES.md` documenting:

1. All supported commands with examples:
   - Creating entries in each domain
   - Updating/deleting entries
   - Querying data
   - Running analysis
   - Generating reports

2. Voice command examples for each domain
3. How confirmations work for destructive operations
4. How multi-entry logging works
5. How to trigger insights and predictions
6. Integration with Google Calendar

Make it user-friendly so you can reference what the AI can do.
Create `docs/AI_ASSISTANT_CAPABILITIES.md` documenting:1. All supported commands with examples:   - Creating entries in each domain   - Updating/deleting entries   - Querying data   - Running analysis   - Generating reports2. Voice command examples for each domain3. How confirmations work for destructive operations4. How multi-entry logging works5. How to trigger insights and predictions6. Integration with Google CalendarMake it user-friendly so you can reference what the AI can do.
📋 Quick Reference: What Your AI Will Be Able To Do
After implementing this plan, your AI assistant will be able to:
Category	Capabilities
Create	Any entry in any of 14 domains, tasks, habits, bills, calendar events
Read/Query	Search across all domains, filter by date/type, find duplicates
Update	Modify any field of any entry by ID or description match
Delete	Single or bulk delete with confirmation
Analyze	Spending patterns, health trends, goal progress, cross-domain correlations
Predict	Weight trends, savings projections, expense forecasts
Export	JSON, CSV for any domain or all data
Calculate	BMI, compound interest, mortgage, calorie needs, etc.
Navigate	Open any page, tool, or calculator
Integrate	Add events to Google Calendar, sync with Gmail
Report	Generate summary reports for any time period
Voice	Handle natural language voice commands
Would you like me to start with any specific phase, or provide more detail on any step? I can also switch to Agent mode to begin implementing these changes if you're ready to start coding.