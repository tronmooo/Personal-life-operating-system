# LifeHub System Testing Prompts

This document enumerates voice and chat prompts, manual test flows, and verification checklists to validate LifeHub end-to-end. Use these scripts to exercise the AI assistant, web UI, Supabase persistence, realtime sync, and offline handling. Each section mixes "happy path" and "error-hunting" prompts so you can confirm successes and surface regressions.

---

## 1. Command Center → Domain Data Flow

### 1.1 High-confidence (sanity) prompts
- "Log a $62.48 grocery trip at Trader Joe's today at 5:30 PM."
- "Track that I cycled 14.2 miles in 52 minutes this morning."
- "Add home maintenance: replaced furnace filter, cost $18, due again in 90 days."

**Checklist**
1. Command Center confirms each action with the correct domain label.
2. `useDomainCRUD` populates list views for financial, fitness, and home domains.
3. `metadata` JSON renders expected fields in detail drawers.
4. Supabase `domain_entries` contains rows with accurate timestamps and metadata.
5. IndexedDB cache rehydrates entries on hard reload while offline.

### 1.2 Ambiguity & disambiguation prompts
- "I spent 45 on fuel" (no currency symbol or units).
- "Book annual checkup for mom next month" (missing date).
- "Paid rent for the loft" (no dollar amount).

**Checklist**
1. AI assistant requests clarification instead of logging incorrect data.
2. No partial or placeholder entries appear in domains.
3. Toasts communicate what additional info is needed.
4. Supabase remains unchanged when user cancels clarification.

### 1.3 Conflict prompts
- Issue identical command twice: "Record my weight at 168.2 pounds today."
- Issue overlapping time logs: "Logged 40-minute yoga session at 7AM" followed by "Yoga 25 minutes at 7AM."

**Checklist**
1. App deduplicates or clearly differentiates separate events.
2. Realtime sync does not flicker or duplicate entries.
3. Historical charts show consistent totals (no double counting).

---

## 2. Backend Persistence & Validation

### 2.1 Supabase API regression script
Run after each batch of prompts:
```bash
curl -s "http://localhost:3000/api/domain-entries?domain=financial" | jq '.[0]'
curl -s "http://localhost:3000/api/domain-entries?domain=fitness" | jq '.[0]'
curl -s "http://localhost:3000/api/domain-entries?domain=pets" | jq '.[0]'
```

**Checklist**
1. Responses return `200 OK` with JSON arrays.
2. Latest entries match titles and amounts invoked via the assistant.
3. `metadata` keys align with `DomainMetadataMap`.

### 2.2 Data shape enforcement prompts
- "Add expense 20 dollars" (missing category).
- "Track my Tesla tire rotation" (no mileage).
- "Log insurance premium for life policy" (missing carrier).

**Checklist**
1. Validation errors appear inline with user-friendly messaging.
2. Supabase row insertion is blocked when required fields are absent.
3. Logs contain descriptive validation failures without stack traces.

---

## 3. Realtime Sync, Offline & Conflict Resolution

### 3.1 Multi-tab observation
1. Open two browsers to the same account (desktop + laptop or incognito).
2. Issue command on tab A: "Update savings balance to $12,450."
3. Observe tab B for update propagation within 3 seconds.

**Checklist**
1. `SupabaseSyncProvider` pushes updates exactly once (no loop).
2. Toast appears only on the initiating tab.
3. Undo or delete action on tab B reflects on tab A in real-time.

### 3.2 Offline-first flow
1. Enable browser devtools offline mode.
2. Issue command: "Log mindfulness session 12 minutes using Calm."
3. Disable offline mode after 30 seconds.

**Checklist**
1. UI indicates queued/unsynced state.
2. Entry persists locally (IDB) and syncs once online.
3. Supabase row creates with correct timestamp order (created_at < updated_at).
4. Realtime channel resumes without duplicate inserts.

### 3.3 Conflict resolution prompt
- While offline, create entry "Paid electric bill $94."
- On a second device, log "Electric bill $105" for same billing period.

