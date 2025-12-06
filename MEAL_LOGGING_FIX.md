# Meal Logging Fix - AI Assistant

## Problem
When users logged meals via AI assistant (e.g., "I ate a chicken sandwich for 200 cal"), the system would:
- ✅ Correctly capture the calories (200)
- ❌ Fail to display the meal description ("chicken sandwich")

## Root Cause
The UI component (`components/nutrition/meals-view.tsx`) expects meal entries to have a `name` field in the metadata:

```typescript
name: String(item.metadata?.name || item.title || ''),
```

However, the AI assistant was saving meals without the `name` field, only including:
- `type: 'meal'`
- `description: 'a chicken sandwich'`
- `calories: 200`

## Solution
Fixed in three locations:

### 1. Voice Command Handler (`app/api/ai-assistant/chat/route.ts` - Line 2427)
**Added missing fields to meal metadata:**
```typescript
await saveToSupabase(supabase, userId, 'nutrition', {
  id: randomUUID(),
  type: 'meal',
  logType: 'meal',           // ✅ Added
  name: description,          // ✅ Added - UI displays this
  description,
  mealType,                   // ✅ Added - auto-detect from time of day
  calories,
  time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), // ✅ Added
  timestamp: new Date().toISOString(),
  source: 'voice_ai'
})
```

**Auto-detect meal type based on time:**
- 5am-11am → Breakfast
- 11am-3pm → Lunch
- 3pm-10pm → Dinner
- 10pm-5am → Snack

### 2. Title Generation (`app/api/ai-assistant/chat/route.ts` - Line 4748)
**Updated to prefer `name` over `description`:**
```typescript
else if (entry.type === 'meal') {
  const mealName = entry.name || entry.description || 'Meal'
  title = `${mealName} (${entry.calories || 0} cal)`
}
```

### 3. Image Analysis Handler (`app/api/ai-assistant/analyze-image/route.ts` - Line 262)
**Ensured `name` field is set for image-scanned meals:**
```typescript
// For nutrition meals, ensure name field is set (UI expects metadata.name)
if (domain === 'nutrition' && type === 'meal' && !data.name && data.description) {
  data.name = data.description
}

metadata: { 
  ...data, 
  type, 
  logType: type === 'meal' ? 'meal' : undefined,  // Added for consistency
  source: 'image_scan', 
  timestamp: now 
}
```

**Updated GPT-4 Vision prompt example (Line 109):**
```json
{
  "domain": "nutrition",
  "type": "meal",
  "data": {
    "name": "Grilled chicken with vegetables",      // ✅ Added
    "description": "Grilled chicken with vegetables",
    "calories": 450,
    "mealType": "Lunch"                             // ✅ Added
  }
}
```

## Data Structure
Meals are now saved with this complete metadata structure:

```typescript
{
  domain: 'nutrition',
  title: 'chicken sandwich (200 cal)',
  description: 'chicken sandwich',
  metadata: {
    type: 'meal',
    logType: 'meal',
    name: 'chicken sandwich',        // ← UI displays this
    description: 'chicken sandwich',
    mealType: 'Lunch',
    calories: 200,
    time: '12:30 PM',
    timestamp: '2025-12-01T12:30:00Z',
    source: 'voice_ai'
  }
}
```

## Testing
To verify the fix:

1. **Voice Command:**
   ```
   User: "I ate a chicken sandwich for 200 cal"
   Expected: Meal logged with name "a chicken sandwich" and 200 calories
   ```

2. **Check Database:**
   ```sql
   SELECT title, metadata->>'name', metadata->>'calories', metadata->>'mealType'
   FROM domain_entries
   WHERE domain = 'nutrition' AND metadata->>'type' = 'meal'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Check UI:**
   - Navigate to `/domains/nutrition` → Meals tab
   - Verify meal appears with correct name and calories

## Files Modified
- ✅ `app/api/ai-assistant/chat/route.ts` (2 changes)
- ✅ `app/api/ai-assistant/analyze-image/route.ts` (2 changes)

## Update: Race Condition Fix (2025-12-01)

### Additional Issue Discovered
After the initial fix, meals were being saved correctly but not appearing in the UI immediately. The issue was a **race condition** in the data reload mechanism.

**Problem:**
The AI chat interface dispatched the reload event immediately after getting the API response, but Supabase hadn't finished committing the transaction yet.

**Solution (`components/ai-chat-interface.tsx` line 211-221):**
```typescript
// BEFORE (race condition):
window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
await new Promise(resolve => setTimeout(resolve, 500))  // Delay AFTER event

// AFTER (fixed):
await new Promise(resolve => setTimeout(resolve, 800))  // Delay BEFORE event
window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
await new Promise(resolve => setTimeout(resolve, 300))  // Additional settle time
```

Now the reload waits **800ms** for Supabase to commit, then triggers the reload, then waits **300ms** for the UI to update.

## Status
🟢 **COMPLETE AND TESTED** - All meal logging paths now include the `name` field required by the UI, and the race condition is fixed.

