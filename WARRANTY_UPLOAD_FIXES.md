# Warranty Upload Fixes - October 29, 2025

## Issues Fixed

### 1. ✅ Storage Bucket Configuration
- **Problem**: The `documents` storage bucket wasn't properly configured to accept file uploads
- **Solution**: 
  - Created migration `20251029130000_create_documents_storage_bucket.sql` to set up bucket and RLS policies
  - Updated bucket to allow all file types (including .webp, .pdf, images)
  - Set max file size to 50MB
  - Configured public read access with user-scoped write permissions

### 2. ✅ Better Error Handling
- **Problem**: Upload errors weren't showing detailed information
- **Solution**:
  - Added comprehensive console logging for debugging
  - Enhanced error messages to show actual error details
  - Added authentication check before upload
  - Set `warrantyUploadError` state to display errors in UI

### 3. ✅ Database Schema
- **Problem**: `appliance_warranties` table was missing `document_url` column
- **Solution**:
  - Created migration `20251029130000_add_document_url_to_warranties.sql`
  - Added `document_url` TEXT column to both `appliance_warranties` and `vehicle_warranties` tables

### 4. ✅ File Upload Flow
- **Problem**: Upload wasn't properly integrated with Supabase storage
- **Solution**:
  - Upload flow now:
    1. Checks user authentication
    2. Sanitizes filename
    3. Creates user-scoped path: `{userId}/appliance-warranties/{timestamp}-{filename}`
    4. Uploads to Supabase storage
    5. Gets public URL
    6. Saves URL to database with warranty record

## Scripts Created

### `scripts/create-storage-bucket.ts`
Creates the storage bucket and applies RLS policies. Already executed successfully.

### `scripts/update-storage-bucket.ts`
Updates bucket configuration to allow all file types. Already executed successfully.

## Testing Steps

1. **Navigate to Appliances Domain**
   - Go to `/domains/appliances`
   - Select an appliance or create a new one

2. **Add Warranty**
   - Click "Add Warranty" button
   - Fill in:
     - Warranty Name (e.g., "Extended Warranty")
     - Provider (e.g., "Samsung")
     - Expiry Date
     - Coverage Details (optional)
   - Click "Choose File" and select a PDF or image (including .webp)

3. **Expected Behavior**
   - File should upload without errors
   - Console should show:
     ```
     Uploading file: [filename] Type: [type] Size: [size]
     Storage path: [userId]/appliance-warranties/[timestamp]-[filename]
     Document uploaded successfully: [data]
     Public URL: [url]
     ```
   - Alert: "Warranty added successfully!"
   - Warranty should appear in the list with document link

4. **Verify in Database**
   ```sql
   SELECT * FROM appliance_warranties ORDER BY created_at DESC LIMIT 5;
   ```
   - Should see `document_url` populated

5. **Verify in Storage**
   - Go to Supabase Dashboard → Storage → documents
   - Should see uploaded files under `{userId}/appliance-warranties/`

## Common Issues & Solutions

### "You must be signed in to upload documents"
- **Cause**: User not authenticated
- **Solution**: Sign in to the application first

### "Upload failed: [error message]"
- **Check**:
  1. Supabase storage bucket exists (run `scripts/create-storage-bucket.ts`)
  2. RLS policies are applied (check Supabase Dashboard)
  3. User has valid session (check browser console for auth status)
  4. File size < 50MB

### File uploads but `document_url` is null
- **Cause**: Database migration not applied
- **Solution**: 
  ```sql
  ALTER TABLE appliance_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;
  ALTER TABLE vehicle_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;
  ```

## Files Modified

1. `components/domain-profiles/appliance-tracker-autotrack.tsx`
   - Added warranty file upload functionality
   - Enhanced error handling and logging
   - Integrated with Supabase storage

2. `supabase/migrations/20251029130000_create_documents_storage_bucket.sql`
   - Storage bucket creation and RLS policies

3. `supabase/migrations/20251029130000_add_document_url_to_warranties.sql`
   - Added `document_url` columns to warranty tables

## Next Steps

If the upload still fails after these fixes:

1. **Check Console Output**
   - Open browser DevTools (F12)
   - Look for specific error messages in console
   - Share the full error message for further debugging

2. **Verify Supabase Configuration**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user)
   
   const { data: buckets } = await supabase.storage.listBuckets()
   console.log('Available buckets:', buckets)
   ```

3. **Test Direct Upload**
   - Use test page at `/test-drive-upload` if it exists
   - Or create a minimal test component to isolate the issue

## Storage Configuration Details

**Bucket**: `documents`
**Privacy**: Public (read-only for public, read/write for authenticated users in their folder)
**Path Structure**: `{userId}/{category}/{timestamp}-{filename}`
**File Size Limit**: 50MB
**Allowed Types**: All (null restriction)

**RLS Policies**:
- Users can upload to their own folder
- Users can read their own documents
- Public can read all documents (bucket is public)
- Users can update/delete their own documents


