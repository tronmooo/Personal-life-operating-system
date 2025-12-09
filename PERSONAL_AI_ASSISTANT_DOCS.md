# Personal AI Calling Assistant - Complete Documentation

## Overview

The Personal AI Calling Assistant is a comprehensive system that allows users to delegate phone calls to an AI agent. The system handles everything from natural language task creation to post-call data extraction.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 / Google Gemini
- **Telephony**: Twilio Voice API
- **Real-time**: Supabase Realtime Subscriptions

### Data Flow

```
User Input → AI Planning → Task Creation → Call Preparation → 
Call Execution → Real-time Updates → Post-Call Processing → Results
```

## Database Schema

### Tables

#### `contacts`
Stores contact information for easy reuse in calls.
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- name: TEXT
- company_name: TEXT
- phone_number: TEXT
- email: TEXT
- notes: TEXT
- created_at, updated_at: TIMESTAMPTZ
```

#### `assistant_settings`
User preferences for the calling assistant.
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users, UNIQUE)
- voice_preference: TEXT (default: 'professional_male')
- default_tone: TEXT (default: 'friendly')
- max_auto_approve_amount: NUMERIC (default: 100)
- auto_retry_failed_calls: BOOLEAN (default: false)
- max_retry_attempts: INTEGER (default: 2)
- business_hours_only: BOOLEAN (default: false)
- language_preference: TEXT (default: 'en-US')
- created_at, updated_at: TIMESTAMPTZ
```