**Checklist**
1. Upon reconnection, conflict resolution prompts user to merge or keep latest.
2. No silent overwrites occur.
3. Activity log captures both attempts with user IDs.

---

## 4. AI & Voice Interaction Edge Cases

### 4.1 Multi-domain single utterance
"Max got vaccinated for rabies at PetCare for $78, schedule next booster in 1 year, and log that I paid with the Chase Sapphire card."

**Checklist**
1. Pets domain: vaccination entry with provider and due date.
2. Financial domain: expense tagged to payment source.
3. Reminders domain: booster appointment scheduled.
4. Supabase rows share a cross-reference ID in metadata.

### 4.2 Error handling prompts
- "Call my dentist" (unsupported intent).
- "Spent minus 50 dollars" (negative amount).
- Whisper random numbers to trigger speech-to-text failure.

**Checklist**
1. Voice pipeline returns clarification instead of crashing.
2. Error toasts explain unsupported intents.
3. No malformed data persists.

### 4.3 Follow-up contextual prompts
1. "Log car mileage 45,200."
2. "Actually that was 45,320."

**Checklist**
1. Assistant understands "actually" as update, not new entry.
2. Vehicle domain retains audit trail of original mileage.
3. Chart deltas reflect net change.

---

## 5. Visual Dashboards & Analytics Integrity

### 5.1 Widget coverage commands
- "How much have I spent on groceries this month?"
- "Show my top three upcoming bills."
- "How many mindfulness sessions this week?"
- "List overdue tasks."

**Checklist**
1. Each widget renders without null/undefined errors.
2. Date filters respect timezone edge cases (cross midnight).
3. Totals match Supabase aggregates (validate via SQL query).

### 5.2 Chart stress tests
1. Load fitness analytics tab.
2. Issue 10 quick successive workout commands.
3. Reload analytics.

**Checklist**
1. Charts debounce updates and remain responsive.
2. No overlapping tooltips or misaligned axes.
3. Data smoothing matches spec (e.g., weekly rolling average).

### 5.3 Accessibility spot-check
Use keyboard to navigate dashboard after prompts.

**Checklist**
1. Focus rings visible on interactive widgets.
2. Screen reader labels announce dynamic totals.
3. Color contrast passes for key metrics.

---

## 6. Cross-Domain Linkage & Automations

### 6.1 Vehicle maintenance sequence
1. "My Honda Civic had 60,500 miles service at QuickFix Garage, cost $240."
2. "Attach receipt from Photos." (Upload flow)
3. "Remind me for next service at 65,000 miles."

**Checklist**
1. Vehicle domain entry includes mileage, provider, and attachment.
2. Financial domain logs matching cost with category "Auto Maintenance."
3. Reminder domain schedules threshold-based alert.
4. Removing the attachment updates Supabase storage and metadata.

### 6.2 Home insurance renewal
1. "Renewed homeowners policy with StateFarm, premium $1,280 annually."
2. "Upload PDF of the policy."
3. "Schedule inspection follow-up in 90 days."

**Checklist**
1. Insurance domain reflects new premium and term dates.
2. Financial recurring expense created (monthly breakdown).
3. Calendar integration stores inspection event.
4. Deleting policy entry removes linked recurring expense.

### 6.3 Relationship-centric prompts
- "Add anniversary trip to Maui May 5-12, budget $3,400."
- "Remind me to send flowers 3 days before."

**Checklist**
1. Travel domain stores itinerary with dates and budget.
2. Relationships domain displays upcoming milestone with CTA.
3. Notification service queues reminder.

---

## 7. Notifications, Tasks, and Escalations

### 7.1 Task lifecycle prompts
1. "Create task: Review investment portfolio by Friday."
2. "Mark that as done."
3. "Reopen the investment review task."

**Checklist**
1. Task board updates instantly and persists statuses.
2. Activity log reflects status transitions with timestamps.
3. Duplicate reminders are not sent.

