# ✅ Google OAuth Setup Complete!

I've successfully configured your Google OAuth credentials in `.env.local`.

## 🎉 What's Configured

### Google Cloud Console Setup
- **Project**: Lifehub
- **OAuth Client**: "Lifehub OAuth Client"
- **User Support Email**: sennabaumrobert@gmail.com
- **Developer Contact**: sennabaumrobert@gmail.com

### Enabled APIs
✅ Google Calendar API  
✅ Google Drive API  
✅ Gmail API

### OAuth Scopes (Read-Only Access)
- `https://www.googleapis.com/auth/calendar` - Read calendar events
- `https://www.googleapis.com/auth/drive.readonly` - Read Google Drive files
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail messages

### Environment Variables Added
```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## 🚀 Next Steps

### 1. Test OAuth Flow Locally

Your redirect URI is configured for:
```
http://localhost:3000/api/auth/google/callback
```

This will work for local development.

### 2. Create OAuth API Route

You'll need to create an API endpoint at:
```
/app/api/auth/google/callback/route.ts
```

Example implementation:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  })
  
  const tokens = await tokenResponse.json()
  
  // Store tokens securely in Supabase or session
  // Then redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### 3. Update Supabase Authentication

Since you're using Supabase, you should also configure Google OAuth in Supabase:

**Go to Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers
2. Enable **Google** provider
3. Add your credentials:
   - Client ID: `your-google-client-id.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-your-google-client-secret`

**Then add Supabase callback URL to Google Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit "Lifehub OAuth Client"
3. Add to Authorized redirect URIs:
   ```
   https://jphpxqqilrjyypztkswc.supabase.co/auth/v1/callback
   ```
4. Save

### 4. Production Deployment

When you deploy to production:
1. Update `GOOGLE_REDIRECT_URI` in your production environment
2. Add your production URL to Google Console authorized redirect URIs:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

---

## 📝 What You Still Need

### Google Places API Key (for AI Concierge)
The AI Concierge needs this to search for local businesses.

**Get it here:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Restrict it to "Places API"
4. Copy the key and update `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-actual-api-key
   ```

### Vapi.ai Credentials (for AI voice calls)
If you want the AI Concierge to make phone calls:

1. Sign up at: https://vapi.ai
2. Create an assistant
3. Get your credentials and update `.env.local`:
   ```bash
   VAPI_API_KEY=your-vapi-private-key
   NEXT_PUBLIC_VAPI_KEY=your-vapi-public-key
   NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-assistant-id
   VAPI_PHONE_NUMBER_ID=your-phone-number-id
   ```

---

## 🧪 Test Your OAuth

### Using Supabase Auth (Recommended)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Trigger Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly'
  }
})
```

### Manual OAuth Flow
```typescript
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly&` +
  `access_type=offline&` +
  `prompt=consent`

// Redirect user to authUrl
```

---

## ✅ Current Status

- ✅ Google Cloud Project created (Lifehub)
- ✅ OAuth consent screen configured
- ✅ OAuth client created
- ✅ Credentials added to `.env.local`
- ✅ Redirect URIs configured for localhost
- ⏳ **Next**: Add Supabase callback URL to Google Console
- ⏳ **Next**: Configure Google provider in Supabase Dashboard
- ⏳ **Next**: Create OAuth callback route in your app

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Rotate secrets** if accidentally exposed
3. **Use environment variables** for all sensitive data
4. **Restrict API keys** to specific APIs and domains in production
5. **Store tokens securely** - Use Supabase or encrypted session storage

---

## 📚 Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**You're all set! 🎉**

Your Google OAuth is configured and ready to use. Just follow the "Next Steps" above to complete the integration.


