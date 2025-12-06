# Smart Upload Dialog - Integration Guide

## Overview

The `SmartUploadDialog` component provides a **unified, intelligent document upload experience** across the entire application. It features:

- 📸 **Camera capture** - Take photos directly
- 📁 **File upload** - PDF, images (JPG, PNG, WEBP)
- ✍️ **Manual entry** - Enter details manually
- 🤖 **Enhanced AI extraction** - Extracts 20-30+ fields with confidence scores
- 🎯 **Smart categorization** - Auto-suggests domains
- 📊 **Dynamic review forms** - Adapts to extracted data
- ✅ **Confidence scoring** - Per-field confidence levels

---

## Quick Start

### Basic Usage

```tsx
import { SmartUploadDialog } from '@/components/documents/smart-upload-dialog'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

function MyComponent() {
  return (
    <SmartUploadDialog
      domain="insurance"
      trigger={
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      }
      onComplete={(document) => {
        console.log('Document uploaded:', document)
        // Refresh your data
      }}
    />
  )
}
```

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `domain` | `Domain` | Yes | - | Target domain for the document |
| `trigger` | `ReactNode` | Yes | - | Element that opens the dialog (usually a button) |
| `onComplete` | `(document: any) => void` | Yes | - | Callback when document is successfully saved |
| `onCancel` | `() => void` | No | - | Callback when user cancels upload |

---

## Supported Domains

All 21 LifeHub domains are supported:

```typescript
type Domain = 
  | 'financial' | 'health' | 'insurance' | 'home' | 'vehicles'
  | 'appliances' | 'pets' | 'education' | 'relationships' | 'digital'
  | 'mindfulness' | 'fitness' | 'nutrition' | 'skills' | 'hobbies'
  | 'subscriptions' | 'legal' | 'career' | 'donations' | 'travel'
  | 'miscellaneous'
```

---

## Integration Examples

### 1. In a Domain Page

Replace existing upload buttons with SmartUploadDialog:

```tsx
// Before
<Button onClick={() => setUploadDialogOpen(true)}>
  <Upload /> Upload Document
</Button>

<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
  <DocumentUpload ... />
</Dialog>

// After
<SmartUploadDialog
  domain="insurance"
  trigger={<Button><Upload /> Upload Document</Button>}
  onComplete={(doc) => refreshDocuments()}
/>
```

### 2. In Navigation Bar

```tsx
import { SmartUploadDialog } from '@/components/documents/smart-upload-dialog'

<SmartUploadDialog
  domain="miscellaneous"
  trigger={
    <Button
      variant="ghost"
      size="icon"
      title="Upload Document"
    >
      <Upload className="h-5 w-5" />
    </Button>
  }
  onComplete={(document) => {
    console.log('✅ Document uploaded:', document)
    window.location.reload()
  }}
/>
```

### 3. With Custom Trigger

Any element can be the trigger:

```tsx
<SmartUploadDialog
  domain="health"
  trigger={
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500">
      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-600">Click to upload or drag & drop</p>
    </div>
  }
  onComplete={handleDocumentUploaded}
/>
```

### 4. In a Table or List

```tsx
{items.map((item) => (
  <TableRow key={item.id}>
    <TableCell>{item.name}</TableCell>
    <TableCell>
      <SmartUploadDialog
        domain="vehicles"
        trigger={
          <Button variant="outline" size="sm">
            <Upload className="h-3 w-3 mr-1" />
            Add Doc
          </Button>
        }
        onComplete={(doc) => linkDocumentToItem(item.id, doc)}
      />
    </TableCell>
  </TableRow>
))}
```

### 5. In a Card or Panel

```tsx
<Card>
  <CardHeader>
    <CardTitle>Upload Insurance Documents</CardTitle>
    <CardDescription>
      AI will automatically extract policy details
    </CardDescription>
  </CardHeader>
  <CardContent>
    <SmartUploadDialog
      domain="insurance"
      trigger={
        <Button size="lg" className="w-full">
          <Camera className="h-5 w-5 mr-2" />
          Take Photo or Upload
        </Button>
      }
      onComplete={(doc) => addToInsuranceList(doc)}
    />
  </CardContent>
</Card>
```

---

## Document Object Structure

The `onComplete` callback receives a document object with this structure:

```typescript
{
  id: string              // Document ID
  name: string            // File name
  type: string            // MIME type
  size: number            // File size in bytes
  url: string             // Supabase storage URL
  uploadedAt: string      // ISO timestamp
  domain: Domain          // Suggested domain
  ocrText: string | null  // Extracted text
  ocrConfidence: number   // OCR confidence (0-1)
  fields: {               // Extracted fields
    [key: string]: {
      value: any          // Field value
      confidence: number  // Field confidence (0-1)
      type: string        // Field type (date, number, string, etc.)
    }
  }
  documentTitle: string   // AI-generated title
  summary: string         // AI-generated summary
  documentType: string    // Classification (e.g., "Insurance Card")
}
```

---

## AI Extraction Capabilities

### Supported Document Types

The AI can classify and extract data from:

