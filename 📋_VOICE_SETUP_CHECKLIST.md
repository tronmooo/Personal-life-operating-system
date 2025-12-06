# 📋 Voice Commands - Setup Checklist

## ✅ Complete These Steps to Get Voice Commands Working

### Step 1: Get OpenAI API Key
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Sign up or log in
- [ ] Click "Create new secret key"
- [ ] Copy the key (starts with `sk-...`)

### Step 2: Add to Environment File
- [ ] Open `.env.local` in your project root
- [ ] Add this line: `OPENAI_API_KEY=sk-your-key-here`
- [ ] Paste your actual key
- [ ] Save the file

### Step 3: Restart Dev Server
- [ ] Stop the server (Ctrl+C in terminal)
- [ ] Run `npm run dev` again
- [ ] Wait for server to start

### Step 4: Test Voice Commands
- [ ] Open the app in Chrome, Edge, or Safari
- [ ] Click the purple microphone button (top nav)
- [ ] Allow microphone access when prompted
- [ ] Say: "My weight is 175 pounds"
- [ ] Click microphone again to stop
- [ ] Review the parsed command
- [ ] Click "Confirm"
- [ ] Check if it saved to the Health domain

### Step 5: Verify It Works
- [ ] Go to Health domain page
- [ ] Look for your voice entry
- [ ] Try another command: "Log 8000 steps"
- [ ] Try financial: "Spent 20 dollars on coffee"
- [ ] Try tasks: "Add task call dentist"

### Step 6: Check Database (Optional)
- [ ] Go to Supabase dashboard
- [ ] Open Table Editor
- [ ] Click on `domains` table
- [ ] Look for entries with `source: "voice"`

---

## 🎯 Quick Test Commands

Once set up, try these:

```
✅ Health:
   "My weight is 175 pounds"
   "Log 10000 steps"
   "Add 16 ounces of water"

✅ Fitness:
   "Did 30 minutes of cardio"
   "Ran 5 miles"

✅ Financial:
   "Spent 50 dollars on groceries"
   
✅ Tasks:
   "Add task call dentist"
   "Remind me to buy milk"

✅ Multiple:
   "Log 8000 steps and add 12 ounces of water"
```

---

## 🐛 If Something's Not Working

### Can't hear me?
- [ ] Check browser microphone permissions
- [ ] Test microphone in another app
- [ ] Speak louder and clearer

### No transcript showing?
- [ ] Check browser console (F12) for errors
- [ ] Try refreshing the page
- [ ] Make sure you're using Chrome/Edge/Safari

### "OpenAI API key not configured"?
- [ ] Double-check `.env.local` has the key
- [ ] Make sure you restarted the dev server
- [ ] Verify the key starts with `sk-`

### Commands not saving?
- [ ] Check browser console for errors
- [ ] Verify Supabase connection
- [ ] Check if you're logged in

---

## 📚 More Help

- **Quick Start:** `⚡_VOICE_COMMANDS_QUICK_START.md`
- **Full Guide:** `🎤_VOICE_COMMANDS_AI_POWERED_COMPLETE.md`
- **Summary:** `✨_VOICE_FIX_SUMMARY.md`

---

## ✨ You're Done When...

- ✅ Voice button shows and responds
- ✅ Transcript displays as you speak
- ✅ Commands parse correctly
- ✅ Confirmation popup shows
- ✅ Data saves to correct domain
- ✅ Voice feedback confirms success

---

**🎉 Once complete, you can control your entire app with voice!**

**Estimated Setup Time:** 5 minutes

**Cost:** ~$0.0001 per voice command (basically free!)

---

### Need Help?

1. Check browser console (F12) for error messages
2. Read the troubleshooting sections in the guides
3. Verify all checklist items are complete
4. Make sure you're using a supported browser (Chrome/Edge/Safari)

---

**🎤 Ready to start? Complete the checklist above! ⬆️**




