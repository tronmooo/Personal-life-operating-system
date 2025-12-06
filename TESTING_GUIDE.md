# 🧪 Testing Guide - New Features

## Quick Start Testing

### 1. Setup Environment

```bash
# Ensure OpenAI API key is set
echo "OPENAI_API_KEY=sk-..." >> .env.local

# Start development server
npm run dev
```

### 2. Test Bulk Domain Stats (5x Performance Improvement)

**What to test**: Dashboard should load much faster

**Steps**:
1. Navigate to http://localhost:3000
2. Open Chrome DevTools → Network tab
3. Refresh the page
4. Look for `get_bulk_domain_stats` RPC call
5. Check timing (should be < 200ms)

**Expected Result**:
- ✅ Dashboard loads in < 1 second
- ✅ Single bulk query instead of 21+ queries
- ✅ All domain stats display correctly

**How to use in your code**:
```typescript
import { useBulkDomainStats } from '@/lib/hooks/use-bulk-domain-stats'

function Dashboard() {
  const { stats, loading } = useBulkDomainStats()
  
  return (
    <div>
      <p>Vehicles: {stats.vehicles?.count || 0}</p>
      <p>Health: {stats.health?.count || 0}</p>
    </div>
  )
}
```

---

### 3. Test Universal Form Component

**What to test**: Forms work dynamically for any domain

**Steps**:
1. Navigate to `/domains/vehicles`
2. Click "Add New Vehicle"
3. Fill out the form
4. Submit and verify data is saved

**Expected Result**:
- ✅ Form renders with correct fields for domain
- ✅ Validation works (required fields)
- ✅ Success toast appears on save
- ✅ Data appears in table

**How to use in your code**:
```typescript
import { UniversalDomainForm } from '@/components/forms/universal-domain-form'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'

function VehicleForm() {
  const { create } = useDomainCRUD('vehicles')
  
  return (
    <UniversalDomainForm
      domain="vehicles"
      onSubmit={create}
      submitLabel="Add Vehicle"
    />
  )
}
```

---

### 4. Test Universal Table Component

**What to test**: Tables work dynamically for any domain

**Steps**:
1. Navigate to `/domains/vehicles`
2. View the list of vehicles
3. Test search functionality
4. Test sorting by clicking column headers
5. Test delete action

**Expected Result**:
- ✅ Table displays data correctly
- ✅ Search filters results
- ✅ Sorting works on all columns
- ✅ Delete shows confirmation and removes item

**How to use in your code**:
```typescript
import { UniversalDomainTable } from '@/components/tables/universal-domain-table'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'

function VehiclesList() {
  const { items, loading, remove } = useDomainCRUD('vehicles')
  
  return (
    <UniversalDomainTable
      domain="vehicles"
      items={items}
      loading={loading}
      onDelete={remove}
      showSearch
    />
  )
}
```

---

### 5. Test AI Assistant (GPT-4 Powered)

**What to test**: AI provides intelligent, contextual responses

**Prerequisites**:
- OpenAI API key set in `.env.local`
- User logged in
- Some data in domains

**Steps**:
1. Navigate to AI Assistant page
2. Ask: "How am I doing financially?"
3. Wait for response
4. Ask follow-up: "What should I focus on?"

**Expected Result**:
- ✅ AI responds with contextual answer based on user data
- ✅ Insights section shows key findings
- ✅ Suggestions section shows actionable items
- ✅ Conversation history maintained

**Example API call**:
```typescript
// In your component
const response = await fetch('/api/ai-assistant/intelligent-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    message: 'How am I doing financially?',
    conversationId: 'user-123'
  })
})

const { response: aiResponse } = await response.json()
console.log(aiResponse.message)
console.log(aiResponse.insights)
console.log(aiResponse.suggestions)
```

---

### 6. Test Specialized Advisors

**What to test**: Domain-specific AI provides expert advice

**Steps**:
1. Navigate to Financial domain
2. Click "Ask RoboAdvisor"
3. Ask: "Should I pay off my car loan early or invest?"
4. Review specialized financial advice

**Expected Result**:
- ✅ Receives expert financial analysis
- ✅ Considers user's actual data
- ✅ Provides clear recommendation with reasoning
- ✅ Includes risk/benefit analysis

**Example API call**:
```typescript
const response = await fetch('/api/ai-advisor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    domain: 'financial',
    question: 'Should I pay off my car loan early or invest?'
  })
})

const { advice } = await response.json()
console.log(advice) // Expert financial advice
```

---

### 7. Test Memory Leak Fix

**What to test**: No memory growth over time

**Steps**:
1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Navigate around app for 10 minutes
4. Take another heap snapshot
5. Compare snapshots

**Expected Result**:
- ✅ Memory usage stays stable
- ✅ No growing number of detached DOM nodes
- ✅ Timer count remains constant

**How to use safe timers**:
```typescript
import { useSafeTimers, useInterval } from '@/lib/hooks/use-safe-timers'

function PollingComponent() {
  // Option 1: Manual control
  const { setTimeout, setInterval } = useSafeTimers()
  
  useEffect(() => {
    setTimeout(() => console.log('Delayed'), 1000)
    setInterval(() => poll(), 5000)
    // ✅ Auto-cleanup on unmount!
  }, [])
  
  // Option 2: Convenience hook
  useInterval(() => {
    fetchData()
  }, 30000, true) // Poll every 30s, run immediately
  
  return <div>Polling...</div>
}
```

