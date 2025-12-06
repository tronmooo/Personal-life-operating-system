# 🧪 Edge Case Test Scenarios
## Comprehensive Edge Case Testing Guide for LifeHub

**Purpose**: Detailed test scenarios for edge cases that could break the application  
**Format**: Concrete test cases with specific inputs, expected outputs, and error conditions

---

## 📑 Table of Contents

1. [Authentication Edge Cases](#authentication-edge-cases)
2. [Data Validation Edge Cases](#data-validation-edge-cases)
3. [Date & Time Edge Cases](#date--time-edge-cases)
4. [Concurrency & Race Conditions](#concurrency--race-conditions)
5. [Large Data Sets & Performance](#large-data-sets--performance)
6. [Network & Offline Scenarios](#network--offline-scenarios)
7. [External API Failures](#external-api-failures)
8. [Boundary Value Testing](#boundary-value-testing)
9. [Security Edge Cases](#security-edge-cases)
10. [Browser Compatibility](#browser-compatibility)

---

## 1. Authentication Edge Cases

### Scenario 1.1: Rapid Sign-In/Sign-Out Loop
**Description**: User signs in and immediately signs out 5 times in 10 seconds

**Test Case**:
```typescript
test('should handle rapid sign-in/sign-out without memory leaks', async () => {
  for (let i = 0; i < 5; i++) {
    await signIn('user@test.com', 'password')
    await wait(1000) // Wait 1s
    await signOut()
    await wait(1000)
  }
  
  // Check for memory leaks
  const memoryUsage = performance.memory.usedJSHeapSize
  expect(memoryUsage).toBeLessThan(100 * 1024 * 1024) // < 100MB
  
  // Check subscriptions cleaned up
  const activeSubscriptions = getActiveSupabaseSubscriptions()
  expect(activeSubscriptions).toHaveLength(0)
})
```

**Expected**: Clean sign-out, no lingering subscriptions, no memory leaks  
**Edge Case**: Subscriptions not cleaned up, memory grows exponentially

---

### Scenario 1.2: Session Expires During Form Submission
**Description**: User fills out long form, session expires, user submits

**Test Case**:
```typescript
test('should handle session expiration during submission', async () => {
  await signIn('user@test.com', 'password')
  await navigateTo('/domains/health')
  
  // Fill form
  await fillForm({
    title: 'Medical Checkup',
    provider: 'Dr. Smith',
    date: '2025-12-01',
    notes: 'Annual checkup...'
  })
  
  // Simulate session expiration
  await expireSession() // Mock helper
  
  // Submit form
  const result = await submitForm()
  
  // Should redirect to login with return URL
  expect(window.location.pathname).toBe('/auth/signin')
  expect(window.location.search).toContain('return=/domains/health')
  
  // Form data should be preserved in IDB
  const savedFormData = await idbGet('pending_form_submission')
  expect(savedFormData).toMatchObject({
    title: 'Medical Checkup',
    provider: 'Dr. Smith'
  })
})
```

**Expected**: Redirect to login, preserve form data, restore after re-auth  
**Edge Case**: Data lost, no error shown, silent failure

---

### Scenario 1.3: Two Tabs with Different Users
**Description**: User A in Tab 1, User B signs in Tab 2

**Test Case**:
```typescript
test('should handle different users in different tabs', async () => {
  // Tab 1: User A
  const tab1 = await openNewTab()
  await tab1.signIn('userA@test.com', 'password')
  const tab1Data = await tab1.loadData()
  
  // Tab 2: User B
  const tab2 = await openNewTab()
  await tab2.signIn('userB@test.com', 'password')
  const tab2Data = await tab2.loadData()
  
  // Tab 1 should NOT see User B's data
  expect(tab1Data.userId).toBe('userA-id')
  expect(tab1Data.entries).not.toEqual(tab2Data.entries)
  
  // Realtime updates should be isolated
  await tab2.addEntry({ domain: 'health', title: 'User B Entry' })
  await wait(2000) // Wait for realtime
  
  const tab1DataAfter = await tab1.loadData()
  expect(tab1DataAfter.entries).not.toContainEqual(
    expect.objectContaining({ title: 'User B Entry' })
  )
})
```

**Expected**: Complete data isolation, no cross-user data leakage  
**Edge Case**: User A sees User B's data, RLS bypass

---

## 2. Data Validation Edge Cases

### Scenario 2.1: XSS in Title Field
**Description**: User enters malicious script in title field

**Test Case**:
```typescript
test('should sanitize XSS attempts in title', async () => {
  const maliciousTitle = '<script>alert("XSS")</script>'
  
  const entry = await createDomainEntry({
    domain: 'financial',
    title: maliciousTitle,
    metadata: {}
  })
  
  // Title should be sanitized
  expect(entry.title).not.toContain('<script>')
  expect(entry.title).toBe('scriptalert("XSS")/script') // Stripped
  
  // Rendering should not execute script
  render(<EntryCard entry={entry} />)
  const titleElement = screen.getByText(/script/)
  expect(titleElement.innerHTML).not.toContain('<script>')
})
```

**Expected**: Script tags stripped, HTML encoded, no execution  
**Edge Case**: Script executes, cookies stolen, XSS vulnerability

---

### Scenario 2.2: Extremely Long Text (100,000 Characters)
**Description**: User pastes 100,000 character text into notes field

**Test Case**:
```typescript
test('should handle extremely long text in description', async () => {
  const longText = 'a'.repeat(100000)
  
  const start = performance.now()
  const entry = await createDomainEntry({
    domain: 'health',
    title: 'Long Notes',
    description: longText
  })
  const duration = performance.now() - start
  
  // Should complete in reasonable time
  expect(duration).toBeLessThan(5000) // < 5 seconds
  
  // Should truncate or warn user
  expect(entry.description.length).toBeLessThanOrEqual(10000)
  
  // UI should not freeze
  render(<EntryCard entry={entry} />)
  const isResponsive = await checkUIResponsiveness()
  expect(isResponsive).toBe(true)
})
```

**Expected**: Truncate to 10K chars, warn user, no UI freeze  
**Edge Case**: Browser crashes, UI freezes, database slow

---

### Scenario 2.3: Special Characters in All Fields
**Description**: Use emoji, foreign characters, symbols in all fields

**Test Case**:
```typescript
test('should handle special characters correctly', async () => {
  const entry = await createDomainEntry({
    domain: 'pets',
    title: '🐶 Max's 治療 (treatment) #123',
    description: 'Vet visit: €50.00 • Check-up ✓',
    metadata: {
      petName: 'Max 🐕',
      cost: '€50.00',
      notes: 'Vaccinations: 💉💉'
    }
  })
  
  // Should preserve emoji and unicode
  expect(entry.title).toContain('🐶')
  expect(entry.title).toContain('治療')
  expect(entry.description).toContain('€')
  expect(entry.description).toContain('✓')
  
  // Should search correctly
  const results = await searchEntries('Max')
  expect(results).toContainEqual(expect.objectContaining({
    id: entry.id
  }))
  
  // Should render correctly
  render(<EntryCard entry={entry} />)
  expect(screen.getByText(/🐶 Max/)).toBeInTheDocument()
})
```

**Expected**: Emoji and unicode fully supported, searchable, renders correctly  
**Edge Case**: Characters corrupted, search breaks, display issues

---

## 3. Date & Time Edge Cases

### Scenario 3.1: Daylight Saving Time Transition
**Description**: Create event on DST transition day (March 10, 2025, 2 AM)

**Test Case**:
```typescript
test('should handle DST transition correctly', async () => {
  // March 10, 2025, 2:00 AM - DST begins (clock jumps to 3:00 AM)
  const dstTransition = new Date('2025-03-10T02:30:00-05:00')
  
  const event = await createDomainEntry({
    domain: 'health',
    title: 'Appointment',
    metadata: {
      scheduledDate: dstTransition.toISOString()
    }
  })
  
  // Should store in UTC
  expect(event.metadata.scheduledDate).toContain('07:30:00') // UTC time
  
  // Should display in user's timezone
  const displayed = formatDateTime(event.metadata.scheduledDate)
  expect(displayed).toContain('3:30 AM') // Adjusted for DST
  
  // Notification should trigger at correct time
  const notification = await generateNotification(event)
  expect(notification.triggerAt).toBe('2025-03-10T03:30:00-04:00')
})
```

**Expected**: Correct UTC storage, proper timezone display, accurate notifications  
**Edge Case**: Wrong notification time, 1-hour off, duplicate/missing events

---

### Scenario 3.2: February 29 (Leap Year)
**Description**: Create insurance policy expiring Feb 29, 2024

**Test Case**:
```typescript
test('should handle leap year dates', async () => {
  const entry = await createDomainEntry({
    domain: 'insurance',
    title: 'Auto Insurance',
    metadata: {
      expirationDate: '2024-02-29'
    }
  })
  
  // Should accept Feb 29, 2024 (leap year)
  expect(entry.metadata.expirationDate).toBe('2024-02-29')
  
  // Should reject Feb 29, 2025 (not leap year)
  await expect(
    createDomainEntry({
      domain: 'insurance',
      title: 'Insurance',
      metadata: { expirationDate: '2025-02-29' }
    })
  ).rejects.toThrow('Invalid date')
  
  // Notification should trigger on Feb 28, 2025 (anniversary)
  const notification = await generateNotification(entry, '2025-02-28')
  expect(notification).toBeDefined()
})
```

**Expected**: Leap year validation, anniversary calculation, correct notifications  
**Edge Case**: Accepts invalid Feb 29, wrong anniversary date

---

### Scenario 3.3: Very Old & Very Future Dates
**Description**: Date of birth in 1920, future date in 2100

**Test Case**:
```typescript
test('should handle extreme date ranges', async () => {
  // Very old date (1920)
  const oldEntry = await createDomainEntry({
    domain: 'people',
    title: 'Grandparent',
    metadata: { dateOfBirth: '1920-01-01' }
  })
  
  const age = calculateAge(oldEntry.metadata.dateOfBirth)
  expect(age).toBeGreaterThan(100)
  expect(age).toBeLessThan(150) // Sanity check
  
  // Very future date (2100)
  const futureEntry = await createDomainEntry({
    domain: 'insurance',
    title: 'Life Insurance',
    metadata: { expirationDate: '2100-12-31' }
  })
  
  // Should NOT trigger notifications for distant future
  const notifications = await generateNotifications()
  expect(notifications).not.toContainEqual(
    expect.objectContaining({ entryId: futureEntry.id })
  )
  
  // Should warn user about unrealistic dates
  const validation = validateDate('2100-12-31')
  expect(validation.warning).toBeTruthy()
})
```

**Expected**: Accept old dates, warn on unrealistic future dates  
**Edge Case**: Age calculation overflow, notification spam

---

## 4. Concurrency & Race Conditions

### Scenario 4.1: Simultaneous Updates from 2 Devices
**Description**: User edits same entry on phone and laptop simultaneously

**Test Case**:
```typescript
test('should handle concurrent updates (last-write-wins)', async () => {
  // Device 1 loads entry
  const device1 = await createTestClient()
  const entry1 = await device1.getEntry('entry-123')
  
  // Device 2 loads same entry
  const device2 = await createTestClient()
  const entry2 = await device2.getEntry('entry-123')
  
  // Device 1 updates (timestamp: 1000)
  await device1.updateEntry({
    id: 'entry-123',
    title: 'Device 1 Update'
  }, { timestamp: 1000 })
  
  // Device 2 updates (timestamp: 2000)
  await device2.updateEntry({
    id: 'entry-123',
    title: 'Device 2 Update'
  }, { timestamp: 2000 })
  
  // Wait for realtime sync
  await wait(2000)
  
  // Both devices should show Device 2's update (later timestamp)
  const final1 = await device1.getEntry('entry-123')
  const final2 = await device2.getEntry('entry-123')
  
  expect(final1.title).toBe('Device 2 Update')
  expect(final2.title).toBe('Device 2 Update')
})
```

**Expected**: Last-write-wins, both devices converge to same state  
**Edge Case**: Updates lost, infinite loops, data corruption

---

### Scenario 4.2: Delete While Viewing
**Description**: User A deletes entry while User B is viewing it

**Test Case**:
```typescript
test('should handle delete while another user viewing', async () => {
  const entry = await createDomainEntry({
    domain: 'health',
    title: 'Shared Document'
  })
  
  // User B opens detail page
  const userB = await createTestClient('userB@test.com')
  await userB.navigateTo(`/domains/health/${entry.id}`)
  
  // User A deletes entry
  const userA = await createTestClient('userA@test.com')
  await userA.deleteEntry(entry.id)
  
  // Wait for realtime
  await wait(2000)
  
  // User B should see "Entry not found" message
  const errorMessage = await userB.getErrorMessage()
  expect(errorMessage).toContain('Entry no longer exists')
  
  // User B should be redirected to domain list
  const currentUrl = await userB.getCurrentUrl()
  expect(currentUrl).toBe('/domains/health')
})
```

**Expected**: Graceful error, redirect to list, no crash  
**Edge Case**: Page crashes, error 404, stale data shown

---

### Scenario 4.3: Rapid-Fire Adds (Stress Test)
**Description**: Add 100 entries in 10 seconds

**Test Case**:
```typescript
test('should handle rapid bulk additions', async () => {
  const entries = Array.from({ length: 100 }, (_, i) => ({
    domain: 'financial' as const,
    title: `Transaction ${i}`,
    metadata: { amount: Math.random() * 1000 }
  }))
  
  const start = performance.now()
  
  // Add all entries concurrently
  const results = await Promise.all(
    entries.map(entry => createDomainEntry(entry))
  )
  
  const duration = performance.now() - start
  
  // Should complete in reasonable time
  expect(duration).toBeLessThan(15000) // < 15 seconds
  expect(results).toHaveLength(100)
  
  // All entries should be in database
  const allEntries = await listDomainEntries('financial')
  expect(allEntries.length).toBeGreaterThanOrEqual(100)
  
  // UI should remain responsive
  const isResponsive = await checkUIResponsiveness()
  expect(isResponsive).toBe(true)
})
```

**Expected**: All entries saved, no duplicates, UI responsive  
**Edge Case**: Some entries lost, database timeout, UI freezes

---

## 5. Large Data Sets & Performance

### Scenario 5.1: 10,000 Domain Entries
**Description**: User has 10,000+ entries across all domains

**Test Case**:
```typescript
test('should handle 10,000 entries efficiently', async () => {
  // Seed 10,000 entries
  await seedTestData(10000)
  
  // Load dashboard
  const start = performance.now()
  render(<DashboardPage />)
  await waitForLoadingToFinish()
  const loadTime = performance.now() - start
  
  // Should load in < 3 seconds
  expect(loadTime).toBeLessThan(3000)
  
  // Pagination should work
  await scrollToBottom() // Trigger infinite scroll
  const visibleItems = screen.getAllByTestId('entry-card')
  expect(visibleItems).toHaveLength(50) // Only first page loaded
  
  // Search should be fast
  const searchStart = performance.now()
  await typeInSearchBox('medical')
  const searchResults = await waitForSearchResults()
  const searchTime = performance.now() - searchStart
  
  expect(searchTime).toBeLessThan(500) // < 500ms
  expect(searchResults.length).toBeGreaterThan(0)
})
```

**Expected**: Fast load, virtual scrolling, efficient search  
**Edge Case**: Page timeout, memory overflow, browser crash

---

### Scenario 5.2: 1MB+ Image Upload
**Description**: Upload 5MB image for OCR

**Test Case**:
```typescript
test('should compress and process large image', async () => {
  const largeImage = await generateTestImage({ size: 5 * 1024 * 1024 }) // 5MB
  
  const uploadStart = performance.now()
  
  const result = await uploadDocument(largeImage)
  
  const uploadTime = performance.now() - uploadStart
  
  // Should compress before uploading
  expect(result.compressedSize).toBeLessThan(1 * 1024 * 1024) // < 1MB
  
  // Should complete in reasonable time
  expect(uploadTime).toBeLessThan(30000) // < 30 seconds
  
  // OCR should still work
  expect(result.extractedText).toBeTruthy()
  expect(result.ocrConfidence).toBeGreaterThan(0.5)
})
```

**Expected**: Image compressed, OCR succeeds, reasonable time  
**Edge Case**: Upload timeout, OCR fails, server error

---

## 6. Network & Offline Scenarios

### Scenario 6.1: Offline Mode - Add Entry
**Description**: Go offline, add entry, come back online

**Test Case**:
```typescript
test('should queue offline changes and sync on reconnect', async () => {
  await signIn('user@test.com', 'password')
  
  // Go offline
  await setNetworkCondition('offline')
  
  // Add entry while offline
  const entry = await createDomainEntry({
    domain: 'health',
    title: 'Offline Entry',
    metadata: {}
  })
  
  // Should save to IDB
  const idbEntries = await idbGet('domain_entries_health')
  expect(idbEntries).toContainEqual(expect.objectContaining({
    title: 'Offline Entry'
  }))
  
  // Should show "offline" indicator
  expect(screen.getByText(/offline/i)).toBeInTheDocument()
  
  // Go back online
  await setNetworkCondition('online')
  await wait(5000) // Wait for sync
  
  // Should sync to Supabase
  const supabaseEntries = await listDomainEntries('health')
  expect(supabaseEntries).toContainEqual(expect.objectContaining({
    title: 'Offline Entry'
  }))
  
  // Should show "synced" indicator
  expect(screen.getByText(/synced/i)).toBeInTheDocument()
})
```

**Expected**: Offline queue, auto-sync on reconnect, no data loss  
**Edge Case**: Data not synced, duplicate entries, conflict errors

---

### Scenario 6.2: Intermittent Network (Flaky Connection)
**Description**: Network drops every 10 seconds

**Test Case**:
```typescript
test('should handle flaky network with retry logic', async () => {
  // Simulate flaky network
  const flakyNetwork = setInterval(() => {
    toggleNetwork() // Random online/offline
  }, 10000)
  
  try {
    // Try to add 5 entries
    const entries = await Promise.all([
      createDomainEntry({ domain: 'financial', title: 'Entry 1' }),
      createDomainEntry({ domain: 'financial', title: 'Entry 2' }),
      createDomainEntry({ domain: 'financial', title: 'Entry 3' }),
      createDomainEntry({ domain: 'financial', title: 'Entry 4' }),
      createDomainEntry({ domain: 'financial', title: 'Entry 5' }),
    ])
    
    // All should eventually succeed (with retries)
    expect(entries).toHaveLength(5)
    
    // No duplicates
    const allEntries = await listDomainEntries('financial')
    const titles = allEntries.map(e => e.title)
    expect(new Set(titles).size).toBe(titles.length)
  } finally {
    clearInterval(flakyNetwork)
  }
})
```

**Expected**: Auto-retry with exponential backoff, no duplicates  
**Edge Case**: Duplicate entries, failed retries, no error shown

---

## 7. External API Failures

### Scenario 7.1: Plaid API Rate Limit
**Description**: Hit Plaid API rate limit (100 req/min)

**Test Case**:
```typescript
test('should handle Plaid rate limiting gracefully', async () => {
  // Mock Plaid API to return 429 (rate limit)
  mockPlaidAPI({
    endpoint: '/link/token/create',
    statusCode: 429,
    response: { error: 'RATE_LIMIT_EXCEEDED' }
  })
  
  // Attempt to create link token
  const result = await createPlaidLinkToken('user-123')
  
  // Should show user-friendly error
  expect(result.error).toContain('too many requests')
  
  // Should suggest retry later
  expect(result.retryAfter).toBeDefined()
  
  // Should NOT crash app
  expect(screen.getByText(/try again/i)).toBeInTheDocument()
})
```

**Expected**: User-friendly error, suggest retry, no crash  
**Edge Case**: Generic error, no guidance, app unusable

---

### Scenario 7.2: Google Vision API Quota Exceeded
**Description**: Monthly OCR quota exceeded

**Test Case**:
```typescript
test('should fallback to Tesseract when Vision API exhausted', async () => {
  // Mock Google Vision to return 429 (quota exceeded)
  mockGoogleVisionAPI({
    statusCode: 429,
    response: { error: { message: 'Quota exceeded' } }
  })
  
  const testImage = await loadTestImage('receipt.jpg')
  
  // Should fallback to Tesseract
  const result = await smartScan(testImage)
  
  expect(result.ocrMethod).toBe('Tesseract.js')
  expect(result.extractedText).toBeTruthy()
  expect(result.confidence).toBeGreaterThan(0.3) // Lower confidence OK
  
  // Should warn user about quota
  expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument()
})
```

**Expected**: Automatic fallback, warn user, OCR still works  
**Edge Case**: No fallback, OCR fails, no explanation

---

### Scenario 7.3: VAPI Call Fails (No Answer)
**Description**: AI concierge call goes to voicemail

**Test Case**:
```typescript
test('should handle voicemail scenario', async () => {
  // Mock VAPI webhook for voicemail
  const callId = await initiateOutboundCall({
    businessName: 'Test Auto Shop',
    phoneNumber: '+15555551234',
    userRequest: 'oil change quote'
  })
  
  // Simulate voicemail webhook
  await simulateVAPIWebhook({
    callId,
    event: 'call-end',
    endReason: 'voicemail'
  })
  
  // Should mark call as "no-answer"
  const callHistory = await getCallHistory()
  const call = callHistory.find(c => c.id === callId)
  
  expect(call.status).toBe('no-answer')
  expect(call.outcome).toContain('voicemail')
  
  // Should suggest retry or try different number
  expect(screen.getByText(/no answer/i)).toBeInTheDocument()
  expect(screen.getByText(/try another/i)).toBeInTheDocument()
})
```

**Expected**: Mark as no-answer, suggest alternatives  
**Edge Case**: Marked as success, no feedback, confusing

---

## 8. Boundary Value Testing

### Scenario 8.1: $0.00 Transaction
**Description**: Add financial transaction with $0.00 amount

**Test Case**:
```typescript
test('should handle zero-dollar transactions', async () => {
  const entry = await createDomainEntry({
    domain: 'financial',
    title: 'Free Sample',
    metadata: {
      amount: 0,
      type: 'expense'
    }
  })
  
  expect(entry.metadata.amount).toBe(0)
  
  // Should show in transaction list
  const transactions = await listDomainEntries('financial')
  expect(transactions).toContainEqual(expect.objectContaining({
    id: entry.id
  }))
  
  // Should NOT affect budget calculations
  const budget = await calculateBudget()
  expect(budget.totalExpenses).toBeGreaterThanOrEqual(0)
  
  // Should display as "$0.00" not "$NaN"
  render(<EntryCard entry={entry} />)
  expect(screen.getByText('$0.00')).toBeInTheDocument()
})
```

**Expected**: Accept $0 transactions, display correctly, don't break calculations  
**Edge Case**: Rejected as invalid, displayed as NaN, breaks budget

---

### Scenario 8.2: 0% Progress on Goal
**Description**: Create goal with 0% progress

**Test Case**:
```typescript
test('should handle 0% goal progress', async () => {
  const goal = await createDomainEntry({
    domain: 'goals',
    title: 'Save $10,000',
    metadata: {
      target: 10000,
      current: 0,
      progress: 0
    }
  })
  
  // Progress bar should render
  render(<GoalCard goal={goal} />)
  const progressBar = screen.getByRole('progressbar')
  expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  
  // Should NOT show "complete" badge
  expect(screen.queryByText(/complete/i)).not.toBeInTheDocument()
  
  // Should allow updates
  await updateGoalProgress(goal.id, 100)
  const updated = await getDomainEntry(goal.id)
  expect(updated.metadata.current).toBe(100)
})
```

**Expected**: 0% progress valid, renders correctly, updatable  
**Edge Case**: Progress bar invisible, shows as complete

---

### Scenario 8.3: Maximum Integer (2^31 - 1)
**Description**: Enter amount $2,147,483,647 (max int32)

**Test Case**:
```typescript
test('should handle very large numbers safely', async () => {
  const maxInt32 = 2147483647
  
  const entry = await createDomainEntry({
    domain: 'financial',
    title: 'Lottery Win',
    metadata: {
      amount: maxInt32,
      type: 'income'
    }
  })
  
  expect(entry.metadata.amount).toBe(maxInt32)
  
  // Should format with commas
  render(<EntryCard entry={entry} />)
  expect(screen.getByText(/2,147,483,647/)).toBeInTheDocument()
  
  // Should calculate net worth correctly
  const netWorth = await calculateNetWorth()
  expect(netWorth).toBeGreaterThanOrEqual(maxInt32)
  
  // Should NOT overflow
  expect(netWorth).toBeLessThan(Number.MAX_SAFE_INTEGER)
})
```

**Expected**: Large numbers supported, formatted correctly, no overflow  
**Edge Case**: Integer overflow, displays incorrectly, calculation errors

---

## 9. Security Edge Cases

### Scenario 9.1: SQL Injection Attempt
**Description**: Try to inject SQL in search query

**Test Case**:
```typescript
test('should prevent SQL injection in search', async () => {
  const sqlInjection = "'; DROP TABLE domain_entries; --"
  
  // Should not throw error
  await expect(
    searchDomainEntries(sqlInjection)
  ).resolves.not.toThrow()
  
  // Table should still exist
  const entries = await listDomainEntries('health')
  expect(entries).toBeDefined()
  
  // Should treat as literal string
  const results = await searchDomainEntries(sqlInjection)
  expect(results).toEqual([]) // No matches
})
```

**Expected**: SQL injection prevented, query parameterized  
**Edge Case**: SQL executed, table dropped, data loss

---

### Scenario 9.2: CSRF Attack Attempt
**Description**: Malicious site tries to make authenticated request

**Test Case**:
```typescript
test('should reject requests without CSRF token', async () => {
  await signIn('user@test.com', 'password')
  
  // Simulate request from different origin
  const response = await fetch('http://localhost:3000/api/domain-entries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://malicious-site.com'
    },
    body: JSON.stringify({
      domain: 'financial',
      title: 'Malicious Entry'
    })
  })
  
  // Should reject (403 Forbidden)
  expect(response.status).toBe(403)
  
  // Entry should NOT be created
  const entries = await listDomainEntries('financial')
  expect(entries).not.toContainEqual(expect.objectContaining({
    title: 'Malicious Entry'
  }))
})
```

**Expected**: CSRF protection, reject cross-origin requests  
**Edge Case**: Request allowed, data modified by attacker

---

### Scenario 9.3: Enumerate Other Users' Data
**Description**: Try to access entries by guessing IDs

**Test Case**:
```typescript
test('should prevent user enumeration via IDs', async () => {
  // User A creates entry
  const userA = await createTestClient('userA@test.com')
  const entryA = await userA.createEntry({
    domain: 'health',
    title: 'Private Medical Record'
  })
  
  // User B tries to access User A's entry
  const userB = await createTestClient('userB@test.com')
  const result = await userB.getEntry(entryA.id)
  
  // Should return 404 or 403 (not 200)
  expect(result).toBeNull()
  
  // Should NOT reveal entry exists
  const error = await userB.getLastError()
  expect(error.message).not.toContain('belongs to another user')
  expect(error.message).toContain('not found')
})
```

**Expected**: RLS prevents access, no information leakage  
**Edge Case**: Entry returned, data leaked, privacy violation

---

## 10. Browser Compatibility

### Scenario 10.1: IndexedDB Not Supported
**Description**: Test on old browser without IndexedDB

**Test Case**:
```typescript
test('should fallback gracefully without IndexedDB', async () => {
  // Mock IndexedDB as undefined
  Object.defineProperty(window, 'indexedDB', {
    value: undefined
  })
  
  // App should still load
  render(<App />)
  await waitForLoadingToFinish()
  
  // Should show warning
  expect(screen.getByText(/offline mode unavailable/i)).toBeInTheDocument()
  
  // Should still work (without caching)
  await signIn('user@test.com', 'password')
  const entries = await listDomainEntries('health')
  expect(entries).toBeDefined()
  
  // Should fetch from Supabase every time
  const fetchCount = getMockFetchCallCount()
  await listDomainEntries('health') // Second call
  expect(getMockFetchCallCount()).toBe(fetchCount + 1)
})
```

**Expected**: Warn user, no caching, app still functional  
**Edge Case**: App crashes, white screen, error loop

---

### Scenario 10.2: JavaScript Disabled
**Description**: User has JavaScript disabled (not applicable for SPA, but check SSR)

**Test Case**:
```typescript
test('should show meaningful message without JavaScript', async ({ page }) => {
  // Disable JavaScript
  await page.setJavaScriptEnabled(false)
  await page.goto('/')
  
  // Should show noscript message
  const noscript = await page.locator('noscript').textContent()
  expect(noscript).toContain('JavaScript is required')
  
  // Should provide instructions
  expect(noscript).toContain('enable JavaScript')
})
```

**Expected**: Clear message, enable JS instructions  
**Edge Case**: Blank page, no guidance

---

## 📋 Test Execution Checklist

### Before Testing:
- [ ] Set up test database (separate from production)
- [ ] Configure mock API services
- [ ] Seed realistic test data
- [ ] Enable test feature flags

### During Testing:
- [ ] Run tests in parallel (when possible)
- [ ] Monitor test execution time
- [ ] Capture screenshots on failures
- [ ] Log detailed error messages

### After Testing:
- [ ] Review failed tests
- [ ] Update test documentation
- [ ] File bugs for edge cases found
- [ ] Update test coverage metrics

---

## 🎯 Priority Matrix

| Edge Case Category | Priority | Estimated Time |
|-------------------|----------|----------------|
| Authentication    | 🔴 Critical | 8 hours |
| Data Validation   | 🔴 Critical | 6 hours |
| Concurrency       | 🟡 High | 12 hours |
| Date/Time         | 🟡 High | 6 hours |
| Performance       | 🟡 High | 8 hours |
| Network/Offline   | 🟡 High | 10 hours |
| External APIs     | 🟡 High | 12 hours |
| Boundary Values   | 🟢 Medium | 4 hours |
| Security          | 🔴 Critical | 8 hours |
| Browser Compat    | 🟢 Low | 4 hours |

**Total Estimated Time**: ~78 hours

---

## 📝 Notes

- **Flaky Tests**: If a test fails intermittently, add retry logic or increase wait times
- **Test Data Cleanup**: Always clean up test data after each test
- **Mock API Responses**: Use deterministic responses for consistent results
- **Performance Tests**: Run on production-like hardware for accurate metrics
- **Security Tests**: Coordinate with security team before running

---

*Generated by Claude Code Assistant - Edge Case Testing Module*



