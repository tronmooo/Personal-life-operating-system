# 🚀 Supabase Setup Guide for LifeHub

## Important Note

**Your app currently works WITHOUT Supabase!** 

All data is stored in your browser's `localStorage`. This means:
- ✅ You can use the app immediately
- ✅ No backend configuration needed to start
- ✅ All features work offline
- ⚠️ Data is only stored locally (not synced across devices)
- ⚠️ Clearing browser data will delete everything

## Why Add Supabase?

Adding Supabase gives you:
1. **Cloud Sync** - Access your data from any device
2. **User Authentication** - Secure login system
3. **Data Backup** - Automatic cloud backups
4. **Multi-device Support** - Seamless sync across devices
5. **Collaboration** - Share data with family/team

## Quick Setup (5 minutes)

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### Step 2: Create New Project

1. Click "New Project"
2. Choose a name: `lifehub` (or anything you like)
3. Set a strong database password (save it!)
4. Select a region closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### Step 3: Get Your API Keys

1. In your Supabase dashboard, click "Settings" (⚙️) in the sidebar
2. Click "API" under Project Settings
3. You'll see two important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
4. **Keep this tab open** - you'll need these values

### Step 4: Run Database Setup

1. In Supabase dashboard, click "SQL Editor" in sidebar
2. Click "New query"
3. Open the file `supabase-schema.sql` in your project
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click "Run" or press Cmd/Ctrl + Enter
7. You should see "Success. No rows returned"

### Step 5: Configure Your App

1. In your project folder, find the file `.env.local`
2. Open it in any text editor
3. Replace these lines with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Save the file

### Step 6: Restart Your App

```bash
# Stop the app (Ctrl+C in terminal)
# Then restart:
npm run dev
```

## ✅ You're Done!

Your app now has:
- ✅ Cloud database
- ✅ User authentication
- ✅ Multi-device sync
- ✅ Automatic backups

## Testing Authentication

1. Go to your app: `http://localhost:3000`
2. You should see a login/signup option
3. Create an account with your email
4. Check your email for verification link
5. Click the link to verify
6. You're logged in!

## Migration from localStorage (Optional)

If you've been using the app locally and want to keep your data:

1. Go to `/export` page in your app
2. Click "Download JSON Backup"
3. Your data is now backed up as a JSON file
4. After logging in with Supabase, you can import this data

## Troubleshooting

### "Auth session missing!"
- Make sure you added both URL and anon key correctly
- Restart your development server
- Clear browser cache and try again

### "Database error"
- Make sure you ran the SQL schema in Supabase
- Check the SQL editor for any error messages
- Verify your database is active (not paused)

### "Can't connect to Supabase"
- Check your internet connection
- Verify the Project URL is correct (include https://)
- Make sure there are no extra spaces in .env.local

## Advanced: Service Role Key

For admin operations (optional), you can also add:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Find this in Supabase Dashboard > Settings > API > service_role key

⚠️ **WARNING**: Never commit or share your service role key!

## Need Help?

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **LifeHub GitHub Issues**: Report bugs or ask questions
- **Community**: Join our Discord for real-time help

---

**Remember**: Your app works great without Supabase! Only add it when you need cloud sync and multi-device support.






