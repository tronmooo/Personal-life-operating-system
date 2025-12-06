# 📸 Universal Document Scanner - Complete Guide

## 🌟 Overview

The **Universal Document Scanner** is a powerful component that can be used **anywhere in your app** to upload or scan documents with automatic OCR text extraction and expiration date detection.

---

## ✨ Features

### 1. **Dual Input Methods**
- 📤 **Upload**: Select files from device
- 📸 **Camera**: Take photos to scan documents

### 2. **Smart OCR Processing**
- Automatically extracts all text from images
- Uses Tesseract.js for accurate recognition
- Shows progress during extraction
- Works completely client-side (no server needed)

### 3. **Expiration Date Detection**
Automatically finds dates in these formats:
- "Expires: MM/DD/YYYY"
- "Valid until: MM/DD/YYYY"
- "Renewal date: MM/DD/YYYY"
- "Due date: MM/DD/YYYY"
- "Exp. MM/DD/YY"

### 4. **30-Day Renewal Alerts**
- Creates alerts 30 days before expiration
- Critical alerts 7 days before
- Stored in critical-alerts system
- Visible throughout the app

### 5. **Document Management**
- Saves documents to localStorage
- Stores extracted text and metadata
- Tracks expiration dates
- Categorizes by domain

---

## 🚀 How to Use (User Perspective)

### Step 1: Open Scanner
Click any "Upload" or "Upload / Scan" button in the app

### Step 2: Choose Input Method

#### Option A: Upload File
1. Click "Upload File"
2. Select document (PDF, Image, Word, Excel)
3. Wait for OCR to extract text
4. Review extracted text and detected expiration date
5. Edit document name if needed
6. Click "Save Document"

#### Option B: Take Photo
1. Click "Take Photo"
2. Grant camera permission if asked
3. Point camera at document
4. Click "Capture Photo" when ready
5. Wait for OCR to extract text
6. Review and edit details
7. Click "Save Document"

### Step 3: Review Extracted Data
- **Extracted Text**: Shows all text found in document
- **Document Name**: Pre-filled or editable
- **Expiration Date**: Auto-detected or manually enter
- **Progress Bar**: Shows OCR extraction progress

### Step 4: Save
- Document saved to localStorage
- Expiration alerts created automatically
- Document appears in list immediately

---

## 💻 How to Implement (Developer Guide)

### Installation
Tesseract.js is already installed in the project!

### Basic Implementation

```tsx
import { DocumentUploadScanner } from '@/components/universal/document-upload-scanner'
import { useState } from 'react'

function MyComponent() {
  const [showScanner, setShowScanner] = useState(false)
  const [documents, setDocuments] = useState([])

  const handleDocumentSaved = (doc) => {
    setDocuments([doc, ...documents])
    console.log('Document saved:', doc)
  }

  return (
    <>
      <DocumentUploadScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onDocumentSaved={handleDocumentSaved}
        category="your-category"
        title="Upload Document"
        description="Upload or scan your document"
      />
      
      <button onClick={() => setShowScanner(true)}>
        Upload Document
      </button>
    </>
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | boolean | ✅ | Controls dialog visibility |
| `onOpenChange` | function | ✅ | Callback when dialog opens/closes |
| `onDocumentSaved` | function | ✅ | Callback when document is saved |
| `category` | string | ❌ | Document category (default: 'general') |
| `title` | string | ❌ | Dialog title |
| `description` | string | ❌ | Dialog description |

### Document Object Structure

```typescript
interface UploadedDocument {
  id: string                    // Unique identifier
  name: string                  // Document name
  file: File | null            // Original file object
  fileUrl: string | null       // Preview URL
  extractedText: string        // OCR extracted text
  expirationDate: Date | null  // Detected or manual expiration
  uploadDate: Date             // When document was uploaded
  category: string             // Document category
  metadata: {
    size?: number              // File size in bytes
    type?: string              // MIME type
    source: 'upload' | 'camera' // How it was created
  }
}
```

---

## 🎯 Use Cases By Domain

### 💰 Finance
```tsx
<DocumentUploadScanner
  category="financial"
  title="Upload Financial Document"
  description="Tax returns, bills, insurance, receipts"
/>
```
**Document Types:**
- Tax returns
- Bills and invoices
- Insurance policies
- Bank statements
- Receipts

### 🏥 Health
```tsx
<DocumentUploadScanner
  category="health"
  title="Upload Medical Document"
  description="Prescriptions, lab results, insurance cards"
/>
```
**Document Types:**
- Prescriptions (auto-detect refill dates)
- Lab results
- Insurance cards
- Medical records
- Vaccination records

### 🏠 Home
```tsx
<DocumentUploadScanner
  category="home"
  title="Upload Home Document"
  description="Warranties, manuals, receipts, maintenance records"
/>
```
**Document Types:**
- Appliance warranties
- Repair receipts
- Instruction manuals
- Maintenance contracts
- HOA documents

### 🚗 Vehicles
```tsx
<DocumentUploadScanner
  category="vehicle"
  title="Upload Vehicle Document"
  description="Registration, insurance, maintenance records"
/>
```
**Document Types:**
- Registration (expires!)
- Insurance (expires!)
- Inspection reports
- Maintenance records
- Repair receipts

### ⚖️ Legal
```tsx
<DocumentUploadScanner
  category="legal"
  title="Upload Legal Document"
  description="Contracts, licenses, certificates"
