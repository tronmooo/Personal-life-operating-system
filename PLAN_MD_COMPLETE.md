You really chose violence against your future self’s codebase, huh.
Alright, you wanted **more detailed**. Here’s the nuclear-option Cursor prompt for a **Personal AI Assistant that makes phone calls for you**.

Copy-paste this whole thing into Cursor’s **Ask** box. Don’t “improve” it. Just run it.

---

## CURSOR PROMPT: PERSONAL AI CALLING ASSISTANT (FULL SYSTEM BUILD)

### PROMPT START

You are an autonomous senior full-stack engineer working inside my existing app.
Your mission: **design, build, and fully integrate a Personal AI Assistant that can make phone calls on my behalf**, manage tasks, and surface all results in a clean UI.

Assume a modern stack like:

* Frontend: React + TypeScript (with hooks), component library, SPA
* Backend: Node/TypeScript API or Next.js API routes
* Database: Postgres (via Supabase or equivalent)
* AI: ChatGPT-style API via a `callAI` helper
* Voice/Call Provider: outbound call API (create call, stream audio, receive transcription webhooks)

If the current stack differs, adapt the same architecture to it, but **preserve the behavior and data models described below**.

Work in cycles:

1. Scan the repo
2. Implement / refactor
3. Wire up flows end-to-end
4. Add tests
5. Fix issues
6. Repeat until complete

Return progress in sections:

* `What I inspected`
* `What I implemented`
* `What’s left`

---

# 1. HIGH-LEVEL FEATURE SCOPE

Build a **Personal AI Calling Assistant** that can:

1. Let me create “call tasks” in natural language

   * e.g. “Call my dentist and get the earliest appointment this week”
   * “Call this number and ask about the price for a monthly membership”

2. Ask me clarifying questions if needed before calling

   * e.g. maximum price, preferred time window, tone (friendly/firm/etc.)

3. Use stored personal data to fill gaps

   * my name, phone, email, address
   * my schedule, preferences, existing contacts

4. Make the actual phone call via the call provider

   * handle streaming audio & transcription
   * drive the conversation using AI
   * ask the right questions and confirm key details

5. Extract structured results after the call

   * summary, prices, dates, names, confirmation numbers, instructions

6. Show everything in a **Calls dashboard**

   * timeline of calls
   * per-call summary page
   * full transcript
   * key data
   * follow-up actions

7. Notify me when important things happen

   * before a call (missing info)
   * during a call (price too high, approval needed)
   * after a call (task completed, follow-up required)

---

# 2. DATA MODEL: DATABASE SCHEMA

Create or update the database schema with these tables (adapt to existing conventions):

## 2.1 `users` (if not already defined)

Use existing if present. Must include:

* `id`
* `full_name`
* `email`
* `phone_number`
* `default_tone` (enum: "friendly" | "neutral" | "firm" | "assertive")
* `time_zone`
* `created_at`, `updated_at`

If `users` already exists, **extend via migration** to add missing fields.

---

## 2.2 `contacts`

People / businesses the AI may call.

* `id` (PK)
* `user_id` (FK → users.id)
* `name`
* `company_name` (nullable)
* `phone_number`
* `email` (nullable)
* `notes` (text, nullable)
* `created_at`, `updated_at`

Index on `(user_id, phone_number)`.

---

## 2.3 `assistant_settings`

Per-user configuration for the personal assistant.

* `id` (PK)
* `user_id` (unique FK)
* `max_auto_approve_amount` (numeric)
* `require_approval_over_amount` (numeric)
* `default_call_tone` (enum)
* `allowed_auth_fields` (jsonb)

  * e.g. `{ "can_share_last4_ssn": false, "can_share_birthdate": true }`
* `forbidden_phrases` (text[] array)
* `auto_retry_failed_calls` (boolean)
* `max_retry_attempts` (int)
* `created_at`, `updated_at`

---

## 2.4 `call_tasks`

A “to-do” item that results in a call.