| Document Type | Fields Extracted |
|--------------|------------------|
| **Insurance Card** | 30+ fields: Policy #, Member ID, Group #, Provider, Dates, Coverage, Deductible, Copay, etc. |
| **Receipt** | 20+ fields: Vendor, Date, Total, Tax, Items, Payment method, Transaction #, etc. |
| **Prescription** | 20+ fields: Medication, Dosage, Prescriber, Pharmacy, Dates, Rx #, etc. |
| **Vehicle Registration** | 25+ fields: VIN, License plate, Make, Model, Year, Owner, Fees, Dates, etc. |
| **Bill/Invoice** | 20+ fields: Company, Account #, Amounts, Due date, Usage, Payment methods, etc. |
| **Medical Record** | 25+ fields: Provider, Patient, Visit details, Vitals, Diagnosis, Treatment, etc. |
| **Bank Statement** | Account #, Period, Transactions, Balances, etc. |
| **Tax Document** | Form type, Tax year, Amounts, SSN, etc. |
| **Contract** | Parties, Dates, Terms, Amounts, etc. |

### Field Confidence Levels

Extracted fields are categorized by confidence:

- **🟢 High Confidence (≥90%)** - Ready to use, auto-filled
- **🟡 Medium Confidence (70-89%)** - Recommended for review
- **🔴 Low Confidence (<70%)** - Flagged for manual verification

---

## User Flow

```
1. User clicks trigger button
   ↓
2. Dialog opens with 3 options:
   - 📸 Take Photo (camera capture)
   - 📁 Upload File (file picker)
   - ✍️ Manual Entry (skip AI)
   ↓
3. If photo/file selected:
   - Upload (20%)
   - OCR Scanning (30%)
   - AI Classification (50%)
   - Data Extraction (70%)
   - Review (100%)
   ↓
4. Review screen shows:
   - Document title & summary
   - High confidence fields (expanded)
   - Medium confidence fields (collapsible)
   - Low confidence fields (highlighted)
   ↓
5. User can:
   - Review and edit any field
   - Toggle edit mode
   - Expand/collapse sections
   - Save or cancel
   ↓
6. On save:
   - Upload to Supabase Storage
   - Save metadata to database
   - Trigger onComplete callback
```

---

## API Integration

The dialog uses the enhanced smart-scan API:

```typescript
// Frontend (automatic)
fetch('/api/documents/smart-scan?enhanced=true', {
  method: 'POST',
  body: formData
})

// Response
{
  text: string              // OCR text
  documentType: string      // Classification
  confidence: number        // Classification confidence
  suggestedDomain: Domain   // Suggested domain
  extractedData: {          // Basic extracted data
    [key: string]: any
  },
  enhancedData: {           // Enhanced data (with confidence)
    fields: {
      [key: string]: {
        value: any
        confidence: number
        type: string
      }
    },
    documentTitle: string
    summary: string
  }
}
```

---

## Best Practices

### ✅ Do

1. **Use SmartUploadDialog everywhere** - Replaces all old upload dialogs
2. **Refresh data after upload** - Call your data refresh function in `onComplete`
3. **Provide context** - Set the correct `domain` for better AI suggestions
4. **Show loading states** - The dialog handles this internally
5. **Handle errors gracefully** - The dialog shows errors to users

### ❌ Don't

1. **Don't use old upload components** - Replace with SmartUploadDialog
2. **Don't build custom upload flows** - Use this unified component
3. **Don't bypass the review step** - Users should verify AI-extracted data
4. **Don't ignore the confidence scores** - Use them to guide user attention
5. **Don't skip error handling** - Always provide an `onComplete` callback

---

## Migration Guide

### Replacing DocumentUpload

```tsx
// Old
<DocumentUpload 
  domain={domainId}
  enableOCR={true}
  label="Upload Document"
  onUploadComplete={() => refreshDocuments()}
/>

// New
<SmartUploadDialog
  domain={domainId as Domain}
  trigger={
    <Button>
      <Upload className="h-4 w-4 mr-2" />
      Upload Document
    </Button>
  }
  onComplete={(doc) => {
    console.log('Uploaded:', doc)
    refreshDocuments()
  }}
/>
```

### Replacing SmartScanner

```tsx
// Old
<SmartScanner
  open={isOpen}
  onOpenChange={setIsOpen}
  onSave={handleSave}
/>
<Button onClick={() => setIsOpen(true)}>Upload</Button>

// New
<SmartUploadDialog
  domain="miscellaneous"
  trigger={<Button>Upload</Button>}
  onComplete={handleSave}
/>
```

### Replacing Custom Upload Dialogs

```tsx
// Old
const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

<Button onClick={() => setUploadDialogOpen(true)}>Upload</Button>

<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
  <DialogContent>
    {/* Custom upload UI */}
  </DialogContent>
</Dialog>

// New
<SmartUploadDialog
  domain="insurance"
  trigger={<Button>Upload</Button>}
  onComplete={(doc) => console.log('Done:', doc)}
/>
```

---

## Troubleshooting

### Issue: Dialog doesn't open

**Cause:** Trigger element not clickable  
**Solution:** Ensure trigger is a button or clickable element