/>
```
**Document Types:**
- Driver's license (expires!)
- Passport (expires!)
- Contracts
- Certificates
- Legal notices

---

## 🔧 Advanced Features

### Custom Expiration Detection

The scanner automatically detects expiration dates, but you can also:

1. **Manual Entry**: User can edit the date field
2. **Custom Patterns**: Extend the regex patterns
3. **Multiple Dates**: First detected date is used

### Alert System Integration

When a document with an expiration date is saved:

```javascript
// Automatically creates alerts
if (expirationDate) {
  const daysUntil = calculateDaysUntil(expirationDate)
  
  if (daysUntil <= 30) {
    createAlert({
      type: 'expiration',
      severity: daysUntil <= 7 ? 'critical' : 'warning',
      message: `${docName} expires in ${daysUntil} days`,
      documentId: doc.id,
      expirationDate: doc.expirationDate
    })
  }
}
```

### Storage Strategy

Documents are stored in localStorage under these keys:

```javascript
// All uploaded documents
localStorage.getItem('uploaded-documents')

// Critical alerts (including expiration alerts)
localStorage.getItem('critical-alerts')
```

**Note**: Large files (images, PDFs) are NOT stored in localStorage to avoid quota issues. Only metadata is saved.

---

## 📱 Mobile Optimization

### Camera Features
- **Facing Mode**: Uses back camera on mobile
- **High Resolution**: Captures quality images
- **Real-time Preview**: See what you're scanning
- **Touch Focus**: Tap to focus (on supported devices)

### Responsive Design
- Full-screen on mobile
- Touch-optimized buttons
- Pinch to zoom (coming soon)
- Landscape support

---

## 🎨 Customization

### Styling
The component uses shadcn/ui components and can be styled with Tailwind:

```tsx
// In your component
<DialogContent className="max-w-4xl"> {/* Custom width */}
  {/* Scanner component */}
</DialogContent>
```

### OCR Language
Default is English, but can be extended:

```typescript
// In document-upload-scanner.tsx
Tesseract.recognize(
  imageSource,
  'eng+spa', // English + Spanish
  { /* options */ }
)
```

### Date Patterns
Add custom patterns in `extractExpirationDate()`:

```typescript
const patterns = [
  /your-custom-pattern/i,
  // existing patterns...
]
```

---

## 🐛 Troubleshooting

### OCR Not Working
- **Check Image Quality**: Blurry images won't extract well
- **Lighting**: Ensure good lighting when using camera
- **Text Size**: Very small text may not be recognized
- **Language**: Currently supports English only

### Camera Not Starting
- **Permissions**: Check browser camera permissions
- **HTTPS**: Camera requires secure context (https://)
- **Browser Support**: Use modern browsers (Chrome, Safari, Edge)

### Expiration Date Not Detected
- **Date Format**: Works best with standard US formats (MM/DD/YYYY)
- **Manual Entry**: You can always enter manually
- **Context**: Date needs context words like "expires", "valid until", etc.

### Performance Issues
- **Large Files**: Compress images before upload
- **Multiple Scans**: OCR is CPU-intensive, wait between scans
- **Mobile**: May be slower on older devices

---

## 📊 Data Flow

```
User Action
    ↓
Choose Upload or Camera
    ↓
[Upload Path]          [Camera Path]
Select File      →     Take Photo
    ↓                      ↓
    └──────────────────────┘
              ↓
    Image Processing
              ↓
    Tesseract OCR
              ↓
    Extract Text
              ↓
    Detect Dates
              ↓
    User Review
              ↓
    Save Document
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
localStorage        Alerts
    ↓                   ↓
UI Update          Dashboard
```

---

## 🎯 Best Practices

### For Users:
1. **Good Lighting**: Essential for camera scanning
2. **Clear Focus**: Hold camera steady
3. **Check Extracted Text**: Review OCR results
4. **Add Expiration Dates**: Even if not auto-detected
5. **Descriptive Names**: Use clear document names

### For Developers:
1. **Error Handling**: Wrap in try-catch blocks
2. **Loading States**: Show progress during OCR
3. **Validation**: Validate extracted data
4. **Cleanup**: Revoke blob URLs after use
5. **Testing**: Test with various document types

---

## 📈 Future Enhancements

### Planned Features:
- [ ] Multi-language OCR support
- [ ] Batch document upload
- [ ] Cloud storage integration
- [ ] Document categorization AI
- [ ] PDF text extraction (without OCR)
- [ ] QR code scanning
- [ ] Barcode scanning
- [ ] Document templates
- [ ] Search extracted text
- [ ] Export documents

---

## 🎊 Summary

The Universal Document Scanner is:
- ✅ **Universal**: Works anywhere in the app
- ✅ **Smart**: OCR + expiration detection
- ✅ **Easy**: Just import and use
- ✅ **Powerful**: Camera + file upload
- ✅ **Automatic**: Alerts and tracking
- ✅ **Flexible**: Highly customizable

**Use it everywhere documents need to be captured!**

---

## 📚 Examples in Current App

### Finance Domain
```typescript
// components/finance-simple/files-view.tsx
<DocumentUploadScanner
  open={showScanner}
  onOpenChange={setShowScanner}
  onDocumentSaved={handleDocumentSaved}
  category="financial"
  title="Upload or Scan Financial Document"
  description="Upload a document or take a photo..."
/>
```

### Health Domain (Example)
```typescript
// components/health/documents-view.tsx
<DocumentUploadScanner
  category="health"
  title="Upload Medical Document"
  description="Scan prescriptions for auto-refill reminders"
  onDocumentSaved={(doc) => {
    // Custom handling for medical documents
    if (doc.extractedText.includes('refill')) {
      // Set up refill reminders
    }
  }}
/>
```

---

**🚀 Start scanning documents throughout your app!**

*Component ready, OCR enabled, camera active!*