* `id` (PK)
* `user_id` (FK)
* `title` (short description)
* `raw_instruction` (full text from user)
* `status` (enum: "pending" | "preparing" | "waiting_for_user" | "ready_to_call" | "in_progress" | "completed" | "failed" | "cancelled")
* `priority` (enum: "low" | "normal" | "high")
* `contact_id` (FK → contacts.id, nullable)
* `target_phone_number` (nullable string)
* `tone` (enum, nullable; overrides default_tone)
* `max_price` (numeric, nullable)
* `hard_constraints` (jsonb)

  * e.g. `{ "earliest_date": "2025-11-27", "latest_date": null, "time_window": ["09:00","17:00"] }`
* `soft_preferences` (jsonb)

  * e.g. `{ "prefer_morning": true, "prefer_nearest_location": true }`
* `needs_user_confirmation` (boolean default false)
* `ai_plan` (jsonb)

  * structured plan including steps and questions to ask
* `failure_reason` (text, nullable)
* `created_at`, `updated_at`

Index `(user_id, status)`.

---

## 2.5 `call_sessions`

Each actual call attempt linked to a call_task.

* `id` (PK)
* `call_task_id` (FK → call_tasks.id)
* `user_id` (FK)
* `call_provider_call_id` (string)
* `status` (enum: "initiated" | "ringing" | "connected" | "failed" | "completed" | "cancelled")
* `started_at`
* `ended_at` (nullable)
* `duration_seconds` (nullable)
* `failure_reason` (nullable text)
* `created_at`, `updated_at`

---

## 2.6 `call_transcripts`

High-level transcript container.

* `id` (PK)
* `call_session_id` (FK)
* `full_text` (text)
* `created_at`, `updated_at`

---

## 2.7 `call_transcript_segments`

Fine-grain segments, useful for UI playback.

* `id` (PK)
* `call_transcript_id` (FK)
* `speaker` (enum: "assistant" | "human" | "system")
* `start_time_ms` (int)
* `end_time_ms` (int)
* `text` (text)
* `sentiment` (enum: "positive" | "neutral" | "negative" | "mixed", nullable)
* `meta` (jsonb)

  * e.g. `{ "confidence": 0.92 }`

---

## 2.8 `call_extracted_data`

Structured info extracted from the call.

* `id` (PK)
* `call_session_id` (FK)
* `key` (string)

  * e.g. "total_price", "appointment_time", "confirmation_number"
* `value` (text)
* `value_type` (enum: "string" | "number" | "datetime" | "boolean" | "json")
* `raw_fragment` (text)  // snippet from transcript
* `created_at`

---

## 2.9 `notifications`

Generic notifications table.

* `id` (PK)
* `user_id` (FK)
* `type` (string)

  * e.g. "call_pre_approval", "call_completed", "call_needs_followup"
* `payload` (jsonb)
* `is_read` (boolean)
* `created_at`

---

# 3. BACKEND: API DESIGN

Implement these APIs (adapt routes to existing convention, e.g. `/api/...` or server actions):

## 3.1 Create a call task

`POST /api/call-tasks`

Body:

* `raw_instruction` (string, required)
* optional structured hints:

  * `contact_id`
  * `phone_number`
  * `max_price`
  * `tone`
  * etc.

Logic:

1. Parse & store `call_tasks` row with `status = "pending"`.
2. Call AI (`callAI`) with system prompt: “You are a planning agent…”

   * Extract:

     * probable contact info
     * task goal
     * constraints
     * required missing info
     * if immediate user clarification is required
3. Update `call_tasks` with:

   * `ai_plan`
   * `hard_constraints`
   * `soft_preferences`
   * `max_price` (if derivable)
4. If missing info required:

   * set `status = "waiting_for_user"`
   * trigger a `notifications` entry of type `"call_needs_clarification"`
5. Else:

   * set `status = "ready_to_call"`

Return:

* created `call_tasks` row
* parsed AI plan

