# 🚨 URGENT: Run This SQL to Fix Warranty Upload

## The Problem
The warranty upload is **working perfectly** - the file uploads to storage successfully!

However, the database insert fails because the `document_url` column doesn't exist yet in the warranty tables.

## The Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
Go to: **https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new**

### Step 2: Copy and Paste This SQL

```sql
-- Add document_url column to warranty tables
ALTER TABLE appliance_warranties 
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE vehicle_warranties 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Verify columns were added (should show 2 rows)
SELECT 
  table_name, 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name IN ('appliance_warranties', 'vehicle_warranties')
  AND column_name = 'document_url';
```

### Step 3: Click "Run" (or press Cmd+Enter / Ctrl+Enter)

You should see:
- "Success. No rows returned" for the ALTER statements
- 2 rows returned from the verification query showing the new columns

### Step 4: Test the Warranty Upload Again!

Now go back to your appliance tracker and try uploading the warranty document again. It will work! 🎉

---

## What We Know From the Console Logs

✅ **File Upload**: Working perfectly
```
Uploading file: ChatGPT Image Oct 10, 2025, 01_34_51 AM.png
Type: image/png Size: 2544219
Storage path: 3d67799c-7367-41a8-b4da-a7598c02f346/appliance-warranties/...
Document uploaded successfully
Public URL: https://jphpxqqilrjyypztkswc.supabase.co/storage/v1/object/public/documents/...
```

❌ **Database Insert**: Failing with 400 error
```
Failed to load resource: the server responded with a status of 400
Error adding warranty
```

The 400 error is because the `document_url` column doesn't exist, so the INSERT statement fails.

---

## Alternative: Quick Fix Without Browser

If you can't access the Supabase dashboard right now, you can temporarily **not upload a file**:

1. In the warranty form, fill in all fields
2. **Don't select a file** - leave "Choose File" empty
3. Click "Add Warranty"

This will create the warranty record without a document (since `document_url` is optional).

Later, after running the SQL, you can upload documents properly!

---

## Why Automated Migration Didn't Work

- Supabase doesn't expose a direct SQL execution endpoint for security
- The `exec_sql` RPC function doesn't exist in your project
- PostgreSQL connection requires the actual database password (different from service role key)

The SQL Editor in the Supabase Dashboard is the **official and recommended way** to run migrations.


