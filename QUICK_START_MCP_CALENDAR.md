# 🚀 Quick Start: MCP + AI Calendar

## ⚡ 5-Minute Setup

### **Step 1: Refresh Your Browser** ⏱️ 10 seconds
```
Press: Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)
```
This ensures the latest code is loaded.

---

### **Step 2: View MCP Servers** ⏱️ 30 seconds

1. Navigate to: **`http://localhost:3000/external`**
2. You should see **5 MCP server cards**:
   - 📅 **Google Calendar** (✅ Active)
   - 🗄️ **Supabase Database** (✅ Active)
   - 🔍 **Web Search** (✅ Active)
   - 📁 **File System** (❌ Inactive)
   - 🐙 **GitHub** (❌ Inactive)

**✅ Success Indicator:** Server cards display with toggle switches

**❌ If you see a loading spinner:**
- Wait 10 seconds for first-time compilation
- Check browser console (F12) for errors
- Verify server is running: `http://localhost:3000`

---

### **Step 3: Grant Calendar Access** ⏱️ 1 minute

**⚠️ CRITICAL STEP - Required for event creation**

1. Go to **Dashboard** (`http://localhost:3000`)
2. Find the **Google Calendar** card
3. Look for status:
   - **If yellow badge "1":** Calendar needs access
   - **If green:** Skip to Step 4

4. Click **"Grant Calendar Access"** (blue button)
5. Google OAuth popup appears
6. **Select your Google account**
7. **Approve all permissions:**
   - ✅ View your calendars
   - ✅ **Edit your calendars** ← IMPORTANT
   - ✅ Create new events
8. You'll be redirected back to the app
9. Calendar should now show upcoming events

**✅ Success Indicator:** 
- Green refresh icon appears
- Upcoming events display
- No more "Grant Access" button

---

### **Step 4: Create Your First AI Event** ⏱️ 1 minute

1. On the **Dashboard**, find the Google Calendar card
2. Click **"Create with AI"** (purple gradient button)
3. A dialog opens with examples
4. **Try one of these:**
   - `"Meeting with John tomorrow at 3pm"`
   - `"Dentist appointment next Tuesday at 10am"`
   - `"Lunch with Sarah on Friday at 12:30pm"`
5. Click **"Create Event"**
6. Wait 2-5 seconds
7. ✅ Success message appears with event details
8. Click the Google Calendar link to view

**✅ Success Indicator:**
- Green success box appears
- Event summary and time displayed
- Link to Google Calendar provided
- Event visible in your Google Calendar

---

### **Step 5: Manage MCP Servers** ⏱️ 30 seconds

1. Navigate to **`/external`**
2. **Toggle a server:**
   - Find any server card
   - Click the toggle switch
   - Status updates immediately
3. **View capabilities:**
   - Each card shows what the server can do
   - Example: Calendar → "create_event", "read_events"

**✅ Success Indicator:**
- Toggle changes from gray to green (or vice versa)
- Status text updates: "Active" ↔ "Inactive"

---

## 🎯 Verification Checklist

Run through these 5 tests:

### ✅ Test 1: MCP API
```bash
curl http://localhost:3000/api/mcp/config
```
**Expected:** JSON response with server configurations

### ✅ Test 2: External Page
- Visit: `http://localhost:3000/external`
- **Expected:** 5 server cards display

### ✅ Test 3: Calendar Access
- Visit: `http://localhost:3000`
- **Expected:** Calendar card shows events or "Grant Access" button

### ✅ Test 4: Event Creation
- Click "Create with AI"
- Type: `"Test meeting tomorrow at 2pm"`
- **Expected:** Success message + event created

### ✅ Test 5: MCP Toggle
- Visit: `/external`
- Toggle Web Search off, then on
- **Expected:** Status updates visually

---

## 📝 Natural Language Examples

The AI understands these phrases:

### **Time References:**
- "tomorrow at 3pm"
- "next Tuesday at 10am"
- "this Friday at 2:30pm"
- "Monday morning at 9am"
- "in 2 hours"

