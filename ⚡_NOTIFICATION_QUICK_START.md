# ⚡ Notification System - Quick Start

## 🎉 What You Got

A **complete smart notification system** that monitors all your life domains and sends prioritized alerts!

---

## 🚀 Ready to Use Right Now

### ✅ Already Working
- 🔔 Notification bell in header (shows unread count)
- 📊 Smart scanning of all domains (every 30 minutes)
- 🎨 Beautiful notification drawer UI
- 📱 Real-time updates
- 🎯 Priority grouping (Critical, Important, Info)
- ⏰ Snooze & dismiss actions
- 🌙 Dark mode support

### 🎯 Notification Sources (10)
1. **Insurance** - Expiration alerts
2. **Vehicles** - Registration, service due
3. **Health** - Appointments, medications
4. **Bills** - Due dates, overdue
5. **Home** - Maintenance tasks
6. **Relationships** - Birthdays, anniversaries
7. **Goals** - Achievements
8. **Fitness** - Workout streaks
9. **Finance** - Spending spikes, net worth
10. **Mindfulness** - Meditation streaks

---

## 🔔 Test It Now

### 1. Open Your App
The notification system is already running!

### 2. Look at the Header
You should see a bell icon 🔔 next to your profile picture.

### 3. Click the Bell
Opens a beautiful drawer showing all notifications grouped by priority.

### 4. Try Actions
- ✅ Mark as read
- ⏰ Snooze (remind tomorrow)
- ✖️ Dismiss
- 🔗 Take action (opens relevant page)

---

## 🔥 Enable Push Notifications (Optional)

### Quick Setup (5 minutes)

1. **Run the setup script:**
```bash
npm install web-push
node scripts/setup-push-notifications.js
```

2. **Restart your dev server:**
```bash
npm run dev
```

3. **Test in your app:**
- Go to Settings
- Enable "Push Notifications"
- Click "Send Test Notification"
- You should see a browser notification! 🎉

---

## 📋 Notification Examples

### 🔴 Critical Notifications
```
🔴 Insurance Expires Soon
Your Auto insurance expires in 5 days!
[Renew Now]
```

```
🔴 Bill Past Due
Your Electric bill of $150 is overdue!
[Pay Now]
```

### 🟡 Important Notifications
```
🟡 Appointment Tomorrow
Doctor appointment at 2:00 PM tomorrow
[View Details]
```

```
🟡 Birthday Coming Up
Sarah's birthday is in 3 days!
[View Contact]
```

### 🟢 Info Notifications
```
🎉 Goal Achieved!
You've completed your fitness goal: Run 100 miles
[View Goals]
```

```
📈 Net Worth Increased!
Your net worth increased by $5,234 (8.5%)
[View Details]
```

---

## ⚙️ User Settings

### Add Settings Page
Users can customize their notification preferences:

```tsx
// In your settings page:
import { NotificationSettings } from '@/components/settings/notification-settings'

<NotificationSettings />
```

### What Users Can Control
- ✅ Enable/disable push notifications
- ✅ Turn on/off notification types (Critical, Important, Info)
- ✅ Set daily digest time
- ✅ Set weekly summary day
- ✅ Configure quiet hours

---

## 🤖 Set Up Automated Scanning (Optional)

### Option A: Vercel Cron (Recommended)

Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/notifications/cron",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs the notification scan daily at 6am for all users.

