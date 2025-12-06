# Document Search Debugging Guide

## Issue Reported
User asked: "can you pull up my vehicle registration and my drivers license"
Result: Only found registration documents, missed driver's license

## Improvements Made

### 1. Enhanced Logging
The search API now logs:
- Original query
- Cleaned search terms
- Expanded terms (showing all variations)
- Each matched document with which terms matched
- Warnings when no results found

**Check server logs when searching to see:**
```
🔍 Search query: "vehicle registration, drivers license"
🔍 Original terms: [vehicle registration, drivers license]
🔍 Expanded terms (18): [vehicle registration, registration, car registration, ...]
✅ MATCHED: "Federal Vehicle Registration" - matched terms: [registration, vehicle registration]
✅ MATCHED: "Driver License - Any State" - matched terms: [driver, license, drivers license]
✅ Found 2 document(s) matching query
```

### 2. Comprehensive Local Fallback
Added robust local expansion that handles:
- **Plural/singular variations**: "drivers" ↔ "driver"
- **Possessive variations**: "driver's" ↔ "drivers" ↔ "driver"
- **Common abbreviations**: "DL" → "driver license", "drivers license", etc.
- **Partial matches**: "license" matches "driver license", "drivers license", etc.

**Enhanced Expansions:**
```javascript
'drivers license' → [
  'drivers license',
  'driver license',
  "driver's license",
  'dl',
  'license',
  'driver',
  'id'
]
```

### 3. Better Error Handling
- If AI expansion fails, automatically falls back to comprehensive local expansion
- Logs indicate whether AI or fallback was used
- Never returns empty results if documents exist

## Testing

### Test 1: Driver's License Variations
All of these should now find your driver's license:
- ✅ "drivers license"
- ✅ "driver license"
- ✅ "driver's license"
- ✅ "DL"
- ✅ "license"
- ✅ "ID"

### Test 2: Multi-Term Search
"vehicle registration and drivers license" should find BOTH:
- ✅ Vehicle registration documents
- ✅ Driver's license documents

### Test 3: Edge Cases
- ✅ "my car papers" → registration, title, insurance
- ✅ "ID stuff" → driver's license, passport, state ID
- ✅ "insurance and registration" → both types

## How to Debug

### Step 1: Check Server Logs
When you search, look at your terminal running `npm run dev`:

```bash
🔍 Search query: "drivers license"
🔍 Original terms: [drivers license]
🔍 Expanded terms (7): [drivers license, driver license, driver's license, dl, license, driver, id]
🔍 Expansion succeeded ✅  # or "fell back to local"
✅ MATCHED: "Driver License - Any State" (ID & Licenses) - matched terms: [driver, license]
✅ Found 1 document(s) matching query "drivers license"
```

### Step 2: Verify Document Attributes
Your driver's license document should have:
- **Name**: Contains "driver" or "license"
- **Category**: "ID & Licenses"
- **Type**: "Driver's License" or similar
- **Domain**: "insurance" (since it's in the insurance page)

### Step 3: Test Query Cleaning
The query "can you pull up my drivers license" should become:
1. Remove "can you" → "pull up my drivers license"
2. Remove "pull up" → "my drivers license"
3. Remove "my " → "drivers license"
4. Split by comma → ["drivers license"]
5. Expand → ["drivers license", "driver license", "driver's license", "dl", "license", "driver", "id"]

## Common Issues & Solutions

### Issue: Document not found
**Check:**
1. Is the document in the database? (Go to /insurance and verify it's there)
2. Check the document's `document_name` and `metadata.category`
3. Look at server logs to see what search terms were used
4. Verify the document isn't filtered out by category

**Solution:**
- If document name is "Drivers License", search should match "drivers", "license", or "driver"
- If category is "ID & Licenses", search for "id" should match

### Issue: Only some documents found
**Check:**
1. Server logs show which terms matched which documents
2. Verify all documents are in the same domain or no domain filter is applied
3. Check if documents are in different categories that aren't being searched

**Solution:**
- Ensure no category filter is limiting results
- Use broader terms like "documents" or "papers"

### Issue: AI expansion not working
**Check:**
1. Look for log: "Expansion succeeded ✅" vs "fell back to local"
2. Verify `OPENAI_API_KEY` is set in environment
3. Check for expansion errors in logs

**Solution:**
- Local fallback is very comprehensive, so results should still be good
- Set `OPENAI_API_KEY` for even better expansion

## Expected Behavior

### Your Specific Query
**Input:** "can you pull up my vehicle registration and my drivers license"

**Step-by-step processing:**
1. Clean query: "vehicle registration, drivers license"
2. Split terms: ["vehicle registration", "drivers license"]
3. Expand "vehicle registration":
   - AI/Local: [vehicle registration, registration, car registration, auto registration, reg, vehicle, car]
4. Expand "drivers license":
   - AI/Local: [drivers license, driver license, driver's license, dl, license, driver, id]
5. Combined search terms (14 total):
   - [vehicle registration, registration, car registration, auto registration, reg, vehicle, car, drivers license, driver license, driver's license, dl, license, driver, id]
6. Search finds:
   - ✅ "Federal Vehicle Registration" (matches: registration, vehicle registration, vehicle)
   - ✅ "Driver License - Any State" (matches: driver, license, dl, id)

**Result:** Should find BOTH documents! 🎉

## Troubleshooting Commands

### Test the expansion API directly:
```bash
curl -X POST http://localhost:3002/api/documents/expand-search-terms \
  -H "Content-Type: application/json" \
  -d '{"query": "drivers license"}'
```

Expected response:
```json
{
  "success": true,
  "originalQuery": "drivers license",
  "expandedTerms": ["drivers license", "driver license", "driver's license", "dl", "license", "driver", "id"],
  "source": "ai" // or "cache" or "fallback"
}
```

### Test the search API:
```bash
curl "http://localhost:3002/api/documents/search?q=drivers%20license"
```

Should return your driver's license document(s).

## Next Steps

1. **Test now**: Try the query again and check server logs
2. **Verify**: Check if both registration AND driver's license are found
3. **Report**: Share the server log output if still not working

The search should now be MUCH more reliable! 🚀