```tsx
// ❌ Bad
<SmartUploadDialog trigger={<div>Upload</div>} ... />

// ✅ Good
<SmartUploadDialog trigger={<Button>Upload</Button>} ... />
```

### Issue: No fields extracted

**Cause:** Image quality too low or document type not supported  
**Solution:** Check OCR text quality, improve image lighting/resolution

### Issue: Wrong domain suggested

**Cause:** Document classification ambiguous  
**Solution:** Users can change domain in review screen

### Issue: Low confidence scores

**Cause:** Poor image quality, handwritten text, complex layouts  
**Solution:** Users can manually edit fields in review screen

---

## Advanced Usage

### Custom Trigger Styling

```tsx
<SmartUploadDialog
  domain="health"
  trigger={
    <Button
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      size="lg"
    >
      <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
      Upload with AI Magic
    </Button>
  }
  onComplete={handleUpload}
/>
```

### With Loading State

```tsx
const [isUploading, setIsUploading] = useState(false)

<SmartUploadDialog
  domain="financial"
  trigger={
    <Button disabled={isUploading}>
      {isUploading ? (
        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
      ) : (
        <><Upload className="h-4 w-4 mr-2" /> Upload</>
      )}
    </Button>
  }
  onComplete={(doc) => {
    setIsUploading(false)
    handleUpload(doc)
  }}
/>
```

### With Success Toast

```tsx
import { toast } from 'sonner'

<SmartUploadDialog
  domain="insurance"
  trigger={<Button>Upload</Button>}
  onComplete={(doc) => {
    toast.success(
      `✅ ${doc.documentTitle} uploaded successfully!`,
      {
        description: `${Object.keys(doc.fields).length} fields extracted`,
        duration: 5000
      }
    )
    refreshData()
  }}
/>
```

---

## Testing

### Manual Testing Checklist

- [ ] Click trigger opens dialog
- [ ] Camera capture works on mobile
- [ ] File upload accepts PDF/images
- [ ] File validation works (size, type)
- [ ] OCR extracts text correctly
- [ ] AI classifies document type
- [ ] Extracted fields appear in review
- [ ] Confidence scores are visible
- [ ] Edit mode allows field editing
- [ ] Save uploads to Supabase
- [ ] onComplete callback fires
- [ ] Dialog closes after save
- [ ] Cancel button works
- [ ] Error messages display

### Sample Test Data

Test with these document types:
- Insurance card (health, auto, home)
- Receipt (grocery, restaurant, gas)
- Prescription label
- Vehicle registration
- Utility bill
- Medical record
- Bank statement

---

## Performance

- **Average processing time:** 15-30 seconds
- **OCR:** ~5-10 seconds (Google Cloud Vision)
- **AI Classification:** ~2-5 seconds (OpenAI GPT-4)
- **Data Extraction:** ~5-10 seconds (OpenAI GPT-4)
- **Enhanced extraction:** ~10-15 seconds (comprehensive fields)

**Optimization tips:**
- Images under 5MB process faster
- Clear, high-contrast images improve accuracy
- PDF files may take longer than images
- Enhanced mode (`?enhanced=true`) is now default

---

## FAQs

**Q: Can I upload multiple documents at once?**  
A: Not currently. Upload one document at a time.

**Q: What's the maximum file size?**  
A: 10MB per document.

**Q: Can I customize the extracted fields?**  
A: Yes! Users can edit any field in the review screen. Developers can also customize the extraction prompt in `lib/ai/enhanced-document-extractor.ts`.

**Q: Does it work offline?**  
A: No, requires internet for OCR and AI processing.

**Q: Can I use it for non-English documents?**  
A: Google Cloud Vision OCR supports 50+ languages. AI extraction works best with English but can handle other languages.

**Q: How accurate is the extraction?**  
A: Typically 85-95% for clear images. Confidence scores indicate reliability per field.

---

## Support

For issues or questions:
1. Check this guide
2. Review component source: `components/documents/smart-upload-dialog.tsx`
3. Check API: `app/api/documents/smart-scan/route.ts`
4. Open an issue in the repository

---

## Changelog

### v2.0.0 (Current) - Enhanced Extraction
- ✨ **20-30+ fields extracted** (up from 4-6)
- ✨ **Confidence scoring** per field
- ✨ **Dynamic review forms** adapt to extracted data
- ✨ **Category grouping** (High/Medium/Low confidence)
- ✨ **Enhanced API** with `?enhanced=true` mode
- 🚀 **Dialog-based** (replaces full-page flow)
- 🎯 **Universal integration** (works anywhere)

### v1.0.0 - Initial Release
- Basic OCR and classification
- 4-6 fields extracted
- Full-page upload flow
- Limited to specific pages

---

## Related Documentation

- [Enhanced Document Extractor](../ENHANCED_DOCUMENT_MANAGER.md)
- [Dynamic Review Form](../lib/ai/enhanced-document-extractor.ts)
- [Smart Scan API](../app/api/documents/smart-scan/route.ts)
- [Domain Configurations](../types/domains.ts)




















