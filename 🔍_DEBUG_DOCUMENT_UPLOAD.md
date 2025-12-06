# 🔍 Debug Document Upload Issue

## Problem
Document is scanning successfully but the image isn't showing - displays "📷 No scanned document" instead of "View Scanned Document" dropdown.

## Root Cause
The document file isn't being uploaded to Supabase Storage, so `documentUrl` is empty.

---

## 🧪 Test Steps

### 1. Scan a New Document

1. **Refresh your browser** (Cmd+Shift+R)
2. **Click the orange Upload button** in the toolbar
3. **Upload the same insurance card image**
4. **Click "Save to Insurance"**

### 2. Check Browser Console

Open the browser console (F12 or Cmd+Option+I) and look for these logs:

#### ✅ **If File Upload Works:**
```
📄 Document scanned: {...}
💾 Saving document to Supabase...
📁 File provided: { name: "...", size: 12345, type: "image/png" }
⬆️ Uploading file to Supabase Storage...
📂 Storage path: 713c0e33-31aa-4bb8-bf27-476b5eba942e/1234567890-filename.png
✅ File uploaded successfully: 713c0e33-31aa-4bb8-bf27-476b5eba942e/1234567890-filename.png
🔗 Public URL: https://abc...supabase.co/storage/v1/object/public/documents/...
📎 File upload result: https://...
✅ Document saved to Supabase!
```

#### ❌ **If Storage Bucket Missing:**
```
📄 Document scanned: {...}
💾 Saving document to Supabase...
📁 File provided: { name: "...", size: 12345, type: "image/png" }
⬆️ Uploading file to Supabase Storage...
📂 Storage path: 713c0e33-31aa-4bb8-bf27-476b5eba942e/1234567890-filename.png
❌ Storage upload error: { ... }
🚨 Storage bucket "documents" not found!
👉 Create the bucket in Supabase Dashboard:
   1. Go to Supabase Dashboard → Storage
   2. Click "New Bucket"
   3. Name: "documents"
   4. Set as Public bucket
📎 File upload result: EMPTY - File not uploaded
✅ Document saved to Supabase! (but without file URL)
```

#### ⚠️ **If File Not Passed:**
```
📄 Document scanned: {...}
💾 Saving document to Supabase...
⚠️ No file provided in document object
```

---

## 🛠️ Fix: Create Supabase Storage Bucket

If you see the "🚨 Storage bucket not found" error, you need to create the bucket:

### Steps:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Navigate to your project

2. **Go to Storage**
   - Click "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - **Name**: `documents` (must be exactly this)
   - **Public bucket**: Toggle ON (so images can be viewed)
   - Click "Create bucket"

4. **Set Bucket Policies (if needed)**
   - Click on the "documents" bucket
   - Go to "Policies" tab
   - Add these policies:
   
   **SELECT (Read) Policy:**
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'documents' );
   ```
   
   **INSERT (Upload) Policy:**
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK ( bucket_id = 'documents' );
   ```
   
   **DELETE (Remove) Policy:**
   ```sql
   CREATE POLICY "Users can delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING ( bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1] );
   ```

5. **Try Uploading Again**
   - Go back to your app
   - Upload the document again
   - Check console logs - should see ✅ File uploaded successfully

---

## 🔍 Other Possible Issues

### Issue 1: File Not Being Passed

**Console shows**: `⚠️ No file provided in document object`

**Cause**: The `SmartScanner` isn't passing the file to the save handler

**Fix**: Check `components/ui/smart-scanner.tsx` line 154-159:
```typescript
onSave({
  ...scanResult,
  file: selectedFile,  // ← Make sure this exists
  previewUrl,
})
```

### Issue 2: Upload Fails Silently

**Console shows**: `❌ File upload failed` with error details

**Possible causes**:
1. Network error
2. File too large (check Supabase limits)
3. Invalid file type
4. Supabase API keys not configured
5. User not authenticated

**Check**:
- `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- User is logged in (check Supabase Auth)
- File size is under limits (usually 50MB for free tier)

### Issue 3: URL Generated But Image Doesn't Load

**Console shows**: Public URL is generated, but image fails to load

**Cause**: Bucket permissions or file doesn't actually exist

**Fix**:
1. Go to Supabase Storage → documents bucket
2. Check if files are there
3. Try accessing the public URL directly in browser
4. Check bucket policies (see Step 4 above)

---

## ✅ Expected Result

After creating the bucket and uploading a new document, you should see:

1. **In Console**:
   ```
   ✅ File uploaded successfully: ...
   🔗 Public URL: https://...
   📎 File upload result: https://...
   ```

2. **In Insurance Page**:
   - "View Scanned Document" appears (instead of "📷 No scanned document")
   - Clicking it shows the uploaded image

3. **Policy Load Log**:
   ```
   📄 Policy loaded: {
     id: "...",
     provider: "GLOBAL HEALTH PLANS",
     expiryDate: "2026-01-01",
     hasDocumentPhoto: true,  ← Should be true!
     documentUrl: "https://...supabase.co/storage/...",
     itemKeys: [...]
   }
   ```

---

## 📸 Try It Now!

1. **Refresh browser** (Cmd+Shift+R)
2. **Open console** (F12)
3. **Upload document** again
4. **Read the console logs** - they'll tell you exactly what's happening!
5. **Take a screenshot** of the console and share if you need help

The enhanced logging will show exactly where the issue is! 🎯






