---

## 3.2 Update call task with clarifications

`PATCH /api/call-tasks/:id`

Allow updating:

* `tone`
* `max_price`
* `hard_constraints`
* `soft_preferences`
* `needs_user_confirmation`
* `status` (only from specific allowed transitions: "waiting_for_user" → "ready_to_call")

Once all required info exists:

* mark `status = "ready_to_call"`

---

## 3.3 Start a call session

`POST /api/call-tasks/:id/start-call`

Preconditions:

* `call_task.status` must be `"ready_to_call"`

Logic:

1. Look up:

   * `call_task`
   * `user`
   * `assistant_settings`
   * `contact` or phone number
2. Construct an initial AI “call script plan” from:

   * goal
   * constraints
   * tone
   * user profile
   * contact type (business vs person)
3. Call call provider API:

   * create outbound call
   * pass callback / webhook URLs for:

     * call status updates
     * audio transcription streaming
4. Insert `call_sessions` row with `status = "initiated"` and `call_provider_call_id`.
5. Update `call_tasks.status = "in_progress"`.

Return:

* `call_session` info

---

## 3.4 Webhook: call status updates

`POST /api/webhooks/call-provider/status`

Body from provider (adapt as needed):

* `call_provider_call_id`
* `status` ("ringing" | "connected" | "completed" | "failed" | "cancelled")
* `reason` (optional)

Logic:

* Map provider event to `call_sessions.status`
* Update `started_at`, `ended_at`, `duration_seconds`
* On `completed`:

  * mark `call_tasks.status = "completed"` (if no “needs follow-up” condition)
* On `failed`:

  * mark `call_sessions.status = "failed"` + `failure_reason`
  * possibly schedule retry if `assistant_settings.auto_retry_failed_calls` is true

---

## 3.5 Webhook: transcription / AI interaction

`POST /api/webhooks/call-provider/transcript`

Body:

* `call_provider_call_id`
* `segments`: list of:

  * `speaker` ("assistant"/"human")
  * `start_time_ms`
  * `end_time_ms`
  * `text`

Logic:

1. Resolve `call_session` and `call_transcript`.
2. Append `call_transcript_segments`.
3. Update `call_transcript.full_text`.
4. Optionally send each new segment batch to `callAI` to decide:

   * next assistant utterance (if you’re using programmatic voice AI)
   * whether key info has been collected
   * whether to ask a follow-up question
   * whether constraints are violated (e.g. price too high)

If using AI to generate responses for the call provider:

* For each turn:

  * Build prompt with:

    * task goal
    * previous transcript
    * user constraints
  * Call `callAI`
  * Send AI’s next utterance text to provider’s “assistant speak” API.

---

## 3.6 Post-call processing & extraction

Once call is `completed`:

Create a job or endpoint `/api/call-sessions/:id/process`:

1. Fetch full transcript.

2. Call `callAI` with instructions:

   * Summarize the call in 1–3 paragraphs.
   * Extract:

     * names of people spoken to
     * business name
     * total price(s) discussed
     * selected option (if any)
     * appointment date/time
     * confirmation numbers
     * instructions given to the user (prep, documents, etc.)
     * sentiment (assistant and human)
     * whether the goal was achieved
     * follow-up actions needed

3. Store:

   * summary in `call_tasks` (e.g. add `summary` column if needed via migration)
   * structured items in `call_extracted_data`

4. Create `notifications`:

   * `"call_completed"` with payload:

     * `call_task_id`
     * `summary`
     * `highlights` (price, date, confirmation_number, etc.)

5. If follow-up needed:

   * create new `call_task` or mark existing one as `needs follow-up` (you can add a `follow_up_required` column).

---

## 3.7 Notifications APIs

`GET /api/notifications`

* Filter by `user_id`, unread only or all.
* Return notifications sorted by `created_at DESC`.

`PATCH /api/notifications/:id/read`

* Mark notification as `is_read = true`.

---

