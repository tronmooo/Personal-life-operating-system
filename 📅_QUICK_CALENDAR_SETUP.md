# 📅 Google Calendar Quick Setup Guide

## ⚡ QUICK START (3 Steps)

### Step 1: Add Your API Key
Create or edit `.env.local` file in your project root and add:
```
NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY=AIzaSyCKFMyWP3yaX7NozlCWwVeh42tNqxg33Rg
```

### Step 2: Restart Server
```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

### Step 3: View Your Calendar
1. Go to http://localhost:3001
2. Click **"View Calendar"** in the appointments card
3. See all your Google Calendar events! 🎉

---

## 🎯 What You Can Do Now

### From Command Center Dashboard:
- **View Today's Appointments**: See them in the appointments card
- **Add Appointment**: Click "Add" button for quick entry
- **View Full Calendar**: Click "View Calendar" to see everything

### From Appointments Page (`/appointments`):
- **Month View**: See entire month with all events
- **Week View**: See week-by-week schedule
- **Day View**: Focus on a single day
- **Click Events**: View full details with location, attendees, etc.
- **Add Events**: Create new appointments (saved locally)
- **Navigate**: Use arrows or "Today" button to move around
- **Refresh**: Get latest events from Google Calendar

---

## 🎨 Calendar Views

### Month View
- Grid layout showing full month
- Color-coded events on each day
- Click any date to see that day's events
- Shows up to 2 events per day, "+X more" for additional

### Week View
- 7 days shown vertically
- All events for each day listed
- Easy to scan week at a glance
- Color-coded event bars

### Day View
- All events for selected day
- Sorted by time
- Full details visible
- "Now" badge for current events

---

## 💡 Pro Tips

### 1. Quick Navigation
- Use **←** and **→** buttons to move between periods
- Click **"Today"** to jump to current date
- Click any date in month view to switch to that day

### 2. Event Details
- Click any event to see:
  - Full description
  - Location (with map pin)
  - Attendees and their response status
  - Link to open in Google Calendar
  - Organizer information

### 3. Adding Appointments
- Events you create are saved **locally**
- They appear in both calendar views
- Synced across your app's domains
- To sync to Google Calendar, you'll need OAuth (see main guide)

### 4. Color Coding
- Events are color-coded based on:
  - Calendar color (if set in Google Calendar)
  - Event color (if you've assigned one)
  - Default blue for uncolored events

### 5. Refresh Data
- Click the refresh icon (↻) to get latest events
- Automatically refreshes when changing views
- No manual refresh needed usually

---

## 🔍 Where to Find It

### Navigation Options:
1. **Command Center** → Click "View Calendar" button
2. **Direct URL** → Go to `/appointments`
3. **Domains** → Schedule domain (if applicable)

### Command Center Card:
- Shows today's appointments
- Count badge shows total for today
- Two buttons: "Add" and "View Calendar"

---

## ❓ Common Questions

### Can I create events in Google Calendar from the app?
Not with API key only. You can:
- ✅ View all Google Calendar events
- ✅ See all event details
- ✅ Create local appointments
- ❌ Create events directly in Google Calendar (needs OAuth)

### What's the difference between local and Google events?
- **Google Events**: From your Google Calendar, read-only
- **Local Events**: Created in the app, saved locally, editable

### How often does it sync with Google?
- Refreshes when you change views
- Click refresh button anytime for latest
- Events update in real-time when you refresh

### Can I see multiple calendars?
Currently shows your primary calendar. Multiple calendar support coming soon!

---

## 🎊 That's It!

You now have full Google Calendar integration! 

Your calendar events will appear alongside your local appointments, giving you a complete view of your schedule.

**Enjoy!** 📅✨

---

## 📖 Need More Help?

See the full guide: `🎉_GOOGLE_CALENDAR_INTEGRATION_COMPLETE.md`


