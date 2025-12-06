# ⚡ QUICK SETUP CHECKLIST

## 🎯 Get LifeHub Running in 15 Minutes

Follow this checklist step-by-step. Check off each item as you complete it.

---

## ✅ STEP 1: Create Supabase Account (10 minutes)

### Create Account
- [ ] Go to [https://supabase.com](https://supabase.com)
- [ ] Click "Start your project" → Sign up
- [ ] Verify email address

### Create Project
- [ ] Click "New Project"
- [ ] Name it: `lifehub-db` (or your choice)
- [ ] Create a strong password (save it!)
- [ ] Choose a region close to you
- [ ] Click "Create new project"
- [ ] ⏱️ Wait 2 minutes for provisioning

### Get API Credentials
- [ ] Click `Settings` in left sidebar
- [ ] Click `API` under Settings
- [ ] Copy **Project URL** → Save somewhere
- [ ] Copy **anon public** key → Save somewhere  
- [ ] Copy **service_role** key → Save somewhere

### Setup Database
- [ ] Click `SQL Editor` in left sidebar
- [ ] Click "+ New query"
- [ ] Open `supabase-schema.sql` file from your project
- [ ] Copy ALL contents (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click "RUN" button (bottom right)
- [ ] ✅ Should see success message

### Setup Storage
- [ ] Click `Storage` in left sidebar
- [ ] Click "Create a new bucket"
- [ ] Name it: `documents`
- [ ] Make it "Public" bucket
- [ ] Click "Create bucket"

**✅ Supabase Done!**

---

## ✅ STEP 2: Get OpenAI API Key (5 minutes)

### Create OpenAI Account
- [ ] Go to [https://platform.openai.com](https://platform.openai.com)
- [ ] Click "Sign up"
- [ ] Create account with email
- [ ] Verify email

### Get API Key
- [ ] Log in to OpenAI
- [ ] Click your profile icon (top right)
- [ ] Click "View API keys"
- [ ] Click "+ Create new secret key"
- [ ] Name it: `lifehub`
- [ ] **IMMEDIATELY COPY THE KEY** (you only see it once!)
- [ ] Paste somewhere safe (starts with `sk-`)

### Add Payment Method (Required)
- [ ] Click "Settings" → "Billing"
- [ ] Add payment method (credit card)
- [ ] Set usage limit: $10/month (recommended to start)
- [ ] This prevents surprise charges

**✅ OpenAI Done!**

---

## ✅ STEP 3: Configure Your Project (2 minutes)

### Create Environment File
- [ ] Open your project in code editor
- [ ] Find file `env.example` in root
- [ ] Copy it: `cp env.example .env.local`
- [ ] Open `.env.local` in editor

### Add Supabase Credentials
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

- [ ] Replace `YOUR-PROJECT.supabase.co` with your actual URL
- [ ] Replace `eyJ...your-anon-key` with your actual anon key
- [ ] Replace `eyJ...your-service-role-key` with your actual service role key

### Add OpenAI Key
```bash
OPENAI_API_KEY=sk-...your-actual-openai-key
```

- [ ] Replace `sk-...your-actual-openai-key` with your actual key

### Save File
- [ ] Save `.env.local`
- [ ] Close file

**✅ Configuration Done!**

---

## ✅ STEP 4: Install & Run (3 minutes)

### Install Dependencies
Open terminal in project folder:

```bash
npm install
```

- [ ] Run command above
- [ ] ⏱️ Wait for installation to complete (~2 minutes)

### Start Development Server
```bash
npm run dev
```

- [ ] Run command above
- [ ] Wait for "Ready" message
- [ ] Should show: `Local: http://localhost:3000`

**✅ Installation Done!**

---

## ✅ STEP 5: Test Everything (5 minutes)

### Open App
- [ ] Open browser
- [ ] Go to: `http://localhost:3000`
- [ ] App should load

### Create Account
- [ ] Click "Sign Up" (or similar)
- [ ] Enter email and password
- [ ] Click "Create Account"
- [ ] ✅ Should log you in

### Test Basic Features
- [ ] Click on a domain (like "Financial" or "Health")
- [ ] Click "Add New" or similar
- [ ] Enter some test data
- [ ] Click "Save"
- [ ] ✅ Data should save

### Test AI Features
- [ ] Go to `/ai-assistant` page
- [ ] Type a question like "What should I focus on?"
- [ ] Click "Send"
- [ ] ✅ AI should respond (may take 5-10 seconds)

### Test Document Upload
- [ ] Go to any domain
- [ ] Click "Documents" tab
- [ ] Click "Upload" or "Add Document"
- [ ] Select an image or PDF
- [ ] Click "Upload"
- [ ] ✅ File should upload

### Test Analytics
- [ ] Go to `/analytics` page
- [ ] ✅ Should see charts and graphs

### Test AI Concierge
- [ ] Go to `/concierge` page
- [ ] Type: "Schedule my car oil change"
- [ ] Click "Delegate Task"
- [ ] ✅ Should see task breakdown (demo mode)

**✅ Everything Works!**

---

## 🎉 YOU'RE DONE!

Your LifeHub app is now fully functional!

---

## 🆘 Troubleshooting

### "Can't connect to Supabase"
✅ **Fix:**
1. Check your `.env.local` file
2. Make sure Supabase URL has `https://`
3. Verify keys are correct (no extra spaces)
4. Restart dev server: `Ctrl+C` then `npm run dev`

### "OpenAI API error"
✅ **Fix:**
1. Check key starts with `sk-`
2. Verify you added payment method to OpenAI
3. Check usage limits aren't maxed out
4. Wait a few minutes and try again

### "Authentication not working"
✅ **Fix:**
1. Check Supabase project isn't paused
2. Verify email confirmation was sent
3. Check spam folder for confirmation email
4. Try signing up with different email

### "Data not saving"
✅ **Fix:**
1. Open browser console (F12)
2. Look for red errors
3. Most likely: Supabase credentials wrong
4. Double-check `.env.local` file

### "Page won't load"
✅ **Fix:**
1. Make sure dev server is running
2. Check terminal for errors
3. Try different browser
4. Clear browser cache

---

## 📚 Next Steps

Now that everything works:

### **Learn the App**
- [ ] Read `README.md` for feature overview
- [ ] Check `🎊_START_HERE.md` for guided tour
- [ ] Review `EVERYTHING_YOU_GOT.md` for full feature list

### **Add More Features** (Optional)
- [ ] Read `WHAT_YOU_NEED_FROM_ME.md` for optional integrations
- [ ] Add Twilio for real phone calls
- [ ] Add SendGrid for email sending
- [ ] Add Plaid for bank connections

### **Customize**
- [ ] Add your own domains
- [ ] Set up reminders
- [ ] Upload important documents
- [ ] Track your goals

### **Share**
- [ ] Deploy to production (Vercel recommended)
- [ ] Share with family members
- [ ] Set up data export/backup routine

---

## 💡 Pro Tips

1. **Back up your `.env.local` file** - Save it somewhere secure
2. **Set OpenAI spending limits** - Prevents surprise charges
3. **Use strong passwords** - Your data is valuable
4. **Export data regularly** - Use the export feature
5. **Start small** - Add a little data each day
6. **Use AI assistant** - It gets better as you add more data

---

## 📊 Cost Expectations

### **Your Current Setup:**
- Supabase: **FREE** (up to limits)
- OpenAI: **~$5-10/month** (typical personal use)
- **Total: $5-10/month**

### **Usage Limits (Free Tier):**
- Supabase Database: 500MB
- Supabase Storage: 1GB
- Supabase Active Users: 50,000/month
- OpenAI: Pay per request (~$0.002 each)

### **When You'll Need to Upgrade:**
- Database > 500MB: Upgrade Supabase to Pro ($25/mo)
- Heavy AI usage: Just pay for what you use
- Need more storage: Upgrade Supabase

---

## ✅ Final Checklist

Before you start using it for real:

- [ ] All tests passed above
- [ ] `.env.local` file backed up safely
- [ ] OpenAI spending limit set
- [ ] Understand the costs
- [ ] Bookmarked `http://localhost:3000`
- [ ] Read at least the `README.md`

---

## 🎊 Congratulations!

You now have a **fully functional, AI-powered life management system**!

**What you can do now:**
- ✅ Track all aspects of your life
- ✅ Get AI-powered insights
- ✅ Upload and organize documents
- ✅ Set reminders and goals
- ✅ Analyze your data
- ✅ Automate tasks with AI Concierge
- ✅ Access from any device
- ✅ Never lose your data

**Start tracking your life today! 🚀**

---

**Questions?** Check:
- `BACKEND_SETUP_COMPLETE.md` - Detailed setup guide
- `WHAT_YOU_NEED_FROM_ME.md` - Requirements explanation
- `README.md` - Feature overview

**Need help?** Review the troubleshooting section above or check the documentation files.

**Ready to level up?** Check `WHAT_YOU_NEED_FROM_ME.md` for optional integrations like Twilio, Plaid, and more.

---

**Built with ❤️ | Powered by AI 🤖 | Designed for Real Life 🚀**

