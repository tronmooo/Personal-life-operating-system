# ⚡ Voice Commands - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Add OpenAI API Key

**Required for AI-powered categorization**

1. Open your `.env.local` file (in the project root)
2. Add this line:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file

**Don't have an API key?**
- Go to: https://platform.openai.com/api-keys
- Sign up/log in
- Click "Create new secret key"
- Copy the key and paste it in `.env.local`

**Cost:** ~$0.0001 per voice command (extremely cheap!)

---

### Step 2: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

The server needs to restart to load the new environment variable.

---

### Step 3: Try It Out!

1. **Click the purple microphone button** (top navigation bar)
2. **Allow microphone access** when prompted
3. **Speak a command** clearly:
   - "My weight is 175 pounds"
   - "Log 10,000 steps"
   - "Add task call dentist"
4. **Click the microphone again** to stop
5. **Review the command** in the popup
6. **Click Confirm** to save

---

## ✅ Quick Test Commands

Try these to verify everything works:

### Health
```
"My weight is 170 pounds"
"Log 8000 steps"
"Add 16 ounces of water"
```

### Financial
```
"Spent 50 dollars on groceries"
"What's my net worth?"
```

### Tasks
```
"Add task call dentist"
"Remind me to buy milk"
```

### Multiple at Once
```
"Log 10000 steps and add 12 ounces of water"
```

---

## 🔍 Verify It Worked

After speaking a command:

1. **Check the domain page** - Go to the Health, Financial, or Tasks page
2. **Look for your data** - Should appear in the list
3. **Check Supabase** (optional) - Go to Table Editor → domains table

---

## 🐛 Quick Troubleshooting

### Not working at all?
- ✅ Added OpenAI API key to `.env.local`?
- ✅ Restarted dev server?
- ✅ Allowed microphone permissions?
- ✅ Using Chrome, Edge, or Safari?

### Transcript not showing?
- Speak louder and more clearly
- Check microphone is working (test in other apps)
- Look for errors in browser console (F12)

### Commands not saving?
- Check browser console for errors
- Verify Supabase is connected
- Data will save to localStorage as fallback

---

## 💡 Pro Tips

1. **Speak naturally** - "I weigh 175 pounds" works just as well as "weight 175"
2. **Use numbers** - Say "10000" or "ten thousand" both work
3. **Chain commands** - Use "and" to combine: "Log steps and add water"
4. **Check interim** - Watch the transcript as you speak to make sure it's hearing you

---

## 📚 Full Documentation

For complete details, examples, and advanced features, see:
**`🎤_VOICE_COMMANDS_AI_POWERED_COMPLETE.md`**

---

## 🎉 That's It!

You're ready to control your entire app with your voice!

**Next:** Try different domains and commands. The AI understands natural language, so experiment!

---

**Quick Reference Card:**

| Domain | Example Command |
|--------|----------------|
| Health | "My weight is 175 pounds" |
| Fitness | "Did 30 minutes of cardio" |
| Nutrition | "Ate lunch 450 calories" |
| Financial | "Spent 50 dollars on groceries" |
| Tasks | "Add task call dentist" |
| Vehicles | "Schedule car service tomorrow" |
| Pets | "Vet appointment for cat next week" |
| Mindfulness | "Meditated for 15 minutes" |

---

**🎤 Start talking to your app now!**




