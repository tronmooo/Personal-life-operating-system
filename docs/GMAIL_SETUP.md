# Gmail Integration Setup

## Issue: 500 Error "Request had insufficient authentication scopes"

This error occurs when the Supabase Google OAuth provider doesn't have Gmail scopes configured.

## Solution

### Step 1: Configure Supabase Google OAuth Scopes

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers
   
2. **Edit Google Provider**
   - Click on **Google** in the providers list
   
3. **Update Scopes**
   - Find the **"Scopes"** field
   - Ensure it contains these scopes (space-separated):
   ```
   https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify
   ```
   
4. **Save Changes**
   - Click **Save** at the bottom of the form

### Step 2: Re-authenticate Existing Users

**Important**: After updating the scopes, all existing users must re-authenticate to receive the new permissions.

**User Steps:**
1. Sign out of LifeHub
2. Sign back in with Google
3. You'll see a new consent screen asking for Gmail permissions
4. Click "Allow" to grant Gmail access

### Step 3: Verify Configuration

1. After signing back in, go to the dashboard
2. Find the **Smart Inbox** card
3. Click the **Sync Gmail** button
4. If configured correctly, you should see:
   - "✨ Found X new suggestions!" or
   - "📭 No new suggestions found"
   
5. If still getting errors, check the browser console for more details

## Required Google OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `openid` | Required for OAuth |
| `userinfo.email` | Get user email |
| `userinfo.profile` | Get user name and photo |
| `gmail.readonly` | Read emails from Gmail |
| `gmail.modify` | Add labels to emails (for marking as processed) |

## Troubleshooting

### Error: "Gmail scopes not granted"
- **Cause**: User authenticated before scopes were added
- **Fix**: Sign out and sign back in

### Error: "No provider token available"
- **Cause**: User signed in with email/password instead of Google
- **Fix**: Smart Inbox requires Google OAuth sign-in

### Error: "OpenAI API key not configured"
- **Cause**: `OPENAI_API_KEY` not set in environment variables
- **Fix**: Add the key to `.env.local`:
  ```bash
  OPENAI_API_KEY=sk-...
  ```

## How It Works

1. **Authentication**: User signs in with Google OAuth through Supabase
2. **Token Storage**: Supabase stores the Google access token in `session.provider_token`
3. **Gmail API**: The app uses this token to call Gmail API via googleapis
4. **AI Classification**: OpenAI classifies emails into categories (bills, appointments, etc.)
5. **Storage**: Suggestions are stored in `processed_emails` table
6. **User Action**: User approves/rejects suggestions in Smart Inbox card

## Related Files

- `/components/dashboard/smart-inbox-card.tsx` - Frontend component
- `/app/api/gmail/sync/route.ts` - Sync endpoint
- `/lib/integrations/gmail-parser.ts` - Gmail API wrapper
- `/lib/ai/email-classifier.ts` - AI classification logic

## Support

If you continue to have issues:
1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify environment variables are set
4. Ensure you have `OPENAI_API_KEY` configured






