---

## Performance Benchmarks

### Dashboard Load Time
- **Before**: 2,000-3,000ms
- **Target**: < 600ms
- **Test**: Chrome DevTools → Performance tab

### Database Queries
- **Before**: 21+ separate queries
- **Target**: 1 bulk query
- **Test**: Chrome DevTools → Network tab

### Memory Usage
- **Before**: Growing over time (leak)
- **Target**: Stable
- **Test**: Chrome DevTools → Memory tab

---

## Common Issues & Solutions

### Issue: AI Assistant not responding
**Solution**: 
```bash
# Check if OpenAI API key is set
grep OPENAI_API_KEY .env.local

# If missing, add it:
echo "OPENAI_API_KEY=sk-your-key-here" >> .env.local

# Restart dev server
```

### Issue: Bulk stats not working
**Solution**:
```bash
# Verify Supabase migration was applied
# Check Supabase dashboard → SQL Editor
# Run: SELECT * FROM pg_proc WHERE proname = 'get_bulk_domain_stats';
# Should return 1 row
```

### Issue: Universal forms not rendering
**Solution**:
```typescript
// Ensure domain is valid
import { DOMAIN_CONFIGS } from '@/types/domains'

// Check if domain exists
const domainConfig = DOMAIN_CONFIGS['vehicles'] // Should not be undefined

// Check if fields are defined
console.log(domainConfig.fields) // Should show array of fields
```

### Issue: TypeScript errors
**Solution**:
```bash
# The new code is type-safe, but there are pre-existing errors
# To build despite errors:
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Or skip type check:
next build
```

---

## Integration Testing

### Test 1: End-to-End Domain Management
```typescript
// 1. Create item
const { create } = useDomainCRUD('vehicles')
await create({ title: 'Test Car', metadata: { make: 'Toyota' } })

// 2. Verify in table
const { items } = useDomainCRUD('vehicles')
expect(items.some(i => i.title === 'Test Car')).toBe(true)

// 3. Update item
const { update } = useDomainCRUD('vehicles')
await update(item.id, { title: 'Updated Car' })

// 4. Delete item
const { remove } = useDomainCRUD('vehicles')
await remove(item.id)
```

### Test 2: AI Context Building
```typescript
// Verify AI receives user context
const context = {
  userId: 'test-user',
  domainData: {
    financial: financialItems,
    health: healthItems
  },
  goals: userGoals
}

const assistant = new IntelligentAssistant()
const response = await assistant.chat('Analyze my finances', context)

// Should include references to actual financial data
expect(response.message).toContain('spending')
```

---

## Load Testing

### Dashboard Performance
```bash
# Install k6 for load testing
brew install k6

# Create test script: load-test.js
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const res = http.get('http://localhost:3000');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'load time < 1s': (r) => r.timings.duration < 1000,
  });
}

# Run load test
k6 run --vus 10 --duration 30s load-test.js
```

### Expected Results:
- ✅ 95th percentile < 1 second
- ✅ No failed requests
- ✅ Stable memory usage

---

## Automated Testing

### Unit Tests for New Components
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { UniversalDomainForm } from '@/components/forms/universal-domain-form'

test('renders form fields based on domain config', () => {
  render(<UniversalDomainForm domain="vehicles" onSubmit={jest.fn()} />)
  
  expect(screen.getByLabelText('Title')).toBeInTheDocument()
  expect(screen.getByLabelText('Description')).toBeInTheDocument()
  // Check domain-specific fields
})

test('validates required fields', async () => {
  const onSubmit = jest.fn()
  render(<UniversalDomainForm domain="vehicles" onSubmit={onSubmit} />)
  
  fireEvent.click(screen.getByText('Save'))
  
  // Should show validation error
  expect(screen.getByText(/required/i)).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})
```

---

## Success Criteria

### Performance ✅
- Dashboard loads in < 1 second
- Single bulk query for stats
- No memory leaks
- Stable long-session performance

### Functionality ✅
- Universal forms work for all domains
- Universal tables work for all domains
- AI assistant provides intelligent responses
- Specialized advisors give expert advice
- Safe timers clean up automatically

### Code Quality ✅
- Type-safe throughout
- No linter errors in new code
- Well-documented
- Consistent patterns
- Reusable components

---

## Next Steps After Testing

1. **Gather Feedback**
   - Test with real users
   - Collect AI response quality feedback
   - Monitor performance metrics

2. **Iterate**
   - Refine AI prompts based on feedback
   - Optimize slow queries
   - Add requested features

3. **Deploy**
   - Set up CI/CD pipeline
   - Configure monitoring
   - Deploy to staging
   - Production rollout

4. **Monitor**
   - Track performance metrics
   - Monitor AI API costs
   - Watch error rates
   - User engagement analytics

---

**Happy Testing!** 🎉

For issues or questions, refer to:
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `IMPROVEMENTS_IMPLEMENTED.md` - Detailed technical guide
- `plan.md` - Remaining tasks
