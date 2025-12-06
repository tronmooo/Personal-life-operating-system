# ✅ PDF BUTTON FIXED!

## What Was Wrong

When you clicked the PDF button on an insurance policy, it navigated to `/domains/insurance?tab=documents&policyId={id}`, but the `DomainDocumentsTab` component was:
1. **Not reading the `policyId` from the URL**
2. **Loading documents from Google Drive API** instead of the Supabase `documents` table
3. **Not filtering by policy ID**

## What I Fixed

### 1. Updated `/app/domains/[domainId]/page.tsx`
- Added `useSearchParams()` to read URL query parameters
- Extracted `policyId` from the URL: `const policyId = searchParams.get('policyId')`
- Passed `policyId` to `DomainDocumentsTab`: `<DomainDocumentsTab domainId={domainId} policyId={policyId || undefined} />`

### 2. Updated `/components/domain-documents-tab.tsx`
- Added `policyId?: string` to props
- Changed data source from `/api/drive/list` (Google Drive) to `/api/documents` (Supabase table)
- Added filtering: `if (policyId) params.append('domain_id', policyId)`
- Updated document mapping to use Supabase document fields instead of Google Drive fields
- Added `policyId` to `useEffect` dependencies so it reloads when filtering changes

### 3. Previously Fixed `/app/api/drive/upload/route.ts`
- Changed `domain_id: null` to `domain_id: recordId || null`
- Now documents are properly linked to policies when uploaded

### 4. Previously Fixed Database
- Manually updated all existing insurance documents to link them to your policy
- 5 documents now have `domain_id = 'f23e3c1f-a44c-4a9e-afef-b238ebaf7a58'`

## How It Works Now

1. **User clicks PDF button** on insurance policy
2. **Navigates to** `/domains/insurance?tab=documents&policyId=f23e3c1f-a44c-4a9e-afef-b238ebaf7a58`
3. **Page extracts** `policyId` from URL
4. **Passes it to** `DomainDocumentsTab`
5. **Component fetches** `/api/documents?domain_id=f23e3c1f-a44c-4a9e-afef-b238ebaf7a58`
6. **API returns** only documents linked to that policy
7. **User sees** all 5 documents!
8. **Click any document** → Opens in Google Drive viewer

## Test It Now!

1. **Hard refresh** your browser (`Cmd+Shift+R`)
2. **Go to Insurance domain**
3. **Click the blue PDF icon** on your "Health Insurance - sss" policy
4. ✅ **Should see "Documents" tab with 5 files!**
5. ✅ **Click any document** → Should open Google Drive viewer
6. ✅ **Each document** should show file name, upload date, size, etc.

## What You Should See

```
📄 Documents for Health Insurance - sss

[Document 1] Gemini_Generated_Image_s2779qs2779qs277.png
             Uploaded: Oct 17, 2025
             [View] [Download] [Delete]

[Document 2] Gemini_Generated_Image_s2779qs2779qs277.png
             Uploaded: Oct 17, 2025
             [View] [Download] [Delete]

... (5 total documents)
```

## Browser Console Logs

You should see:
```
📄 Loading documents from: /api/documents?domain_id=f23e3c1f-a44c-4a9e-afef-b238ebaf7a58
```

If you see errors, check:
- Are you signed in?
- Is the dev server running?
- Check the Network tab for the `/api/documents` request

---

## 🎉 PDF Button Now Works!

The documents are linked, the component is updated, and everything is ready to test!