### **Duration:**
- "for 1 hour" (default if not specified)
- "for 30 minutes"
- "from 2pm to 4pm"

### **Event Types:**
- "Meeting with [person]"
- "Dentist appointment"
- "Team standup"
- "Lunch at [place]"
- "Call with [person]"

### **Complete Examples:**
```
✅ "Meeting with Sarah tomorrow at 3pm"
✅ "Dentist appointment next Tuesday at 10am for 1 hour"
✅ "Team standup every Monday at 9am"
✅ "Lunch at The Ivy on Friday at 12:30pm for 90 minutes"
✅ "Call with John next week at 2pm"
✅ "Coffee meeting tomorrow morning at 10am"
```

---

## 🎨 Visual Guide

### **Calendar Card States:**

**State 1: Not Connected** 🟡
```
┌─────────────────────────┐
│ 📅 Google Calendar      │
│ [Yellow Badge: 1]       │
│ [Grant Calendar Access] │ ← Click this
└─────────────────────────┘
```

**State 2: Connected** 🟢
```
┌─────────────────────────┐
│ 📅 Google Calendar  [🔄]│
│ Next 3 events:          │
│ • Meeting - Tomorrow... │
│ • Lunch - Friday...     │
│ [Create with AI]        │ ← Click this
└─────────────────────────┘
```

### **MCP Server Card:**
```
┌──────────────────────────────┐
│ 📅 Google Calendar    [ON]   │
│ Create, read, and manage...  │
│                              │
│ Capabilities:                │
│ • create_event               │
│ • read_events                │
│ • update_event               │
│                              │
│ ✅ Active          [Connect] │
└──────────────────────────────┘
```

---

## 🚨 Common Issues

### **Issue: "Unauthorized" Error**
**Solution:** Middleware was updated. Refresh browser (Cmd+Shift+R)

### **Issue: Calendar Event Not Created**
**Solution:** 
1. Check if you clicked "Grant Calendar Access"
2. Verify calendar permissions include "Edit" (not just "Read")
3. Check browser console for errors

### **Issue: MCP Page Shows Loading Forever**
**Solution:**
1. Open browser console (F12)
2. Look for error messages
3. Verify API works: `curl http://localhost:3000/api/mcp/config`
4. Restart dev server if needed

### **Issue: "Provider Token Not Found"**
**Solution:** 
1. Log out completely
2. Log back in with Google
3. Grant calendar permissions again

---

## 🎓 Advanced Usage

### **Create Recurring Events:**
```
"Team standup every Monday at 9am"
"Weekly check-in every Friday at 3pm"
```
*(Note: First version creates single event, recurring coming soon)*

### **Add Location:**
```
"Meeting at Coffee Shop tomorrow at 2pm"
"Lunch at The Ivy on Friday"
```
The AI will extract the location automatically.

### **Add Details:**
```
"Quarterly review meeting tomorrow at 3pm to discuss Q4 results"
```
The extra context becomes the event description.

---

## 📊 System Requirements

- ✅ Next.js dev server running (`npm run dev`)
- ✅ Browser: Chrome, Firefox, Safari, or Edge
- ✅ Google account with Calendar access
- ✅ Environment variables configured (`.env.local`)

---

## 🎯 Success Metrics

After completing this guide, you should be able to:

- [x] View 5 MCP servers on `/external` page
- [x] Toggle MCP servers on/off
- [x] Grant Google Calendar write access
- [x] Create calendar events using natural language
- [x] See events appear in Google Calendar within seconds
- [x] Understand how MCP powers AI tool access

---

## 🎉 You're Done!

**Total Time:** ~5 minutes  
**Calendar Events Created:** 1+  
**MCP Servers Configured:** 5  
**AI Tools Available:** 15+ capabilities

### **Next Steps:**
1. Create more events with different natural language
2. Explore the External tab and toggle servers
3. Check your Google Calendar for AI-created events
4. Try complex event descriptions with locations and times

---

**Happy Event Creating!** 🗓️✨

Need help? Check `MCP_TROUBLESHOOTING.md` for detailed debugging steps.






















