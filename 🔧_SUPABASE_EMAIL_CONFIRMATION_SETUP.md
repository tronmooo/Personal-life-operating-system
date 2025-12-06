# 🔧 Supabase Email Confirmation Setup Guide

## ⚠️ Issue
Your Supabase email confirmation is not working. This is a common issue that requires configuration in your Supabase dashboard.

---

## ✅ Solution: Configure Supabase Email Settings

### Step 1: Go to Supabase Dashboard

1. **Open:** https://supabase.com/dashboard
2. **Select your project:** `god` (or whatever your project name is)

---

### Step 2: Configure Email Templates

**Navigate to:**
`Authentication` → `Email Templates`

#### For Email Confirmation:

1. **Find:** "Confirm signup" template
2. **Edit the template:**

**Default template:**
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

**Make sure the URL is correct:**
```html
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

3. **Save the template**

---

### Step 3: Configure Site URL & Redirect URLs

**Navigate to:**
`Authentication` → `URL Configuration`

#### Set These URLs:

1. **Site URL:** 
   ```
   http://localhost:3000
   ```
   (For production, use your actual domain like `https://yourdomain.com`)

2. **Redirect URLs (Add both):**
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

3. **Click:** "Save"

---

### Step 4: Enable Email Confirmations

**Navigate to:**
`Authentication` → `Providers` → `Email`

**Make sure:**
- ✅ **Enable email provider:** Turned ON
- ✅ **Confirm email:** Turned ON
- ✅ **Secure email change:** Turned ON (optional but recommended)

**Click:** "Save"

---

### Step 5: Configure SMTP (Optional but Recommended)

By default, Supabase uses their internal email service which has rate limits. For production, use your own SMTP.

**Navigate to:**
`Settings` → `Auth` → `SMTP Settings`

**If you want to use Gmail:**

1. **SMTP Host:** `smtp.gmail.com`
2. **SMTP Port:** `587`
3. **SMTP User:** `your-email@gmail.com`
4. **SMTP Password:** Your Gmail App Password ([Get one here](https://myaccount.google.com/apppasswords))
5. **Sender Email:** `your-email@gmail.com`
6. **Sender Name:** `Your App Name`

**Click:** "Save"

---

## 🧪 Test Email Confirmation

### Step 1: Sign Up
1. Go to: `http://localhost:3000/auth/signup`
2. Enter email and password
3. Click "Sign Up"

### Step 2: Check Email
- Open your email inbox
- Look for: "Confirm your signup" email from Supabase
- Click the confirmation link

### Step 3: Verify Success
- You should be redirected back to your app
- Your user should now be confirmed in Supabase

---

## 🔍 Troubleshooting

### Email Not Received?

**1. Check Spam Folder**
- Supabase emails often go to spam
- Mark as "Not Spam" if found

**2. Check Supabase Email Logs**
- Navigate to: `Authentication` → `Logs`
- Look for email sending errors

**3. Rate Limits**
- Supabase free tier: 3 emails per hour
- Solution: Set up custom SMTP (see Step 5 above)

**4. Email Provider Blocked**
- Some providers (like Gmail) block Supabase
- Solution: Use custom SMTP with your own email

---

### Confirmation Link Not Working?

**1. Check Site URL**
- Make sure Site URL matches your app URL exactly
- No trailing slash: ✅ `http://localhost:3000`
- With trailing slash: ❌ `http://localhost:3000/`

**2. Check Redirect URLs**
- Must include: `http://localhost:3000/**`
- This allows all routes to redirect

**3. Check Browser Console**
- Open DevTools → Console
- Look for error messages after clicking confirmation link

---

### Still Having Issues?

**Check User Status in Supabase:**

1. **Navigate to:** `Authentication` → `Users`
2. **Find your test user**
3. **Check status:**
   - ✅ Should show "Confirmed" after clicking email link
   - ❌ If shows "Unconfirmed", the email confirmation didn't work

**Manual Confirmation (for testing):**
- Click on the user in Supabase dashboard
- You can manually confirm the email there

---

## 🚀 Alternative: Disable Email Confirmation (For Development Only)

If you want to skip email confirmation during development:

**Navigate to:**
`Authentication` → `Providers` → `Email`

**Disable:**
- ❌ **Confirm email:** Turn OFF

**⚠️ WARNING:** Only do this for local development. Never disable this in production!

---

## 📊 Current Configuration Status

Based on your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://jphpxqqilrjyypztkswc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

**Your Supabase Project:**
- ✅ URL is configured
- ✅ Anon key is configured
- ⏹ Email confirmation needs to be set up in dashboard

---

## 🎯 Quick Checklist

Before testing again, make sure:

- [ ] Site URL is set to `http://localhost:3000`
- [ ] Redirect URLs include `http://localhost:3000/**`
- [ ] Email provider is enabled
- [ ] Email confirmation is enabled
- [ ] Email template has correct `{{ .ConfirmationURL }}`
- [ ] No rate limit issues (check logs)
- [ ] Email is not in spam folder

---

## 🎉 Once Configured

After you configure these settings in Supabase:

1. **Restart your app:** `http://localhost:3000`
2. **Try signing up:** `/auth/signup`
3. **Check your email**
4. **Click confirmation link**
5. **You should be logged in!**

---

## 📝 For Production Deployment

When you deploy to production:

1. **Update Site URL:** Change to your actual domain
2. **Update Redirect URLs:** Add production URLs
3. **Set up custom SMTP:** For reliable email delivery
4. **Test thoroughly:** Sign up with real email addresses

---

## 💡 Need More Help?

**Supabase Docs:**
https://supabase.com/docs/guides/auth/auth-smtp

**Auth Troubleshooting:**
https://supabase.com/docs/guides/auth/debugging/troubleshooting

**Support:**
https://supabase.com/support























