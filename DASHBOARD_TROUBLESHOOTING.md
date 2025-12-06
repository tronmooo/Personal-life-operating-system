# Dashboard Troubleshooting Guide

## If Dashboard is Stuck Loading

### Quick Fix (Recommended)
1. Open your browser's Developer Console (Press `F12` or `Cmd+Option+I` on Mac)
2. Go to the "Console" tab
3. Type this command and press Enter:
   ```javascript
   localStorage.setItem('dashboard-view-mode', 'standard'); window.location.reload();
   ```
4. The page will reload with the standard dashboard

### Alternative Fix (Via Settings)
1. Navigate to `/settings` in your browser
2. Click on the **Dashboard** tab
3. If you see "Current Mode: Customizable", click **"Disable Customize"**
4. Click **"Go to Command Center"** to return to your dashboard

## Dashboard Modes

### Standard Mode (Default - Recommended)
- **Status**: ✅ Fully Working
- **Features**: All cards visible, fixed layout
- **Best For**: Day-to-day use, stable experience

### Customizable Mode (Experimental)
- **Status**: ⚠️ In Development
- **Features**: Drag, resize, and customize cards
- **Notes**: 
  - Only works with authenticated users
  - Requires Supabase database connection
  - May have loading issues
  - Top 6 cards (Smart Inbox, Critical Alerts, Tasks, Habits, Google Calendar, Special Dates) are NOT customizable

## Common Issues

### Issue: "Loading dashboard..." shows indefinitely
**Cause**: Customizable mode is enabled but can't load layout  
**Solution**: Run the Quick Fix above

### Issue: Console shows "⚠️ Not authenticated"
**Cause**: User not logged in  
**Solution**: Standard dashboard works without authentication. Customizable mode requires login.

### Issue: "Multiple GoTrueClient instances detected"
**Cause**: Multiple Supabase client instances (harmless warning)  
**Solution**: Can be safely ignored - doesn't affect functionality

## Manual Reset Script

If you need to completely reset your dashboard preferences:

```javascript
// Open browser console (F12) and run:
localStorage.removeItem('dashboard-view-mode');
localStorage.removeItem('dashboard-layout-id');
window.location.reload();
```

## What Changed (For Developers)

### Files Modified:
1. `components/dashboard/customizable-command-center.tsx`
   - Added fallback for unauthenticated users
   - Added error handling for layout loading
   - Prevents infinite loading state

2. `components/settings/dashboard-tab.tsx`
   - Added warning message for experimental features
   - Defaults to standard mode
   - Marked standard mode as "Recommended"

3. `components/dashboard/dashboard-switcher.tsx`
   - Ensures standard mode is always the default

4. `lib/utils/dashboard-reset.ts`
   - New utility for programmatic dashboard reset

### Fixed Issues:
- ✅ Dashboard no longer gets stuck in loading state
- ✅ Graceful fallback when layout can't be loaded
- ✅ Better default mode handling
- ✅ Warning messages for experimental features

## Support

If issues persist after trying these solutions, please:
1. Check the browser console for errors
2. Note which mode you're using (Standard vs Customizable)
3. Try clearing all browser data for localhost:3000



























