# Migration: NextAuth → Supabase Auth with Google

## What's Changing

### Before (NextAuth)
- Users NOT in Supabase auth.users table
- Custom NextAuth JWT sessions
- User ID = email address (text)

### After (Supabase Auth)
- Users IN Supabase auth.users table ✅
- Supabase manages sessions
- User ID = UUID from auth.users
- Still sign in with Google
- Still have Google Calendar & Drive access

## Steps

1. Enable Google OAuth in Supabase Dashboard
2. Remove NextAuth code
3. Add Supabase Auth client components
4. Update API routes to use Supabase auth
5. Update database user_id from TEXT back to UUID
6. Test sign-in with Google

## Google OAuth Configuration

**Redirect URI**: `https://jphpxqqilrjyypztkswc.supabase.co/auth/v1/callback`

You'll also need to configure this in Supabase Dashboard:
- Client ID: your-google-client-id.apps.googleusercontent.com
- Client Secret: GOCSPX-your-google-client-secret
- Scopes: email, profile, calendar, drive.file, drive.appdata

## Files to Update

### Remove
- `/app/api/auth/[...nextauth]/route.ts` (NextAuth)
- `/app/api/debug/session/route.ts` (diagnostic)

### Update
- `/lib/providers/data-provider.tsx` - use Supabase auth
- `/app/api/domains/route.ts` - use Supabase session
- `/app/api/documents/route.ts` - use Supabase session  
- `/app/api/drive/upload/route.ts` - use Supabase session
- `/components/auth/google-signin-button.tsx` - use Supabase signInWithOAuth

### Database
- Change `domains.user_id` back to UUID
- Change `documents.user_id` back to UUID































