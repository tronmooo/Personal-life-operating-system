# Next-Gen Document Manager

## Overview

The **Next-Gen Document Manager** is a comprehensive document management system with AI-powered automatic categorization, OCR text extraction, and intelligent domain routing.

## Features

### 1. **Multiple Upload Methods**

- **📸 Photo Capture**: Take a photo directly with your device camera
- **📄 File Upload**: Upload PDF, JPG, PNG, or WEBP files
- **✏️ Manual Entry**: Manually enter document information without uploading a file

### 2. **AI-Powered Smart Classification**

The system automatically:
- Extracts text using OCR (Google Cloud Vision)
- Classifies document type (insurance card, receipt, prescription, vehicle registration, bill, medical record)
- Suggests the correct domain to save to
- Extracts structured data based on document type

**Supported Document Types:**

| Document Type | Auto-Detected Fields | Suggested Domain |
|--------------|---------------------|------------------|
| 🏥 Insurance Card | Policy number, provider, coverage type, dates | Insurance |
| 🧾 Receipt | Vendor, amount, date, items, tax, category | Financial |
| 💊 Prescription | Medication, dosage, prescriber, pharmacy, dates | Health |
| 🚗 Vehicle Registration | Make, model, year, VIN, license plate, expiration | Vehicles |
| 📄 Bill/Invoice | Company, account number, amount, due date | Financial |
| 🏥 Medical Record | Provider, date, diagnosis, test results | Health |

### 3. **Domain-Specific Forms**

After AI classification, dynamic forms appear based on the detected domain:

**Insurance Domain:**
- Policy Number
- Provider
- Expiration Date
- Renewal Date
- Coverage Amount

**Financial Domain:**
- Amount
- Date
- Vendor/Merchant
- Category (Groceries, Dining, Gas, etc.)

**Health Domain:**
- Provider/Doctor
- Date
- Medication (if applicable)
- Dosage (if applicable)

**Vehicles Domain:**
- Make, Model, Year
- VIN
- License Plate
- Registration Expiration

### 4. **Document Preview & Confirmation**

Before saving, users can:
- Preview the uploaded document or captured photo
- Review extracted OCR text
- Edit or confirm AI-suggested fields
- Change the domain/category if needed
- Add additional notes

## Usage

### In Your Application

```tsx
import { NextGenDocumentManager } from '@/components/documents/next-gen-document-manager'

export default function MyPage() {
  const handleDocumentSaved = (document) => {
    console.log('Document saved:', document)
    // Handle saved document (e.g., redirect, refresh list)
  }

  return (
    <NextGenDocumentManager 
      onDocumentSaved={handleDocumentSaved}
      onCancel={() => router.back()}
    />
  )
}
```

### Standalone Page

Visit `/documents/new` to access the full document manager interface.

## API Integration

The document manager uses the following API endpoints:

### `/api/documents/smart-scan` (POST)
Processes uploaded documents with AI:
- Runs OCR to extract text
- Classifies document type
- Extracts structured data
- Returns suggestions

**Request:**
```typescript
FormData {
  file: File
}
```

**Response:**
```typescript
{
  text: string,
  documentType: string,
  confidence: number,
  suggestedDomain: Domain,
  suggestedAction: string,
  reasoning: string,
  extractedData: Record<string, any>,
  icon: string
}
```

### `/api/documents/upload` (POST)
Uploads document file to Supabase Storage and saves metadata:

**Request:**
```typescript
FormData {
  file: File,
  domain: string,
  metadata: JSON
}
```

**Response:**
```typescript
{
  data: {
    id: string,
    file_path: string,
    // ... other document fields
  }
}
```

## Architecture

### Processing Flow

```
1. User Selection
   ├─ Photo Capture → Camera API
   ├─ File Upload → File Input
   └─ Manual Entry → Skip to form

2. AI Processing (for uploads)
   ├─ OCR Text Extraction (Google Vision)
   ├─ Document Classification (OpenAI)
   └─ Structured Data Extraction (OpenAI)

3. Confirmation & Review
   ├─ Display AI suggestions
   ├─ Show domain-specific form
   └─ Allow user edits

4. Save Document
   ├─ Upload file to Supabase Storage
   ├─ Save metadata to documents table
   └─ Create domain_entry (if applicable)
```

### Component Structure

```
NextGenDocumentManager
├─ Upload Method Selection
│  ├─ Photo Capture (with camera controls)
│  ├─ File Upload (drag & drop or click)
│  └─ Manual Entry
│
├─ Processing Stage
│  ├─ Progress indicator
│  └─ Stage messages (scanning, classifying, extracting)
│
├─ Confirmation Stage
│  ├─ AI Suggestions Alert
│  ├─ Domain Selection
│  ├─ DomainSpecificFields Component
│  ├─ Document Preview
│  └─ OCR Text Preview
│
└─ Complete Stage
   └─ Success message
```

## Customization

### Adding New Document Types

To add support for a new document type:

1. **Update `lib/ai/document-classifier.ts`:**
   ```typescript
   export type DocumentType =
     | 'receipt'
     | 'insurance_card'
     // ... existing types
     | 'your_new_type'  // Add here
   ```

2. **Add classification logic** in the prompt

3. **Create extractor** in `lib/ai/document-extractor.ts`:
   ```typescript
   async extractYourNewTypeData(text: string): Promise<YourNewTypeData> {
     // Extraction logic
   }
   ```

4. **Add domain-specific fields** in `DomainSpecificFields` component

### Styling

The component uses shadcn/ui components and Tailwind CSS. Customize by:
- Modifying color schemes (purple, blue, green themes)
- Adjusting card layouts
- Changing button styles

## Performance Considerations

- **Camera Stream**: Properly cleaned up when component unmounts
- **OCR Processing**: May take 10-30 seconds for complex documents
- **File Size Limit**: 10MB max to ensure fast processing
- **Image Compression**: Camera captures use 80% JPEG quality

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Clear error messages
- Progress indicators for long-running operations

## Browser Compatibility

- **Camera API**: Requires HTTPS in production
- **File API**: Supported in all modern browsers
- **FormData**: Full support across browsers

## Future Enhancements

- [ ] Batch document upload
- [ ] Document templates for common types
- [ ] QR code/barcode scanning
- [ ] Multi-page PDF support
- [ ] Document tagging and search
- [ ] Version history
- [ ] Sharing and permissions

## Troubleshooting

### Camera Not Working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Try different browsers

### OCR Fails
- Ensure image is clear and well-lit
- Check document is not skewed
- Verify text is readable

### Upload Fails
- Check file size (< 10MB)
- Verify file type is supported
- Ensure network connection

## Credits

Built with:
- Next.js 14
- TypeScript
- Supabase
- Google Cloud Vision API
- OpenAI API
- shadcn/ui
- Tailwind CSS




