### 7.2 Escalation rules
- "Alert me if credit card balance exceeds $5,000."
- Simulate high balance by importing data or manual entry.

**Checklist**
1. Threshold trigger fires exactly once per breach.
2. Email/SMS (if configured) delivers alert.
3. Alert clears when balance returns below threshold.

### 7.3 Notification fatigue guard
Issue the same reminder prompt three times rapidly.

**Checklist**
1. Debounce prevents triple scheduling.
2. UI indicates existing reminder instead of creating new.
3. Logs show a single database write.

---

## 8. Security, Permissions & Audit Trails

### 8.1 Session handling
1. Log in on desktop, then revoke session via settings.
2. Attempt assistant command from mobile session.

**Checklist**
1. Revoked session receives re-auth prompt.
2. No data writes proceed with invalid token.
3. Audit tables log session revocation with actor ID.

### 8.2 RLS verification
Execute Supabase SQL (via MCP) as another user ID:
```sql
select * from domain_entries where user_id <> 'current_user';
```

**Checklist**
1. Query returns zero rows for non-owned data.
2. Policies prevent write attempts with mismatched `user_id`.

### 8.3 Sensitive domain obfuscation
- Access health records while screen sharing (simulate by toggling privacy mode).

**Checklist**
1. UI masks sensitive fields when privacy mode enabled.
2. Voice assistant omits sensitive details in spoken confirmations.

---

## 9. Negative Testing & Failure Injection

### 9.1 API failure simulation
1. Temporarily disable Supabase network via devtools.
2. Issue "Log $120 utilities payment."

**Checklist**
1. Assistant reports backend unavailability.
2. Retry flow resubmits automatically when connection restored.
3. No partial UI update occurs (list remains unchanged until success).

### 9.2 Corrupt payload handling
Use browser console to POST malformed body:
```javascript
fetch('/api/domain-entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'financial', amount: 'NaN' })
}).then(r => r.json()).then(console.log);
```

**Checklist**
1. Response returns `400` with validation message.
2. Server logs note validation failure without stack trace.
3. No entry persists in Supabase.

### 9.3 Large attachment stress
Upload 30 MB document via document scanner.

**Checklist**
1. Client enforces size limit with friendly error.
2. Supabase storage rejects oversize file and cleans partial uploads.
3. UI re-enables upload button immediately.

---

## 10. Regression Guardrails

### 10.1 Daily smoke prompt pack
Run these 5 commands sequentially after each deploy:
1. "Log 30-minute HIIT workout, 320 calories."
2. "Add $45 gas purchase, Shell on 3rd Street."
3. "Schedule dentist cleaning April 18 at 2pm."
4. "Upload receipt for grocery run."
5. "Show upcoming bills."

**Checklist**
1. All commands execute within 10 seconds each.
2. No console errors in browser devtools.
3. Charts, reminders, and storage all update.

### 10.2 Weekend regression suite (extended)
- Run full multi-domain prompts from sections 1–8.
- Execute automated API checks (section 2).
- Re-run voice prompts with ElevenLabs or VAPI.

**Checklist**
1. Snapshot Supabase row counts before and after to confirm expected deltas.
2. Verify Playwright smoke suite passes headlessly.
3. Confirm `npm run lint` and `npm run type-check` succeed.

---

## Appendix A – Observation Log Template

```
Date:
Environment: (local / staging / production)
Prompt / Action:
Expected Outcome:
Actual Outcome:
Status: (pass / fail / needs follow-up)
Related Logs / Screenshots:
Next Steps:
```

Maintain this log for each failed scenario to accelerate fixes and ensure consistent reproduction steps.

---

## Appendix B – Team Workflow Suggestions
- Pair commands with Supabase MCP queries to validate backend state in real-time.
- After bug fixes, add failing prompts to a shared regression list to prevent recurrence.
- Rotate ownership of sections weekly so every domain gets fresh eyes.
- Integrate high-value prompts into automated synthetic monitoring where feasible.