### Option B: External Cron
Use any cron service to call:
```bash
curl -X GET https://your-app.vercel.app/api/notifications/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🧪 Testing

### Generate Notifications Manually
```javascript
// In browser console:
fetch('/api/notifications/generate', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

### Check Database
```sql
-- See all your notifications
SELECT * FROM notifications WHERE user_id = 'your-user-id';

-- Count by priority
SELECT priority, COUNT(*) 
FROM notifications 
GROUP BY priority;
```

---

## 📊 How It Works

```
Every 30 minutes:
  ↓
Check last scan time
  ↓
If > 6 hours → Generate notifications
  ↓
Scan all 10 domains for alerts
  ↓
Save to database
  ↓
Real-time update → UI shows new notifications
  ↓
Critical items → Push notification (if enabled)
```

---

## 🎯 What Gets Monitored

### Insurance Domain
- ✅ Policies expiring in 7-30 days → 🟡 Important
- ✅ Policies expiring in < 7 days → 🔴 Critical
- ✅ Already expired → 🔴 Critical

### Vehicles Domain
- ✅ Registration due in 30 days → 🟡 Important
- ✅ Registration due in < 7 days → 🔴 Critical
- ✅ Registration overdue → 🔴 Critical
- ✅ Service due in 7 days → 🟡 Important

### Health Domain
- ✅ Appointment in 2 hours → 🔴 Critical
- ✅ Appointment tomorrow → 🟡 Important
- ✅ Medication refill in 3 days → 🟡 Important
- ✅ Medication refill in 1 day → 🔴 Critical

### Bills Domain
- ✅ Bill due in 7 days → 🟡 Important
- ✅ Bill due in 3 days → 🔴 Critical
- ✅ Bill overdue → 🔴 Critical

### Home Domain
- ✅ Maintenance task due in 7 days → 🟡 Important

### Relationships Domain
- ✅ Birthday in 3 days → 🟡 Important
- ✅ Anniversary in 3 days → 🟡 Important

### Goals Domain
- ✅ Goal achieved → 🟢 Info

### Fitness Domain
- ✅ Workout streak milestone (7, 30, 100 days) → 🟢 Info

### Finance Domain
- ✅ Spending 2x average → 🟡 Important
- ✅ Net worth increase >5% → 🟢 Info

### Mindfulness Domain
- ✅ Meditation streak milestone (7, 21, 100 days) → 🟢 Info

---

## 📱 What Users See

### In the Header
```
🔔 (3) ← Red badge shows unread count
```

### In the Drawer
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Notifications                Mark all read
3 unread
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 Critical (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔴 Insurance Expires Soon
  Your Auto insurance expires in 5 days!
  2h ago
  [View Policy] [Snooze] [Dismiss]

  🔴 Bill Past Due
  Your Electric bill of $150 is overdue!
  5h ago
  [Pay Now] [Snooze] [Dismiss]

🟡 Important (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟡 Birthday Coming Up
  Sarah's birthday is in 3 days!
  1d ago
  [View Contact] [Snooze] [Dismiss]

🟢 Info (0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  No info notifications
```

---

## 🔍 Troubleshooting

### No Notifications Showing?
1. Check browser console for errors
2. Verify you have data in your domains (insurance, bills, etc.)
3. Manually trigger: `fetch('/api/notifications/generate', {method: 'POST'})`

### Push Notifications Not Working?
1. Check browser supports push (Chrome, Firefox, Edge, Safari 16+)
2. Verify VAPID keys are set in `.env.local`
3. Check notification permissions in browser settings
4. Test with "Send Test Notification" button

### Bell Icon Not Showing?
The notification bell is already in your header! Look next to your profile picture.

---

## 🎓 Learn More

- 📖 Full documentation: `🔔_NOTIFICATION_SYSTEM_COMPLETE.md`
- 💻 Code files:
  - Generator: `lib/notifications/notification-generator.ts`
  - UI: `components/dashboard/notification-hub.tsx`
  - API: `app/api/notifications/`
- 🗄️ Database: `supabase/migrations/20250117_notifications.sql`

---

## 🎉 You're All Set!

Your notification system is:
- ✅ Fully functional
- ✅ Monitoring 10 life domains
- ✅ Scanning every 30 minutes
- ✅ Showing in your UI right now
- ✅ Ready for push notifications

**Open your app and click the bell icon!** 🔔

---

**Need help?** Check the console logs or read the full docs in `🔔_NOTIFICATION_SYSTEM_COMPLETE.md`



