# 🎯 DO THESE 3 STEPS TO ENABLE GOOGLE DRIVE

## ✅ Step 1: Enable Google Drive API (2 minutes)

1. Go to: https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Select project: **lifehub-475301**
3. Click **"ENABLE"** button

## ✅ Step 2: Sign Out & Sign Back In (1 minute)

1. Go to http://localhost:3000
2. Click your profile picture → **Sign Out**
3. Click **"Sign in with Google"**
4. You'll see: **"LifeHub wants to access your Google Drive"**
5. Click **"Allow"**

## ✅ Step 3: Run Database Migration (1 minute)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Paste and run this migration:

```sql
-- Copy from: supabase/migrations/20250116_documents_table.sql
-- Or run it directly from the file
```

---

## 🧪 Test It!

```tsx
// In any component
import { DocumentUpload } from '@/components/ui/document-upload'

<DocumentUpload 
  domain="insurance" 
  enableOCR={true}
/>
```

Upload a document → Check your Google Drive → See "LifeHub" folder! 🎉

---

## 📚 Full Documentation

- **DRIVE_INTEGRATION_COMPLETE.md** - What was built
- **GOOGLE_DRIVE_SETUP.md** - Full features & API docs
- **ENABLE_DRIVE_API.md** - Google Console setup guide
- **drive-upload-example.tsx** - Code examples

---

**Server is running at:** http://localhost:3000

**Your next upload will go straight to Google Drive!** 🚀