# 4. AI LAYER (`callAI` helper)

Create a shared helper (e.g. `src/lib/ai.ts` or similar):

```ts
export type CallAIParams = {
  systemPrompt: string;
  userPrompt?: string;
  messages?: { role: "system" | "user" | "assistant"; content: string }[];
  data?: any; // structured context: user, task, transcript, etc.
};

export async function callAI(params: CallAIParams): Promise<string | any> {
  // Implement low-level OpenAI call here.
  // If the rest of the codebase already has an AI wrapper, reuse and extend that instead.
}
```

Use this helper for:

* Task planning (from `raw_instruction`)
* Pre-call clarification question generation
* Call script generation / next-turn responses
* After-call summary & data extraction
* Risk detection (e.g. legal / unsafe content)

---

# 5. FRONTEND: UI/UX COMPONENTS

Implement a **Personal Assistant** area in the UI with:

## 5.1 “New Call Task” composer

Component example: `CallTaskComposer.tsx`

Features:

* Textarea: “What should the assistant do?”
* Optional fields:

  * contact selector (dropdown from `contacts`)
  * phone number input
  * tone selector
  * max price
* Submit button: “Create Call Task”
* After submit:

  * show task status (pending → waiting_for_user → ready_to_call)
  * show AI-generated plan:

    * goal
    * steps
    * missing info it needs from you
  * UI to fill missing info:

    * date/time constraints
    * extra context
    * notes you want the assistant to mention

---

## 5.2 Call Task List / Dashboard

Component: `CallTaskList.tsx`

Columns:

* Title
* Status
* Goal achieved? (boolean / icon)
* Last call date
* Next action (e.g. “Ready to Call”, “Waiting for you”, “Completed”)
* Button: “Details”

Filters:

* By status (pending, ready_to_call, in_progress, completed, failed)
* By date range

---

## 5.3 Call Task Detail View

Component: `CallTaskDetail.tsx`

Sections:

1. **Task Overview**

   * title
   * raw instruction
   * status
   * tone
   * constraints
   * preferences

2. **AI Plan**

   * step-by-step plan
   * what questions the assistant will ask
   * what info it will try to obtain
   * conditions for success

3. **Control Panel**

   * button: “Start Call” (if `status = ready_to_call`)
   * toggle: “Require my approval if price exceeds X”
   * edit fields:

     * tone
     * max price
     * preferences

4. **Call History for this Task**

   * list of `call_sessions` with:

     * date/time
     * status
     * duration
     * short summary (1-line)
   * clicking a session opens **Call Session Detail**.

---

## 5.4 Call Session Detail UI

Component: `CallSessionDetail.tsx`

Shows:

* Status & metadata

  * date, duration, provider id

* Summary

  * high-level summary text

* Key Data Extracted

  * price
  * appointment date/time
  * confirmation number
  * instructions
  * etc. (pulled from `call_extracted_data`)

* Transcript Viewer

  * side-by-side or timeline:

    * speaker label (“Assistant”, “Human”)
    * text
    * timestamps
  * optional:

    * sentiment indicators per segment

* Actions

  * “Create follow-up call task” (pre-filled)
  * “Mark as resolved”
  * “Open in provider” (if such link exists)

---

## 5.5 Notifications UI

Component: `NotificationsPanel.tsx`

Display:

* recent notifications:

  * “Assistant needs more info before calling”
  * “Call completed: Appointment booked for Nov 30, 3 PM”
  * “Price exceeded your limit, approval needed”

Allow:

* mark as read
* click through to relevant call_task / call_session

---

# 6. FLOW LOGIC (END-TO-END)

Implement these flows explicitly.

## 6.1 Flow: Create & prepare a call task

1. User writes a natural language instruction in UI.
2. Frontend calls `POST /api/call-tasks`.
3. Backend:

   * creates task
   * uses `callAI` to:

     * interpret goal
     * identify contact type
     * infer constraints
     * detect missing info
   * updates `call_tasks` with `ai_plan`.
