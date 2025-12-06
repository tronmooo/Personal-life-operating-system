# 🚀 Google Drive Integration - Quick Start

## ✅ Steps to Enable Google Drive Storage

### 1. Sign Out & Sign Back In

```
1. Go to http://localhost:3000
2. Click your profile → Sign Out
3. Sign in with Google again
4. ✅ NEW: You'll see "Google Drive" permission request
5. Click "Allow"
```

### 2. Run Database Migration

In Supabase Dashboard → SQL Editor:

```sql
-- Run this migration:
supabase/migrations/20250116_documents_table.sql
```

### 3. Test Upload

```tsx
<DocumentUpload 
  domain="insurance" 
  enableOCR={true}
/>
```

### 4. Check Google Drive

Open Google Drive → Look for "LifeHub" folder!

---

## 📁 Folder Structure

```
LifeHub/
├── Insurance/
├── Vehicles/
├── Health/
├── Home/
├── Pets/
└── ...
```

---

## 🎯 Features Now Available

✅ Automatic folder organization  
✅ OCR text extraction from images  
✅ Shareable links  
✅ View in Google Drive  
✅ Search across all documents  
✅ Unlimited storage (your Google Drive quota)  

**See GOOGLE_DRIVE_SETUP.md for full documentation!**