#### `call_tasks`
Main task tracking table.
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- title: TEXT
- raw_instruction: TEXT (user's natural language input)
- status: TEXT (pending|preparing|waiting_for_user|ready_to_call|
               in_progress|completed|failed|cancelled)
- priority: TEXT (low|normal|high|urgent)
- target_phone_number: TEXT
- contact_id: UUID (FK → contacts, nullable)
- ai_plan: JSONB (structured AI planning output)
- user_clarifications: JSONB (user-provided additional info)
- created_at, updated_at: TIMESTAMPTZ
- scheduled_for: TIMESTAMPTZ (nullable)
```

#### `call_sessions`
Tracks individual call attempts.
```sql
- id: UUID (PK)
- call_task_id: UUID (FK → call_tasks)
- provider_call_sid: TEXT (Twilio Call SID)
- status: TEXT (initiated|ringing|connected|completed|failed|cancelled)
- phone_number_called: TEXT
- ai_call_script: JSONB (generated script for the call)
- started_at: TIMESTAMPTZ
- ended_at: TIMESTAMPTZ (nullable)
- duration_seconds: INTEGER (nullable)
- recording_url: TEXT (nullable)
- failure_reason: TEXT (nullable)
- retry_count: INTEGER (default: 0)
```

#### `call_transcripts`
Full transcript storage with AI summary.
```sql
- id: UUID (PK)
- call_session_id: UUID (FK → call_sessions)
- full_transcript: TEXT
- ai_summary: TEXT (nullable)
- sentiment_overall: TEXT (nullable: positive|neutral|negative)
- goal_achieved: BOOLEAN (nullable)
- follow_up_required: BOOLEAN (default: false)
- follow_up_tasks: JSONB (nullable)
- created_at: TIMESTAMPTZ
```

#### `call_transcript_segments`
Timestamped turn-by-turn conversation.
```sql
- id: UUID (PK)
- call_transcript_id: UUID (FK → call_transcripts)
- speaker: TEXT (assistant|human|system)
- content: TEXT
- timestamp_ms: INTEGER (milliseconds from call start)
- confidence: NUMERIC (nullable)
- created_at: TIMESTAMPTZ
```

#### `call_extracted_data`
Structured data extraction from calls.
```sql
- id: UUID (PK)
- call_session_id: UUID (FK → call_sessions)
- data_type: TEXT (price|appointment|confirmation_number|
                   name|business_name|hours|instructions|other)
- extracted_value: JSONB
- confidence: NUMERIC (nullable)
- created_at: TIMESTAMPTZ
```

#### `notifications`
User notifications for call status updates.
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- call_task_id: UUID (FK → call_tasks, nullable)
- call_session_id: UUID (FK → call_sessions, nullable)
- notification_type: TEXT (task_created|call_started|call_completed|
                          call_failed|approval_needed|clarification_needed)
- message: TEXT
- is_read: BOOLEAN (default: false)
- priority: TEXT (low|normal|high)
- created_at: TIMESTAMPTZ
```

## API Endpoints

### Call Tasks

#### `POST /api/call-tasks`
Create a new call task from natural language instructions.

**Request:**
```json
{
  "raw_instruction": "Call my dentist at 555-1234 and book a cleaning for next week under $100",
  "priority": "normal",
  "scheduled_for": "2025-12-01T10:00:00Z" // optional
}
```

**Response:**
```json
{
  "success": true,
  "call_task": {
    "id": "uuid",
    "status": "ready_to_call",
    "title": "Book dental cleaning appointment",
    // ... other fields
  },
  "ai_plan": {
    "goal": "Book dental cleaning appointment",
    "steps": ["Call dentist", "Request appointment", "Confirm price"],
    "questionsToAsk": ["What date works best?"],
    "missingInfo": [],
    "requiresClarification": false,
    "hardConstraints": { "max_price": 100 },
    "softPreferences": { "preferred_day": "next week" }
  },
  "requires_clarification": false
}
```

#### `GET /api/call-tasks?status=ready_to_call&limit=20`
List call tasks with optional filtering.

#### `GET /api/call-tasks/[id]`
Get details of a specific call task.

#### `PATCH /api/call-tasks/[id]`
Update a call task (provide clarifications, change status, etc.).

**Request:**
```json
{
  "target_phone_number": "+15551234567",
  "user_clarifications": {
    "preferred_date": "2025-12-05",
    "preferred_time": "afternoon"
  }
}
```

#### `DELETE /api/call-tasks/[id]`
Cancel/delete a call task.

#### `POST /api/call-tasks/[id]/start-call`
Initiate the actual phone call.

**Response:**
```json
{
  "success": true,
  "call_session": {
    "id": "uuid",
    "status": "initiated",
    "provider_call_sid": "CA123...",
    "phone_number_called": "+15551234567"
  }
}
```

### Call Sessions

#### `GET /api/call-sessions/[id]`
Get details of a specific call session including status and transcript.

#### `POST /api/call-sessions/[id]/process`
Trigger post-call processing (summarization and data extraction).

**Response:**
```json
{
  "success": true,
  "summary": "Appointment successfully booked for Dec 5 at 2 PM. Cost: $75.",
  "extracted_data": [
    {
      "data_type": "appointment",
      "extracted_value": {
        "date": "2025-12-05",
        "time": "14:00",
        "confirmationNumber": "DC-12345"
      }
    },
    {
      "data_type": "price",
      "extracted_value": {
        "amount": 75,
        "currency": "USD",
        "details": "Dental cleaning"
      }
    }
  ]
}
```

### Webhooks

#### `POST /api/webhooks/call-status`
Twilio webhook for call status updates (initiated, ringing, completed, failed).

**Twilio sends:**
```
CallSid, CallStatus, From, To, Duration, etc.
```

#### `POST /api/webhooks/call-transcript`
Real-time transcript webhook from Twilio.

**Twilio sends:**
```
CallSid, TranscriptText, Speaker, Confidence, etc.
```

## AI Helper Service

### `callAIHelper.planCallTask()`
Analyzes user instructions and creates an execution plan.

**Input:** Natural language instruction
**Output:** Structured plan with goals, steps, missing info, constraints

### `callAIHelper.generateCallScript()`
Creates the AI agent's call script based on the plan and user context.

**Input:** Task plan, user context, tone preference
**Output:** Structured script with introduction, questions, fallback responses

### `callAIHelper.summarizeCall()`
Post-call processing: summarizes transcript and extracts structured data.

**Input:** Full transcript, original task plan
**Output:** Summary, extracted data, sentiment analysis, follow-up tasks

### `callAIHelper.detectApprovalNeeded()`
Real-time check during call to see if user approval is required.

**Input:** Current conversation context, constraints, settings
**Output:** Boolean approval needed + reason

### `callAIHelper.detectRisks()`
Pre-flight safety check for potentially problematic requests.

**Input:** User instruction
**Output:** Risk assessment (legal, financial, privacy concerns)

## Frontend Components

### `CallTaskComposer`
**Location:** `components/personal-assistant/call-task-composer.tsx`

Main UI for creating new call tasks. Features:
- Large textarea for natural language input
- Optional structured hints (phone, contact, constraints)
- Real-time AI planning and validation
- Clarification flow when info is missing

### `CallTaskList`
**Location:** `components/personal-assistant/call-task-list.tsx`

Dashboard view of all call tasks. Features:
- Filterable by status (pending, ready, in progress, completed)
- Sortable by priority and date
- Status badges with color coding
- Quick actions (start call, cancel, delete)

### `CallTaskDetail`
**Location:** `components/personal-assistant/call-task-detail.tsx`

Detailed view of a single task. Features:
- Task overview (title, status, priority, timestamps)
- AI plan visualization
- Control panel (start call, edit, cancel)
- Call history list with statuses

### `CallSessionDetail`
**Location:** `components/personal-assistant/call-session-detail.tsx`

Detailed view of a single call session. Features:
- Call metadata (duration, phone number, timestamps)
- AI summary of conversation
- Extracted structured data (prices, appointments, names, etc.)
- Full transcript viewer with timestamps
- Sentiment indicators

### `NotificationsPanel`
Integration with existing notification system for:
- Task created
- Call started/completed/failed
- Approval needed
- Clarification required

## User Flows

### Flow 1: Create and Execute Simple Call

```
1. User types: "Call Pizza Hut at 555-1234 and order a large pepperoni"
2. System creates task with status "ready_to_call"
3. User clicks "Start Call"
4. System initiates Twilio call
5. AI agent follows script: orders pizza
6. Call completes, transcript saved
7. System auto-processes: extracts price, confirmation number
8. User sees summary and extracted data
```

### Flow 2: Create Call with Missing Info

```
1. User types: "Call my dentist and book an appointment"
2. AI detects missing info: dentist phone number, preferred date
3. System creates task with status "waiting_for_user"
4. User sees clarification UI: "Please provide dentist phone number"
5. User fills in missing info
6. System auto-transitions to "ready_to_call"
7. User clicks "Start Call" → continues to Flow 1
```

### Flow 3: Call Requires Mid-Call Approval

```
1. Call in progress
2. Business quotes $300 for service
3. AI detects price exceeds user's $200 limit
4. System pauses AI, sends real-time notification
5. User approves or rejects
6. AI resumes with user decision
7. Call completes based on user choice
```

## Error Handling

### Validation Errors (400)
- Missing required fields
- Invalid phone number format
- Invalid status transitions
- Input exceeds length limits

### AI Processing Errors (500)
- AI service timeout
- Malformed AI response
- AI refused to process (safety/policy)

### Call Service Errors (503)
- Twilio API unavailable
- Call failed to connect
- No answer / busy signal
- Invalid phone number

### Authorization Errors (401/403)
- User not authenticated
- Accessing another user's task
- Insufficient permissions

### Rate Limiting (429)
- Too many tasks created in short period
- Too many calls initiated per day

### Recovery Strategies
- **Auto-retry:** Failed calls can auto-retry based on user settings
- **Circuit breaker:** Protect against cascading failures
- **Graceful degradation:** Show cached data if real-time updates fail
- **User notifications:** Always inform user of failures with actionable next steps

## Security Considerations

1. **Row Level Security (RLS):** All tables enforce user-specific access
2. **Webhook Verification:** Twilio webhooks validated via signature
3. **Input Sanitization:** All user input sanitized before AI processing
4. **Rate Limiting:** Prevents abuse of AI and telephony services
5. **PII Protection:** Phone numbers and personal data encrypted at rest
6. **Audit Logging:** All call activities logged for compliance

## Configuration

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### Feature Flags

```typescript
// In assistant_settings table
{
  "max_auto_approve_amount": 100, // Auto-approve calls up to $100
  "auto_retry_failed_calls": true, // Auto-retry on failure
  "max_retry_attempts": 2,         // Max retry attempts
  "business_hours_only": false,    // Only call during business hours
  "voice_preference": "professional_male",
  "default_tone": "friendly"
}
```

## Testing

### Unit Tests
- `__tests__/personal-assistant/call-ai-helper.test.ts` - AI helper functions
- `__tests__/personal-assistant/api-call-tasks.test.ts` - API endpoint logic
- `__tests__/personal-assistant/components.test.tsx` - React components

### Integration Tests
Run with: `npm run test`

### Manual Testing Checklist
- [ ] Create simple call task
- [ ] Create task with missing info
- [ ] Provide clarifications
- [ ] Start call and monitor status
- [ ] Verify transcript recording
- [ ] Check extracted data accuracy
- [ ] Test error scenarios (invalid phone, busy, no answer)
- [ ] Test approval flow
- [ ] Verify notifications

## Deployment

### Database Migration

```bash
# Apply migration
npx supabase db push

# Or via Supabase Dashboard
# → Database → Migrations → Run Migration
```

### Environment Setup

1. Configure environment variables in Vercel/hosting platform
2. Set up Twilio webhooks pointing to your deployed app
3. Enable Supabase Realtime for real-time updates
4. Configure AI service API keys

### Post-Deployment Verification

1. Test task creation via API
2. Verify Twilio webhook delivery
3. Check database permissions (RLS)
4. Monitor error logs
5. Verify AI responses

## Maintenance

### Monitoring
- Track AI token usage (OpenAI/Gemini)
- Monitor Twilio call costs
- Watch for failed calls and retry patterns
- Track user satisfaction (goal_achieved rate)

### Optimization
- Batch AI requests when possible
- Cache frequently used AI responses
- Optimize database queries with indexes
- Implement transcript search (full-text search)

## Future Enhancements

1. **Multi-language support** - International calls
2. **Voice cloning** - Use user's voice for calls
3. **SMS fallback** - If call fails, send SMS
4. **Email integration** - Extract info from emails to pre-fill tasks
5. **Calendar integration** - Auto-add confirmed appointments
6. **Advanced analytics** - Success rates, common failures, cost tracking
7. **Team collaboration** - Share call tasks with team members
8. **Custom AI personalities** - User-defined agent behaviors
9. **Voice commands** - Create tasks via voice input

## Support

For issues or questions:
- Check logs in Supabase Dashboard
- Review Twilio call logs
- Inspect AI request/response logs
- Verify webhook delivery status

---

**Version:** 1.0.0  
**Last Updated:** November 27, 2025  
**Status:** Production Ready ✅



























