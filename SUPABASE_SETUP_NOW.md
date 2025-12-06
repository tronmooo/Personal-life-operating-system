# 🎯 SUPABASE SETUP - DO THIS NOW!

## ⚠️ Your Dashboard Shows 0 Tables

I can see your Supabase dashboard is empty. Let's fix that in **3 minutes**!

---

## ✅ STEP 1: Run SQL Schema (2 minutes)

### Go to SQL Editor

1. **Open your Supabase Dashboard:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select project: `jphpxqqilrjyypztkswc` (god)

2. **Click "SQL Editor"** in left sidebar
   - It's the icon that looks like `</>`

3. **Click "+ New query"** button (top left)

### Copy and Run the SQL

4. **Open this file:** `RUN_THIS_SQL_IN_SUPABASE.sql`

5. **Copy EVERYTHING** in that file (Ctrl+A, Ctrl+C)

6. **Paste into SQL Editor**

7. **Click "RUN"** button (bottom right corner)

8. **Wait 5-10 seconds** for it to complete

### ✅ Verify Success

9. **Click "Table Editor"** in left sidebar

10. **You should now see 5 tables:**
    - ✅ domains
    - ✅ logs
    - ✅ pet_profiles
    - ✅ documents
    - ✅ reminders

11. **Your dashboard should show:**
    - Tables: **5** (instead of 0!)
    - Each table will show 0 rows (empty, which is correct)

---

## ✅ STEP 2: Create Storage Bucket (1 minute)

### Setup File Storage

1. **Click "Storage"** in left sidebar (folder icon)

2. **Click "Create a new bucket"**

3. **Fill in:**
   - Bucket name: `documents`
   - Public bucket: **Toggle ON** (or set to authenticated)
   - File size limit: Leave default (50MB)
   - Allowed MIME types: Leave default (all)

4. **Click "Create bucket"**

5. **You should now see:**
   - A bucket named `documents` in the list

---

## ✅ STEP 3: Verify Everything (30 seconds)

### Check Your Dashboard

Go back to **Home/Dashboard** and verify:

- **Tables:** Should show **5** (not 0!)
- **Storage:** Should show **1 bucket**
- **Auth:** Will show 0 users (until someone signs up)

---

## 🚀 STEP 4: Start Your App!

Now you're ready to run:

```bash
# Install dependencies (if you haven't)
npm install

# Start the development server
npm run dev
```

Open: **http://localhost:3000**

---

## 🎯 What You'll See in Supabase

### After Running SQL:

**Table Editor will show:**

```
📊 domains          - 0 rows
📊 logs             - 0 rows  
📊 pet_profiles     - 0 rows
📊 documents        - 0 rows
📊 reminders        - 0 rows
```

### After Using the App:

Once you sign up and add data, you'll see:

```
📊 domains          - Growing with your data
📊 logs             - Activity tracking
📊 pet_profiles     - Your pets
📊 documents        - Uploaded files
📊 reminders        - Your reminders
```

### After Uploading Files:

**Storage > documents bucket will show:**
```
📁 user-id-1/
   📄 document1.pdf
   📄 document2.jpg
📁 user-id-2/
   ...
```

---

## 🔍 What Each Table Does

| Table | Purpose | Example Data |
|-------|---------|--------------|
| **domains** | Stores all domain data (Financial, Health, etc.) | Your accounts, assets, etc. |
| **logs** | Activity tracking across all domains | "Added $500 to savings" |
| **pet_profiles** | Pet information | Max (Dog), Luna (Cat) |
| **documents** | File metadata & OCR data | Insurance cards, IDs |
| **reminders** | Notifications & reminders | "Pay rent on 1st" |

---

## 🔒 Security Features

Your database has:

✅ **Row Level Security (RLS)**
- Users can only see their own data
- Automatic isolation between users

✅ **Authentication Integration**
- Tied to Supabase Auth
- Secure by default

✅ **API Policies**
- Select, Insert, Update, Delete policies
- User-specific access only

---

## 📊 Database Schema Overview

```
auth.users (Supabase managed)
    ↓
    ├── domains (1:many)
    │   └── logs (1:many)
    │   └── documents (1:many)
    ├── pet_profiles (1:many)
    └── reminders (1:many)
```

---

## 🆘 Troubleshooting

### "Error running SQL"

**Fix:**
- Make sure you copied the ENTIRE file
- Check for any copy/paste issues
- Try running it again

### "Table already exists"

**Fix:**
- The SQL has `IF NOT EXISTS` clauses
- It's safe to run multiple times
- Some tables were already created

### "Permission denied"

**Fix:**
- Make sure you're logged into the correct project
- Check you're in the `god` project (jphpxqqilrjyypztkswc)

### "Still showing 0 tables"

**Fix:**
- Refresh the page
- Check SQL Editor for error messages
- Make sure you clicked "RUN" button

---

## ✅ Quick Checklist

Before starting the app:

- [ ] Ran SQL schema in SQL Editor
- [ ] See 5 tables in Table Editor
- [ ] Created `documents` storage bucket
- [ ] `.env.local` file has all keys
- [ ] Ran `npm install`

---

## 🎉 You're Ready!

Once you see **5 tables** in your Supabase dashboard:

```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. Sign up for an account
3. Add some test data
4. Go back to Supabase Table Editor
5. See your data appear in real-time! 🎊

---

## 📸 What Success Looks Like

### Before (What you see now):
```
Dashboard:
  Tables: 0
  Functions: 0
```

### After (What you should see):
```
Dashboard:
  Tables: 5
  
Table Editor:
  ✓ domains
  ✓ logs
  ✓ pet_profiles
  ✓ documents
  ✓ reminders
  
Storage:
  ✓ documents (bucket)
```

---

## 🚀 Next Steps After Setup

1. **Start the app:** `npm run dev`
2. **Create account:** Sign up at localhost:3000
3. **Add test data:** Try each domain
4. **Watch Supabase:** See data appear in Table Editor!
5. **Upload file:** Test document upload
6. **Check Storage:** See file in Storage bucket

---

## 💡 Pro Tips

- **Keep SQL Editor tab open** - Good for debugging
- **Watch Table Editor** - See changes in real-time
- **Check Authentication** - See users as they sign up
- **Monitor Storage** - Track file uploads
- **Use Logs** - SQL Editor shows query logs

---

**Let me know once you've run the SQL and see 5 tables! Then we'll test the app! 🚀**