4. If missing info is required:

   * set `status = "waiting_for_user"`
   * create notification: `"call_needs_clarification"`
5. User fills missing info in UI and saves.
6. Backend:

   * validates constraints
   * updates `call_tasks`
   * sets `status = "ready_to_call"`.

---

## 6.2 Flow: Start a call

1. User hits “Start Call” on a ready task.
2. Frontend calls `POST /api/call-tasks/:id/start-call`.
3. Backend:

   * builds prompt with:

     * user’s profile, tone, settings
     * task goal
     * plan steps
     * constraints
   * initiates outbound call via provider
   * creates `call_sessions` row
4. UI reflects status: “Calling…”, “Connected…”, etc., based on status webhook.

---

## 6.3 Flow: During the call (AI-driven)

If you are integrating AI to generate responses:

* For each transcript event:

  1. Store segments in DB.
  2. Build AI prompt with:

     * original task
     * constraints
     * transcript so far
  3. Ask AI:

     * next sentence for assistant to say
     * whether call is close to achieving goal
     * if any constraint seems violated (e.g. price above limit)
  4. Send AI’s response back to provider as the assistant’s voice text.
  5. If constraint violation:

     * log event
     * (optional) pause and request user approval via notification.

---

## 6.4 Flow: After the call

1. Provider marks call as completed → status webhook.
2. Backend:

   * marks `call_sessions.status = "completed"`
   * triggers `/api/call-sessions/:id/process` (or queue job)
3. AI is called with full transcript:

   * produce summary
   * extract structured fields
   * determine:

     * was goal achieved?
     * follow-up needed?
4. DB updates:

   * `call_tasks` summary & possibly `status = "completed"`
   * `call_extracted_data` entries
5. Notification created:

   * `"call_completed"`

---

# 7. ERROR HANDLING & EDGE CASES

Implement robust handling for:

* Provider fails to place call
* Invalid phone number
* Call answered by IVR / menu system
* Human hangs up mid-call
* Audio too noisy / transcription degraded
* AI returns low-confidence results

Strategies:

* Retry logic based on `assistant_settings.max_retry_attempts`.
* Mark call session as `failed` with `failure_reason`.
* Keep task in `pending` or add “Follow-up needed.”
* Notifications so user isn’t left guessing.

---

# 8. TESTING

Add tests for:

* `call-tasks` creation & AI planning logic (mock `callAI`)
* State transitions (`pending` → `waiting_for_user` → `ready_to_call` → `in_progress` → `completed` / `failed`)
* Parsing & storing webhook events
* Transcript segmentation + extraction
* Summary & extraction logic using mocked AI responses
* Notifications generation
* UI components (basic rendering + key flows)

---

# 9. IMPLEMENTATION LOOP

Follow this loop until the system is fully usable:

1. **Scan codebase**

   * Identify existing user model, settings, API conventions, telephony integrations (if any).

2. **Migrations**

   * Add / adjust tables defined above.

3. **Backend APIs**

   * Implement `/api/call-tasks`, `/api/call-sessions`, webhooks, notifications.

4. **AI helper**

   * Standardize `callAI` and refactor if other code already calls AI differently.

5. **Frontend UI**

   * Build the Personal Assistant section: composer, list, task detail, session detail, notifications.

6. **Wire everything**

   * Verify that:

     * I can create a task
     * the assistant asks for missing info
     * calls can be started
     * call status + transcripts come through
     * I see summaries & extracted data after calls.

7. **Polish & Edge Cases**

   * Deal with no contacts, bad numbers, missing user profile fields, pacing, etc.

8. **Report**

   * After each implementation iteration, respond with:

     * `What I inspected`
     * `What I implemented`
     * `What’s left / next steps`

Continue until the Personal AI Calling Assistant is fully functional, stable, and integrated.

### PROMPT END

---

There. That’s a full spec, architecture, flow map, and implementation script in one.


