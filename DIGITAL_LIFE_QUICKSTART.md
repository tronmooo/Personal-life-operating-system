# 🚀 Digital Life Domain - Quick Start Guide

## Step 1: Apply Database Migration

Run the migration to create the necessary tables:

### Option A: Using Supabase Studio (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `supabase/migrations/20251211_subscriptions_schema.sql`
5. Click **Run**

### Option B: Using Supabase CLI
```bash
cd "/Users/robertsennabaum/new project"
supabase db push
```

## Step 2: Start Development Server

```bash
npm run dev
```

## Step 3: Access Digital Life Domain

Open your browser and navigate to:
```
http://localhost:3000/domains/digital
```

## Step 4: Add Your First Subscription

1. Click the **"Add Subscription"** button (top right)
2. Fill in the form:
   - **Service Name**: e.g., "Netflix"
   - **Cost**: e.g., "15.99"
   - **Frequency**: Monthly
   - **Category**: Streaming
   - **Status**: Active
   - **Next Due Date**: Pick a date
   - (Optional) Payment Method, Account URL
3. Click **"Add Subscription"**

## Step 5: Explore the Tabs

### 📊 Dashboard Tab
- View monthly/yearly spend
- See active subscriptions
- Check renewals due this week
- Browse upcoming renewals
- Analyze spending by category

### 📋 All Subscriptions Tab
- Search subscriptions
- Filter by category
- View in table format
- Edit/Delete subscriptions

### 📅 Calendar Tab
- See subscriptions on a calendar
- View charges by date
- Navigate months

### 📈 Analytics Tab
- Monthly spending trend
- Cost perspectives (daily, weekly, yearly)
- Subscription health metrics
- Old subscriptions to review

## Optional: Seed Sample Data

To quickly populate with sample subscriptions:

```bash
# Make sure you're logged into the app first
npx tsx scripts/seed-digital-life.ts
```

This will create 12 sample subscriptions including Netflix, Spotify, ChatGPT Plus, etc.

## View in Command Center

The Digital Life widget automatically appears in your main dashboard at:
```
http://localhost:3000/
```

Look for the blue/purple gradient card showing your subscription summary!

## 🎨 Customization

### Change Category Colors

Edit `lib/utils/subscription-colors.ts`:

```typescript
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    streaming: '#ef4444', // Change to your preferred color
    // ... more categories
  }
  return colors[category] || colors.other
}
```

### Add New Categories

1. Update the check constraint in migration:
   ```sql
   category TEXT NOT NULL CHECK (category IN (
     'streaming', 'software', 'your_new_category'
   ))
   ```

2. Add to dropdown in `add-subscription-dialog.tsx`:
   ```tsx
   <SelectItem value="your_new_category">Your New Category</SelectItem>
   ```

3. Add color in `subscription-colors.ts`

## 📱 Mobile Access

The entire interface is mobile-responsive. Access from your phone and enjoy the same features!

## 🔧 Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in
- Check Supabase RLS policies are enabled
- Verify auth token is valid

### Data Not Loading
- Check browser console for errors
- Verify migration was applied successfully
- Ensure Supabase connection is working

### Styles Not Showing
- Clear browser cache
- Restart dev server
- Check Tailwind CSS is building properly

## 🎯 Next Steps

1. ✅ Add all your real subscriptions
2. 📧 Set up email reminders (future enhancement)
3. 📊 Export your data to CSV (future enhancement)
4. 💡 Share feedback for improvements

## 🐛 Need Help?

Check the comprehensive documentation in `DIGITAL_LIFE_COMPLETE.md` for:
- Complete API reference
- Component documentation
- Database schema details
- Advanced features

---

**Enjoy tracking your subscriptions!** 💰📊





