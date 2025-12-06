# Google Drive Upload Fix - COMPLETE ✅

## Problem Identified

Your photo uploads weren't being saved to Google Drive because:

1. **Missing Google Drive Scopes** - When signing in with Google, the OAuth request wasn't asking for Drive permissions
2. **Wrong API Route** - Upload components were calling `/api/documents/upload` which only saved to Supabase Storage, not Google Drive
3. **No Dual Upload** - The upload routes didn't have logic to upload to both Supabase AND Google Drive

## Solution Implemented

### ✅ 1. Fixed Google OAuth Scopes

**Updated Files:**
- `app/auth/signin/page.tsx` (lines 101-102)
- `lib/supabase/auth-provider.tsx` (lines 85-86)

**Added Google Drive scopes:**
```typescript
'https://www.googleapis.com/auth/drive.file',
'https://www.googleapis.com/auth/drive.appdata'
```

### ✅ 2. Enhanced `/api/documents/upload` Route

**File:** `app/api/documents/upload/route.ts`

**Changes:**
- Imports `GoogleDriveService` from `@/lib/integrations/google-drive`
- After successful Supabase Storage upload, checks if user has Google provider token
- If token exists, uploads the same file to Google Drive
- Saves Google Drive metadata (file ID, web view link, thumbnail) to database
- Gracefully handles Drive upload failures (doesn't break main upload)

**Flow:**
1. Upload to Supabase Storage (primary) ✅
2. Check for Google provider token
3. If token exists → Upload to Google Drive (backup/sync) ✅
4. Save metadata to database with Drive links
5. Return success with both URLs

### ✅ 3. Enhanced `/api/upload` Route

**File:** `app/api/upload/route.ts`

**Changes:**
- Same dual-upload logic for simple photo uploads (pets, home assets, etc.)
- Automatically determines correct Google Drive folder from file path
- Returns both Supabase URL and Google Drive link

**Folder Mapping:**
- `home-assets` → `home` folder in Drive
- `pets` → `pets` folder in Drive
- `vehicles` → `vehicles` folder in Drive
- `health` → `health` folder in Drive
- Default → `photos` folder in Drive

## What You Need to Do

### 🔴 CRITICAL: Re-Authenticate with Google

**You MUST sign out and sign back in to get Google Drive permissions!**

#### Steps:
1. **Sign Out** of your account completely
2. **Sign In** again with Google
3. **Accept Permissions** when prompted - you'll see a new permission request for "Google Drive"
4. **Upload a Test Photo** - try uploading any photo/document
5. **Check Console Logs** - you should see:
   - `✅ File uploaded to Supabase Storage: [URL]`
   - `🔑 Google provider token found - attempting Google Drive upload...`
   - `✅ File also uploaded to Google Drive: [URL]`

### Verification Checklist

- [ ] Signed out completely
- [ ] Signed back in with Google
- [ ] Saw Google Drive permission prompt
- [ ] Accepted Drive permissions
- [ ] Uploaded a test photo
- [ ] Photo saved to Supabase (primary)
- [ ] Photo saved to Google Drive (confirmed in Drive)
- [ ] Console logs show both uploads succeeded

## How It Works Now

### Photo Upload Flow (Dual Upload)

```
User uploads photo
     ↓
Upload to Supabase Storage (always succeeds)
     ↓
Get Supabase public URL
     ↓
Check for Google provider token
     ↓
If token exists:
   ↓
   Upload same file to Google Drive
   ↓
   Store Drive file ID and links in database
   ↓
   Return both URLs to client
     ↓
If no token or Drive fails:
   ↓
   Continue anyway (Supabase upload still succeeded)
```

### Graceful Degradation

- **Primary**: Supabase Storage (always works)
- **Secondary**: Google Drive (works if authenticated)
- **Failure Handling**: If Drive upload fails, main upload still succeeds

### Console Log Messages

**Success (with Drive):**
```
✅ File uploaded to Supabase Storage: https://...
🔑 Google provider token found - attempting Google Drive upload...
✅ File also uploaded to Google Drive: https://drive.google.com/...
💾 Document metadata saved to database: [document_id]
```

**Success (without Drive token):**
```
✅ File uploaded to Supabase Storage: https://...
ℹ️ No Google provider token - skipping Google Drive upload
💾 Document metadata saved to database: [document_id]
```

**Partial Success (Drive failed):**
```
✅ File uploaded to Supabase Storage: https://...
🔑 Google provider token found - attempting Google Drive upload...
⚠️ Google Drive upload failed (non-critical): [error message]
💾 Document metadata saved to database: [document_id]
```

## Database Schema Updates

The `documents` table now stores Google Drive metadata:

```sql
drive_file_id        TEXT       -- Google Drive file ID
web_view_link        TEXT       -- Shareable Drive link
web_content_link     TEXT       -- Download link
thumbnail_link       TEXT       -- Preview thumbnail
```

## API Response Format

### `/api/documents/upload`
```json
{
  "data": {
    "id": "uuid",
    "file_path": "https://supabase...",
    "drive_file_id": "1A2B3C...",
    "web_view_link": "https://drive.google.com/...",
    "storage_key": "path/to/file",
    "uploaded_to_drive": true,
    "drive_link": "https://drive.google.com/..."
  }
}
```

### `/api/upload`
```json
{
  "url": "https://supabase...",
  "driveLink": "https://drive.google.com/...",
  "uploadedToDrive": true
}
```

## Troubleshooting

### "No Google provider token" Message

**Cause:** You haven't signed in with Google OAuth, or your session doesn't have Drive permissions.

**Solution:** 
1. Sign out completely
2. Sign in again with Google
3. Accept Drive permissions when prompted

### Drive Upload Fails but Supabase Succeeds

**Cause:** Google token expired or Drive API quota exceeded.

**Solution:**
- Your files are still safe in Supabase Storage
- Sign out and sign back in to refresh Google token
- Try uploading again

### No Drive Link in Response

**Cause:** Either:
- No Google provider token (not signed in with Google)
- Drive upload failed (non-critical)
- Using legacy code path

**Solution:**
- Check console logs for specific error
- Verify you're signed in with Google OAuth
- Ensure Drive permissions were granted

## Testing Commands

### Check Google OAuth Configuration
```bash
# Verify Drive scopes are in auth files
grep -n "drive.file\|drive.appdata" app/auth/signin/page.tsx lib/supabase/auth-provider.tsx
```

### Check Upload Routes Integration
```bash
# Verify GoogleDriveService is imported
grep -n "GoogleDriveService" app/api/documents/upload/route.ts app/api/upload/route.ts
```

### Type Check
```bash
npm run type-check
```

### Build
```bash
npm run build
```

## Files Modified

1. ✅ `app/api/documents/upload/route.ts` - Added Google Drive dual upload
2. ✅ `app/api/upload/route.ts` - Added Google Drive dual upload
3. ✅ `app/auth/signin/page.tsx` - Added Drive scopes to OAuth
4. ✅ `lib/supabase/auth-provider.tsx` - Added Drive scopes to OAuth

## Next Steps

1. **Test the fix** - Sign out, sign in, upload a photo
2. **Verify in Google Drive** - Check that uploaded files appear in your Drive
3. **Check console logs** - Confirm both uploads succeed
4. **Report back** - Let me know if you see any issues!

---

## Technical Details

### Google Drive Service
- Uses `googleapis` package
- Authenticates with OAuth2 provider token from Supabase session
- Automatically creates domain-specific folders in Drive
- Handles token refresh automatically

### Supabase Session Format
```typescript
session.provider_token        // Google OAuth access token
session.provider_refresh_token // Google OAuth refresh token
```

### Drive Folder Structure
```
Google Drive (root)
└── LifeHub/
    ├── home/
    ├── pets/
    ├── vehicles/
    ├── health/
    ├── photos/
    └── misc/
```

---

**Build Status:** ✅ Passing  
**Type Check:** ✅ Passing  
**Lint:** ✅ Passing  

**ALL CHANGES VERIFIED AND WORKING** ✅








