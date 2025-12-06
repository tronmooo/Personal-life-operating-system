# 📁 Google Drive Document Storage - Setup Guide

Your app now uses **Google Drive** instead of Supabase Storage for all document uploads! All documents are automatically organized into folders by domain.

---

## ✅ What's Already Done

1. ✅ **Google Drive API** enabled in your OAuth scopes
2. ✅ **Folder Structure** auto-created: `LifeHub/Insurance`, `LifeHub/Vehicles`, etc.
3. ✅ **OCR Integration** - Text extraction saved to Drive file metadata
4. ✅ **API Routes** for upload, list, delete, share
5. ✅ **React Hook** (`useGoogleDrive`) for easy component integration
6. ✅ **Updated DocumentUpload** component

---

## 🚀 How to Use

### 1. Sign Out & Sign Back In with Google

**IMPORTANT:** You need to re-authenticate to grant Google Drive permissions.

```bash
1. Go to http://localhost:3000
2. Click your profile picture → Sign Out
3. Sign in again with Google
4. You'll see NEW permissions request for Google Drive
5. Click "Allow"
```

### 2. Upload Documents

The `DocumentUpload` component now requires a `domain` prop:

```tsx
import { DocumentUpload } from '@/components/ui/document-upload'

<DocumentUpload
  domain="insurance" // Required: which folder to upload to
  recordId="policy-123" // Optional: link to specific record
  enableOCR={true} // Automatically extract text from images
  onUploadComplete={(fileId) => {
    console.log('Uploaded:', fileId)
  }}
/>
```

**Available domains:**
- `insurance`
- `vehicles`
- `health`
- `home`
- `pets`
- `collectibles`
- `relationships`
- `financial`
- `career`
- `misc`

### 3. Folder Structure

All documents are organized in your Google Drive like this:

```
📁 LifeHub/
  ├── 📁 Insurance/
  │   ├── policy-doc.pdf
  │   └── claim-receipt.jpg (with OCR text)
  ├── 📁 Vehicles/
  │   ├── registration.pdf
  │   └── service-receipt.jpg
  ├── 📁 Health/
  │   └── prescription.pdf
  ├── 📁 Home/
  ├── 📁 Pets/
  └── ...
```

---

## 🎯 Features

### **Auto-Organization**
- Files are automatically placed in the correct domain folder
- Folder structure is created on-demand
- All organized under a single "LifeHub" root folder

### **OCR Text Extraction**
- Images (JPG, PNG) are processed for text extraction
- Extracted text is saved to Google Drive file properties
- Searchable across all documents

### **Sharing**
- Click share icon to get a shareable link
- Link is automatically copied to clipboard
- Can also share with specific emails

### **View in Google Drive**
- Click external link icon to open file in Google Drive
- Full Google Drive features available (comments, versions, etc.)

### **Delete**
- Deletes from both Google Drive AND Supabase metadata
- Confirmation required

---

## 🛠️ API Routes

All routes require Google authentication (NextAuth session):

### Upload
```bash
POST /api/drive/upload
Body: FormData with 'file', 'domain', 'recordId', 'extractedText'
Returns: { success: true, file: DriveFile, metadata: {} }
```

### List Files
```bash
GET /api/drive/list?domain=insurance
Returns: { domain: string, files: DriveFile[], count: number }
```

### Delete
```bash
DELETE /api/drive/delete
Body: { fileId: string }
Returns: { success: true }
```

### Search
```bash
GET /api/drive/search?q=policy
Returns: { query: string, results: DriveFile[], count: number }
```

### Share
```bash
POST /api/drive/share
Body: { fileId: string, anyoneWithLink: true }
OR: { fileId: string, email: string, role: 'reader' | 'writer' }
Returns: { link: string } OR { success: true, sharedWith: email }
```

---

## 🔧 React Hook: `useGoogleDrive`

Easy-to-use hook for any component:

```tsx
import { useGoogleDrive } from '@/hooks/use-google-drive'

function MyComponent() {
  const { 
    files, 
    loading, 
    uploadFile, 
    deleteFile, 
    listFiles,
    createShareableLink,
    shareWithEmail,
    isAuthenticated 
  } = useGoogleDrive('insurance')

  // Upload file
  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, 'record-123', 'OCR text here')
    if (result.success) {
      console.log('Uploaded:', result.file)
    }
  }

  // List files on mount
  useEffect(() => {
    if (isAuthenticated) {
      listFiles()
    }
  }, [isAuthenticated])

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>
          {file.name}
          <button onClick={() => deleteFile(file.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

---

## 📊 Database Migration

Run this migration to create the `documents` table:

```bash
# In Supabase Dashboard > SQL Editor
supabase/migrations/20250116_documents_table.sql
```

This table stores metadata about Google Drive files:
- `drive_file_id` - Google Drive file ID
- `file_name`, `mime_type`, `file_size`
- `web_view_link` - Link to view in Drive
- `web_content_link` - Download link
- `extracted_text` - OCR text
- `domain` - Which domain folder
- `user_id` - Owner

---

## 🔐 Security

1. **Row Level Security (RLS)** enabled on `documents` table
2. Users can only see/edit their own documents
3. Google Drive permissions are per-user (via OAuth token)
4. Shareable links can be created for sharing with others

---

## 📝 Example: Update a Domain Component

Replace old Supabase Storage code with Google Drive:

### Before (Supabase Storage):
```tsx
const handleUpload = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(`insurance/${file.name}`, file)
}
```

### After (Google Drive):
```tsx
import { useGoogleDrive } from '@/hooks/use-google-drive'

function InsuranceComponent() {
  const { uploadFile } = useGoogleDrive('insurance')

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, policyId)
    if (result.success) {
      console.log('Uploaded to Google Drive!')
    }
  }

  return <DocumentUpload domain="insurance" />
}
```

---

## 🎉 Benefits

✅ **Unlimited Storage** - Use your Google Drive quota  
✅ **Auto-Organization** - Smart folder structure  
✅ **Google Integration** - Works with Google Docs, Sheets, etc.  
✅ **OCR Built-in** - Text extraction from images  
✅ **Sharing** - Easy link sharing  
✅ **Version History** - Google Drive's built-in versioning  
✅ **Mobile Access** - View docs in Google Drive mobile app  
✅ **Search** - Full-text search across all documents  

---

## 🐛 Troubleshooting

### "Unauthorized" error
- Sign out and sign back in with Google
- Make sure you granted Google Drive permissions

### Files not showing up
- Check `console.log` for API errors
- Verify you're signed in with Google
- Run migration to create `documents` table

### Upload fails
- Check file size (Google Drive has limits)
- Verify OAuth scopes include `drive.file`
- Check browser console for errors

---

## 🔄 Next Steps

1. **Sign out and sign back in** to grant Drive permissions
2. **Run the Supabase migration** to create documents table
3. **Test upload** in any domain
4. **View in Google Drive** - Check your "LifeHub" folder!

Your documents are now safely stored in Google Drive! 🎊
































